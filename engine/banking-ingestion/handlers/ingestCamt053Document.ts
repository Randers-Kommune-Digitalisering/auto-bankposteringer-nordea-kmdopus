import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import { logger } from '~/lib/logger'
import { account } from '../../../app/lib/db/schema/account'
import {
  bankingDocument,
  bankingStatement,
  bankingStatementBalance,
} from '../../../app/lib/db/schema/statement'
import { transaction } from '../../../app/lib/db/schema/transaction'
import { parseCamt053Xml } from './camt053/parseCamt053Xml'

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
  const ccy = (stmt.currency ?? '').trim()
  if (!iban || !ccy) return null
  return `${iban}-${ccy}`
}

async function ensureAccountExists(
  db: DbClient,
  input: { id: string; provider: BankProvider; name?: string | null; statusAccount: number },
): Promise<void> {
  await db
    .insert(account)
    .values({
      id: input.id,
      provider: input.provider,
      name: input.name ?? null,
      statusAccount: input.statusAccount,
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

  let insertedStatements = 0
  let insertedBalances = 0
  let insertedTransactions = 0

  const defaultStatusAccount = 9999

  for (const stmt of parsed.statements) {
    const derivedAccountId = accountIdFromStatement(stmt)
    if (!derivedAccountId) {
      throw new Error('CAMT.053 ingestion: could not derive account id (missing IBAN/currency in statement)')
    }

    await ensureAccountExists(db, {
      id: derivedAccountId,
      provider: input.provider,
      name: stmt.ownerName ?? null,
      statusAccount: defaultStatusAccount,
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
      await db.insert(transaction).values({
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
      })
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
