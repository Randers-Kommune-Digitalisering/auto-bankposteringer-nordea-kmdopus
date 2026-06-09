import crypto from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { logger } from '~/lib/logger'
import { account } from '../../../app/lib/db/schema/account'
import {
  bankingDocument,
  bankingStatement,
  bankingStatementBalance,
} from '../../../app/lib/db/schema/statement'
import { bankingAgreementAccountDimension } from '../../../app/lib/db/schema/bankingAgreementAccountDimension'
import { transaction } from '../../../app/lib/db/schema/transaction'
import { transactionReference } from '../../../app/lib/db/schema/transactionReference'
import { transactionParty } from '../../../app/lib/db/schema/transactionParty'
import { parseCamt053Xml } from './camt053/parseCamt053Xml'
import {
  buildReferenceDedupKeyV2,
  normalizeReferenceValueV2,
  type TransactionReferenceTypeV2,
  type TransactionSourceScopeV2,
  type TransactionPartyRoleV2,
} from '../domain/transactionV2'

type BankProvider = 'danskebank' | 'nordea' | 'bankconnect'

type DbClient = {
  select: any
  insert: any
  update: any
}

type IngestCamt053DocumentInput = {
  runId: string
  provider: BankProvider
  filename?: string | null
  xml: string
}

function accountIdFromStatement(stmt: { iban?: string | null; currency?: string | null }): string | null {
  const iban = (stmt.iban ?? '').trim()
  const currency = (stmt.currency ?? '').trim()
  if (!iban || !currency) return null
  return `${iban}-${currency}`
}

function isTruthy(value: unknown): boolean {
  return /^(1|true|yes)$/i.test(String(value ?? '').trim())
}

function normalizeOptional(value: string | null | undefined): string | null {
  const normalized = String(value ?? '').trim()
  return normalized.length ? normalized : null
}

function buildTransactionReferenceRows(
  transactionId: string,
  tx: Awaited<ReturnType<typeof parseCamt053Xml>>['statements'][number]['transactions'][number],
): Array<{
  transactionId: string
  xmlPath: string
  sourceScope: TransactionSourceScopeV2
  referenceType: TransactionReferenceTypeV2
  sequenceNo: number
  valueRaw: string
  valueNormalized: string
}> {
  const candidates: Array<{
    xmlPath: string
    sourceScope: TransactionSourceScopeV2
    referenceType: TransactionReferenceTypeV2
    value: string | null | undefined
  }> = [
    { xmlPath: 'Ntry/NtryRef', sourceScope: 'entry', referenceType: 'reference', value: tx.ntryRef },
    { xmlPath: 'Ntry/AcctSvcrRef', sourceScope: 'entry', referenceType: 'reference', value: tx.ntryAcctSvcrRef },
    { xmlPath: 'Ntry/NtryDtls/TxDtls/Refs/AcctSvcrRef', sourceScope: 'tx', referenceType: 'reference', value: tx.txAcctSvcrRef },
    { xmlPath: 'Ntry/NtryDtls/TxDtls/Refs/EndToEndId', sourceScope: 'tx', referenceType: 'reference', value: tx.refsEndToEndId },
    { xmlPath: 'Ntry/NtryDtls/TxDtls/Refs/InstrId', sourceScope: 'tx', referenceType: 'reference', value: tx.refsInstrId },
    { xmlPath: 'Ntry/NtryDtls/TxDtls/Refs/PmtInfId', sourceScope: 'tx', referenceType: 'reference', value: tx.refsPmtInfId },
    { xmlPath: 'Ntry/NtryDtls/TxDtls/Refs/UETR', sourceScope: 'tx', referenceType: 'reference', value: tx.uetr },
    { xmlPath: 'Ntry/AddtlNtryInf', sourceScope: 'entry', referenceType: 'technical', value: tx.entryAdditionalInfo },
    { xmlPath: 'Ntry/NtryDtls/TxDtls/AddtlTxInf', sourceScope: 'tx', referenceType: 'freetext', value: tx.txAdditionalInfo },
    { xmlPath: 'Ntry/NtryDtls/TxDtls/RmtInf/Strd/CdtrRefInf/Ref', sourceScope: 'remittance', referenceType: 'remittance', value: tx.remittanceCreditorReference },
  ]

  for (const value of tx.remittanceUstrd ?? []) {
    candidates.push({
      xmlPath: 'Ntry/NtryDtls/TxDtls/RmtInf/Ustrd',
      sourceScope: 'remittance',
      referenceType: 'remittance',
      value,
    })
  }

  for (const value of tx.remittanceAdditional ?? []) {
    candidates.push({
      xmlPath: 'Ntry/NtryDtls/TxDtls/RmtInf/AddtlRmtInf',
      sourceScope: 'remittance',
      referenceType: 'remittance',
      value,
    })
  }

  const dedup = new Set<string>()
  const rows: Array<{
    transactionId: string
    xmlPath: string
    sourceScope: TransactionSourceScopeV2
    referenceType: TransactionReferenceTypeV2
    sequenceNo: number
    valueRaw: string
    valueNormalized: string
  }> = []

  for (const candidate of candidates) {
    const valueRaw = normalizeOptional(candidate.value)
    if (!valueRaw) continue
    const valueNormalized = normalizeReferenceValueV2(valueRaw)
    if (!valueNormalized) continue

    const dedupKey = buildReferenceDedupKeyV2({
      xmlPath: candidate.xmlPath,
      valueNormalized,
    })
    if (dedup.has(dedupKey)) continue
    dedup.add(dedupKey)

    rows.push({
      transactionId,
      xmlPath: candidate.xmlPath,
      sourceScope: candidate.sourceScope,
      referenceType: candidate.referenceType,
      sequenceNo: rows.length + 1,
      valueRaw,
      valueNormalized,
    })
  }

  return rows
}

function buildTransactionPartyRows(
  transactionId: string,
  tx: Awaited<ReturnType<typeof parseCamt053Xml>>['statements'][number]['transactions'][number],
): Array<{
  transactionId: string
  role: TransactionPartyRoleV2
  displayName: string | null
  identifier: string | null
  accountIban: string | null
  xmlPathName: string | null
  xmlPathId: string | null
  sequenceNo: number
}> {
  const candidates: Array<{
    role: TransactionPartyRoleV2
    displayName: string | null
    identifier: string | null
    accountIban: string | null
    xmlPathName: string
    xmlPathId: string
    xmlPathIban: string
  }> = [
    {
      role: 'debtor',
      displayName: tx.debtorName,
      identifier: tx.debtorId,
      accountIban: tx.debtorAccountIban,
      xmlPathName: 'Ntry/NtryDtls/TxDtls/RltdPties/Dbtr/Nm',
      xmlPathId: 'Ntry/NtryDtls/TxDtls/RltdPties/Dbtr/Id',
      xmlPathIban: 'Ntry/NtryDtls/TxDtls/RltdPties/DbtrAcct/Id/IBAN',
    },
    {
      role: 'creditor',
      displayName: tx.creditorName,
      identifier: tx.creditorId,
      accountIban: tx.creditorAccountIban,
      xmlPathName: 'Ntry/NtryDtls/TxDtls/RltdPties/Cdtr/Nm',
      xmlPathId: 'Ntry/NtryDtls/TxDtls/RltdPties/Cdtr/Id',
      xmlPathIban: 'Ntry/NtryDtls/TxDtls/RltdPties/CdtrAcct/Id/IBAN',
    },
    {
      role: 'ultimateDebtor',
      displayName: tx.ultimateDebtorName,
      identifier: null,
      accountIban: null,
      xmlPathName: 'Ntry/NtryDtls/TxDtls/RltdPties/UltmtDbtr/Nm',
      xmlPathId: 'Ntry/NtryDtls/TxDtls/RltdPties/UltmtDbtr/Id',
      xmlPathIban: 'Ntry/NtryDtls/TxDtls/RltdPties/UltmtDbtrAcct/Id/IBAN',
    },
    {
      role: 'ultimateCreditor',
      displayName: tx.ultimateCreditorName,
      identifier: null,
      accountIban: null,
      xmlPathName: 'Ntry/NtryDtls/TxDtls/RltdPties/UltmtCdtr/Nm',
      xmlPathId: 'Ntry/NtryDtls/TxDtls/RltdPties/UltmtCdtr/Id',
      xmlPathIban: 'Ntry/NtryDtls/TxDtls/RltdPties/UltmtCdtrAcct/Id/IBAN',
    },
  ]

  const rows: Array<{
    transactionId: string
    role: TransactionPartyRoleV2
    displayName: string | null
    identifier: string | null
    accountIban: string | null
    xmlPathName: string | null
    xmlPathId: string | null
    sequenceNo: number
  }> = []

  for (const candidate of candidates) {
    const displayName = normalizeOptional(candidate.displayName)
    const identifier = normalizeOptional(candidate.identifier)
    const accountIban = normalizeOptional(candidate.accountIban)

    if (!displayName && !identifier && !accountIban) continue

    rows.push({
      transactionId,
      role: candidate.role,
      displayName,
      identifier,
      accountIban,
      xmlPathName: displayName ? candidate.xmlPathName : null,
      xmlPathId: identifier ? candidate.xmlPathId : accountIban ? candidate.xmlPathIban : null,
      sequenceNo: rows.length + 1,
    })
  }

  return rows
}

async function ensureAccountExists(
  db: DbClient,
  input: { id: string; provider: BankProvider; iban: string; currency?: string | null; name?: string | null },
): Promise<void> {
  await db
    .insert(account)
    .values({
      id: input.id,
      provider: input.provider,
      iban: input.iban,
      currency: input.currency ?? null,
      name: input.name ?? null,
    })
    .onConflictDoNothing({ target: account.id })

  const rows = await db
    .select({ provider: account.provider })
    .from(account)
    .where(eq(account.id, input.id))
    .limit(1)

  const row = rows[0] ?? null
  if (!row) return
  if (String(row.provider) !== input.provider) {
    throw new Error(
      `CAMT.053 ingestion: derived account id ${input.id} already exists with provider=${row.provider}; got provider=${input.provider}`,
    )
  }
}

export async function ingestCamt053Document(
  db: DbClient,
  input: IngestCamt053DocumentInput,
): Promise<{
  documentId: string
  insertedStatements: number
  insertedBalances: number
  insertedTransactions: number
  deduplicated: boolean
}> {
  const log = logger.child({
    scope: 'banking.ingestCamt053Document',
    runId: input.runId,
    provider: input.provider,
  })

  const startedAt = Date.now()
  const xml = input.xml
  const contentHash = crypto.createHash('sha256').update(xml, 'utf8').digest('hex')

  log.info('CAMT.053 ingest start', {
    filename: input.filename ?? null,
    contentHashPrefix: contentHash.slice(0, 12),
    bytes: Buffer.byteLength(xml, 'utf8'),
  })

  const existing = await db
    .select({ id: bankingDocument.id })
    .from(bankingDocument)
    .where(eq(bankingDocument.contentHash, contentHash))
    .limit(1)

  if (existing.length) {
    log.info('CAMT.053 ingest deduplicated', {
      documentId: existing[0]!.id,
      ms: Date.now() - startedAt,
    })
    return {
      documentId: existing[0]!.id,
      insertedStatements: 0,
      insertedBalances: 0,
      insertedTransactions: 0,
      deduplicated: true,
    }
  }

  const parsed = parseCamt053Xml(xml)
  const messageId = parsed.messageId
  const createdAt = parsed.createdAt

  log.debug('CAMT.053 parsed', {
    messageId: messageId ?? null,
    createdAt: createdAt ?? null,
    statements: parsed.statements.length,
  })

  const insertedDocument = await db
    .insert(bankingDocument)
    .values({
      accountId: null,
      format: 'camt053',
      filename: input.filename ?? null,
      content: xml,
      contentHash,
      messageId,
      createdAt,
    })
    .returning({ id: bankingDocument.id })

  const documentId = insertedDocument[0]!.id

  const ignoredRows = await db
    .select({ iban: bankingAgreementAccountDimension.iban, value: bankingAgreementAccountDimension.dimensionValue })
    .from(bankingAgreementAccountDimension)
    .where(and(
      eq(bankingAgreementAccountDimension.provider, input.provider as any),
      eq(bankingAgreementAccountDimension.dimensionKey, 'ignore_ingestion'),
    ))

  const ignoredIbans = new Set(
    ignoredRows
      .filter((row) => isTruthy(row.value))
      .map((row) => String(row.iban).trim().toUpperCase()),
  )

  let insertedStatements = 0
  let insertedBalances = 0
  let insertedTransactions = 0

  for (const stmt of parsed.statements) {
    const stmtIban = String(stmt.iban ?? '').trim().toUpperCase()
    if (stmtIban && ignoredIbans.has(stmtIban)) {
      log.info('CAMT.053 statement skipped (ignore_ingestion=true)', {
        documentId,
        iban: stmtIban,
        statementId: stmt.statementId ?? null,
      })
      continue
    }

    const derivedAccountId = accountIdFromStatement(stmt)
    if (!derivedAccountId) {
      throw new Error('CAMT.053 ingestion: could not derive account id (missing IBAN/currency in statement)')
    }

    await ensureAccountExists(db, {
      id: derivedAccountId,
      provider: input.provider,
      iban: stmt.iban!,
      currency: stmt.currency ?? null,
      name: stmt.ownerName ?? null,
    })

    const statementInsert = await db
      .insert(bankingStatement)
      .values({
        documentId,
        statementId: stmt.statementId,
        electronicSeqNo: stmt.electronicSeqNo,
        legalSeqNo: stmt.legalSeqNo,
        statementCreatedAt: stmt.statementCreatedAt,
        iban: stmt.iban,
        currency: stmt.currency,
        ownerName: stmt.ownerName,
        servicerBic: stmt.servicerBic,
        fromDate: stmt.fromDate,
        toDate: stmt.toDate,
      })
      .returning({ id: bankingStatement.id })

    const statementRowId = statementInsert[0]!.id
    insertedStatements += 1

    for (const bal of stmt.balances) {
      await db.insert(bankingStatementBalance).values({
        statementId: statementRowId,
        typeCode: bal.typeCode,
        amount: bal.amount,
        currency: bal.currency,
        creditDebitIndicator: (bal.creditDebitIndicator ?? null) as any,
        balanceDate: bal.balanceDate,
      })
      insertedBalances += 1
    }

    for (const tx of stmt.transactions) {
      const insertedTx = await db.insert(transaction).values({
        runId: input.runId,
        accountId: derivedAccountId,
        statementId: statementRowId,
        entryIndex: tx.entryIndex,
        entrySubIndex: tx.entrySubIndex,
        amount: tx.amount,
        currency: tx.currency,
        creditDebitIndicator: (tx.creditDebitIndicator ?? null) as any,
        status: tx.status,
        bookingDate: tx.bookingDate,
        valueDate: tx.valueDate,
        ntryRef: tx.ntryRef,
        ntryAcctSvcrRef: tx.ntryAcctSvcrRef,
        entryAdditionalInfo: tx.entryAdditionalInfo,
        txAcctSvcrRef: tx.txAcctSvcrRef,
        refsEndToEndId: tx.refsEndToEndId,
        refsInstrId: tx.refsInstrId,
        refsPmtInfId: tx.refsPmtInfId,
        uetr: tx.uetr,
        txAdditionalInfo: tx.txAdditionalInfo,
        bkTxCdDomain: tx.bkTxCdDomain,
        bkTxCdFamily: tx.bkTxCdFamily,
        bkTxCdSubFamily: tx.bkTxCdSubFamily,
        bkTxCdProprietary: tx.bkTxCdProprietary,
        debtorName: tx.debtorName,
        debtorId: tx.debtorId,
        debtorAccountIban: tx.debtorAccountIban,
        creditorName: tx.creditorName,
        creditorId: tx.creditorId,
        creditorAccountIban: tx.creditorAccountIban,
        ultimateDebtorName: tx.ultimateDebtorName,
        ultimateCreditorName: tx.ultimateCreditorName,
        remittanceUstrd: tx.remittanceUstrd.length ? tx.remittanceUstrd : null,
        remittanceCreditorReference: tx.remittanceCreditorReference,
        remittanceAdditional: tx.remittanceAdditional.length ? tx.remittanceAdditional : null,
      }).returning({ id: transaction.id })

      const transactionRowId = insertedTx[0]?.id
      if (transactionRowId) {
        const referenceRows = buildTransactionReferenceRows(transactionRowId, tx)
        if (referenceRows.length) {
          await db.insert(transactionReference).values(referenceRows)
        }

        const partyRows = buildTransactionPartyRows(transactionRowId, tx)
        if (partyRows.length) {
          await db.insert(transactionParty).values(partyRows)
        }
      }

      insertedTransactions += 1
    }
  }

  log.info('CAMT.053 ingest done', {
    documentId,
    insertedStatements,
    insertedBalances,
    insertedTransactions,
    ms: Date.now() - startedAt,
  })

  return {
    documentId,
    insertedStatements,
    insertedBalances,
    insertedTransactions,
    deduplicated: false,
  }
}
