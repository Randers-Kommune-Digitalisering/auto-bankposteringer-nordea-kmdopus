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
import { prepareCamt053XmlForIngestion } from './camt053/anonymizeCamt053Cpr'
import { parseCamt053Xml } from './camt053/parseCamt053Xml'

type BankProvider = 'danskebank' | 'nordea' | 'bankconnect'

type DbClient = {
  select: any
  insert: any
}

type IngestCamt053DocumentInput = {
  runId: string
  provider: BankProvider
  filename?: string | null
  xml: string
}

export type PreparedCamt053Document = {
  filename: string | null
  contentHash: string
  parsed: ReturnType<typeof parseCamt053Xml>
}

const INSERT_BATCH_SIZE = 250

function accountIdFromStatement(stmt: { iban?: string | null; currency?: string | null }): string | null {
  const iban = (stmt.iban ?? '').trim()
  const currency = (stmt.currency ?? '').trim()
  if (!iban || !currency) return null
  return `${iban}-${currency}`
}

function isTruthy(value: unknown): boolean {
  return /^(1|true|yes)$/i.test(String(value ?? '').trim())
}

export function prepareCamt053Document(input: Pick<IngestCamt053DocumentInput, 'filename' | 'xml'>): PreparedCamt053Document {
  const contentHash = crypto.createHash('sha256').update(input.xml, 'utf8').digest('hex')
  const xml = prepareCamt053XmlForIngestion(input.xml, process.env.NODE_ENV)

  return {
    filename: input.filename ?? null,
    contentHash,
    parsed: parseCamt053Xml(xml),
  }
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
  if (row && String(row.provider) !== input.provider) {
    throw new Error(
      `CAMT.053 ingestion: derived account id ${input.id} already exists with provider=${row.provider}; got provider=${input.provider}`,
    )
  }
}

export async function persistPreparedCamt053Document(
  db: DbClient,
  input: { runId: string; provider: BankProvider; prepared: PreparedCamt053Document },
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
  const { prepared } = input
  const parsed = prepared.parsed
  const contentHash = prepared.contentHash

  const existing = await db
    .select({ id: bankingDocument.id })
    .from(bankingDocument)
    .where(eq(bankingDocument.contentHash, contentHash))
    .limit(1)

  if (existing.length) {
    return {
      documentId: existing[0]!.id,
      insertedStatements: 0,
      insertedBalances: 0,
      insertedTransactions: 0,
      deduplicated: true,
    }
  }

  const insertedDocument = await db
    .insert(bankingDocument)
    .values({
      accountId: null,
      format: 'camt053',
      filename: prepared.filename,
      contentHash,
      messageId: parsed.messageId,
      createdAt: parsed.createdAt,
    })
    .returning({ id: bankingDocument.id })

  const documentId = insertedDocument[0]!.id
  const ignoredRows: Array<{ iban: string; value: string | null }> = await db
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

    const balanceRows = stmt.balances.map((balance) => ({
      statementId: statementRowId,
      typeCode: balance.typeCode,
      amount: balance.amount,
      currency: balance.currency,
      creditDebitIndicator: (balance.creditDebitIndicator ?? null) as any,
      balanceDate: balance.balanceDate,
    }))
    for (let offset = 0; offset < balanceRows.length; offset += INSERT_BATCH_SIZE) {
      const batch = balanceRows.slice(offset, offset + INSERT_BATCH_SIZE)
      if (batch.length) {
        await db.insert(bankingStatementBalance).values(batch)
        insertedBalances += batch.length
      }
    }

    const transactionRows = stmt.transactions.map((tx) => ({
      runId: input.runId,
      accountId: derivedAccountId,
      statementId: statementRowId,
      entryIndex: tx.entryIndex,
      underlyingTransactionCount: tx.underlyingTransactionCount,
      amount: tx.amount,
      currency: tx.currency,
      creditDebitIndicator: (tx.creditDebitIndicator ?? null) as any,
      status: tx.status,
      bookingDate: tx.bookingDate,
      valueDate: tx.valueDate,
      ntryRef: tx.ntryRef,
      ntryAcctSvcrRef: tx.ntryAcctSvcrRef,
      entryAdditionalInfo: tx.entryAdditionalInfo,
      bkTxCdDomain: tx.bkTxCdDomain,
      bkTxCdFamily: tx.bkTxCdFamily,
      bkTxCdSubFamily: tx.bkTxCdSubFamily,
      bkTxCdProprietary: tx.bkTxCdProprietary,
    }))

    for (let offset = 0; offset < transactionRows.length; offset += INSERT_BATCH_SIZE) {
      const batch = transactionRows.slice(offset, offset + INSERT_BATCH_SIZE)
      if (batch.length) {
        await db.insert(transaction).values(batch)
        insertedTransactions += batch.length
      }
    }
  }

  log.debug('CAMT.053 ingest done', {
    documentId,
    insertedStatements,
    insertedBalances,
    insertedTransactions,
  })

  return {
    documentId,
    insertedStatements,
    insertedBalances,
    insertedTransactions,
    deduplicated: false,
  }
}

export async function ingestCamt053Document(
  db: DbClient,
  input: IngestCamt053DocumentInput,
): ReturnType<typeof persistPreparedCamt053Document> {
  const startedAt = Date.now()
  const prepared = prepareCamt053Document(input)
  const result = await persistPreparedCamt053Document(db, {
    runId: input.runId,
    provider: input.provider,
    prepared,
  })

  logger.debug('CAMT.053 document prepared and persisted', {
    runId: input.runId,
    provider: input.provider,
    filename: input.filename ?? null,
    contentHashPrefix: prepared.contentHash.slice(0, 12),
    bytes: Buffer.byteLength(input.xml, 'utf8'),
    deduplicated: result.deduplicated,
    ms: Date.now() - startedAt,
  })
  return result
}
