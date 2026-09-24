import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { eq, sql } from 'drizzle-orm'

import { ingestCamt053Document } from '../../engine/banking-ingestion/handlers/ingestCamt053Document'
import { extractCprFromTransaction } from '../../engine/matching/domain/postingUtils'
import crypto from 'node:crypto'
import { parseCamt053Xml } from '../../engine/banking-ingestion/handlers/camt053/parseCamt053Xml'
import { transactionReference } from '../../app/lib/db/schema/transactionReference'

function isDatabaseReachableError(err: unknown): boolean {
  const message = String((err as any)?.message ?? err)
  return message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')
}

async function withNodeEnv<T>(nodeEnv: string, callback: () => Promise<T>): Promise<T> {
  const previousNodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = nodeEnv
  try {
    return await callback()
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previousNodeEnv
  }
}

describe('ingestCamt053Document (integration)', () => {
  it('ingests Nordea example and is idempotent by content hash', async () => {
    // Import db lazily so vitest.setup has time to populate env vars.
    const { default: db } = await import('../../app/lib/db/index')
    const { run } = await import('../../app/lib/db/schema/run')
    const { bankingDocument, bankingStatement, bankingStatementBalance } = await import(
      '../../app/lib/db/schema/statement'
    )
    const { transaction } = await import('../../app/lib/db/schema/transaction')

    const examplePath = join(
      process.cwd(),
      'resources',
      'banking',
      'nordea',
      'examples',
      'camt.053e.xml',
    )
    const fixtureXml = await readFile(examplePath, 'utf8')
    const xml = fixtureXml.replace('<Ustrd>', '<Ustrd>CPR 010203-1234; ')
    if (xml === fixtureXml) throw new Error('Test setup failed: fixture has no Ustrd element')

    const parsed = parseCamt053Xml(xml)
    const stmt0 = parsed.statements[0]
    const derivedAccountId = stmt0?.iban && stmt0?.currency ? `${stmt0.iban}-${stmt0.currency}` : null
    const legacyAccountId = stmt0?.iban ? `${stmt0.iban}` : null
    if (!derivedAccountId) {
      throw new Error('Test setup failed: could not derive account id from CAMT.053 example')
    }

    const contentHash = crypto.createHash('sha256').update(xml, 'utf8').digest('hex')
    // Use fixed UUIDs so cleanup can be scoped precisely.
    const runId1 = '00000000-0000-0000-0000-000000000001'
    const runId2 = '00000000-0000-0000-0000-000000000002'

    // Clean only rows created by this test.
    try {
      // Delete transactions linked to statements/documents for this content hash.
      await db.execute(sql`DELETE FROM transaction_processing WHERE transaction_id IN (
        SELECT t.id
        FROM "transaction" t
        JOIN banking_statement s ON s.id = t.statement_id
        JOIN banking_document d ON d.id = s.document_id
        WHERE d.content_hash = ${contentHash}
      )`)

      await db.execute(sql`DELETE FROM "transaction" WHERE statement_id IN (
        SELECT s.id
        FROM banking_statement s
        JOIN banking_document d ON d.id = s.document_id
        WHERE d.content_hash = ${contentHash}
      )`)

      // Statements + balances linked to this account via banking_document.
      await db.execute(
        sql`DELETE FROM banking_statement_balance WHERE statement_id IN (
          SELECT s.id
          FROM banking_statement s
          JOIN banking_document d ON d.id = s.document_id
          WHERE d.content_hash = ${contentHash}
        )`
      )
      await db.execute(
        sql`DELETE FROM banking_statement WHERE document_id IN (
          SELECT id FROM banking_document WHERE content_hash = ${contentHash}
        )`
      )
      await db.execute(sql`DELETE FROM banking_document WHERE content_hash = ${contentHash}`)

      // Runs created by this test.
      await db.execute(sql`DELETE FROM run WHERE id IN (${runId1}::uuid, ${runId2}::uuid)`)
      await db.execute(sql`DELETE FROM account WHERE id IN (${derivedAccountId}, ${legacyAccountId})`)
    } catch (err) {
      if (isDatabaseReachableError(err)) {
        // Give a clearer error when Postgres isn't running.
        throw new Error(
          `Postgres not reachable for integration test. Start it with: docker compose up -d db\nDATABASE_URL=${process.env.DATABASE_URL}`
        )
      }
      throw err
    }

    const bookingDate1 = new Date('2026-06-03T12:00:00.000Z')
    const bookingDate2 = new Date('2026-06-04T12:00:00.000Z')

    await db.insert(run).values({ id: runId1, bookingDate: bookingDate1, status: 'indlæser' })

    const result1 = await withNodeEnv('development', () =>
      db.transaction((trx) => ingestCamt053Document(trx as any, {
        runId: runId1,
        provider: 'nordea',
        filename: 'camt.053e.xml',
        xml,
      })),
    )

    expect(result1.deduplicated).toBe(false)
    expect(result1.insertedStatements).toBe(1)
    expect(result1.insertedBalances).toBe(3)
    expect(result1.insertedTransactions).toBe(8)

    await db.insert(run).values({ id: runId2, bookingDate: bookingDate2, status: 'indlæser' })

    const result2 = await withNodeEnv('development', () =>
      db.transaction((trx) => ingestCamt053Document(trx as any, {
        runId: runId2,
        provider: 'nordea',
        filename: 'camt.053e.xml',
        xml,
      })),
    )

    expect(result2.deduplicated).toBe(true)
    expect(result2.insertedStatements).toBe(0)
    expect(result2.insertedBalances).toBe(0)
    expect(result2.insertedTransactions).toBe(0)

    const [{ c: docCountRaw }] = await db
      .select({ c: sql`count(*)` })
      .from(bankingDocument)
      .where(eq(bankingDocument.contentHash, contentHash))

    const [{ c: stmtCountRaw }] = await db
      .select({ c: sql`count(*)` })
      .from(bankingStatement)
      .innerJoin(bankingDocument, eq(bankingStatement.documentId, bankingDocument.id))
      .where(eq(bankingDocument.contentHash, contentHash))

    const [{ c: balCountRaw }] = await db
      .select({ c: sql`count(*)` })
      .from(bankingStatementBalance)
      .innerJoin(bankingStatement, eq(bankingStatementBalance.statementId, bankingStatement.id))
      .innerJoin(bankingDocument, eq(bankingStatement.documentId, bankingDocument.id))
      .where(eq(bankingDocument.contentHash, contentHash))

    const [{ c: txCountRaw }] = await db
      .select({ c: sql`count(*)` })
      .from(transaction)
      .where(eq(transaction.accountId, derivedAccountId))

    expect(Number(docCountRaw)).toBe(1)
    expect(Number(stmtCountRaw)).toBe(1)
    expect(Number(balCountRaw)).toBe(3)
    expect(Number(txCountRaw)).toBe(8)

    const [storedDocument] = await db
      .select({ content: bankingDocument.content })
      .from(bankingDocument)
      .where(eq(bankingDocument.contentHash, contentHash))
      .limit(1)
    expect(storedDocument?.content).toContain('[CPR REDACTED]')
    expect(storedDocument?.content).not.toContain('0102031234')

    const storedTransactions = await db
      .select({
        id: transaction.id,
        amount: transaction.amount,
        debtorName: transaction.debtorName,
        debtorId: transaction.debtorId,
        creditorName: transaction.creditorName,
        creditorId: transaction.creditorId,
        entryAdditionalInfo: transaction.entryAdditionalInfo,
        txAdditionalInfo: transaction.txAdditionalInfo,
        remittanceUstrd: transaction.remittanceUstrd,
        remittanceAdditional: transaction.remittanceAdditional,
      })
      .from(transaction)
      .where(eq(transaction.runId, runId1))
    const injectedTransaction = storedTransactions.find((row) =>
      row.remittanceUstrd?.some((value) => value.includes('[CPR REDACTED]')),
    )
    expect(injectedTransaction).toBeTruthy()
    for (const row of storedTransactions) {
      expect(extractCprFromTransaction({
        transactionId: row.id,
        amount: Number(row.amount),
        statusDimensions: {},
        debtorName: row.debtorName,
        debtorId: row.debtorId,
        creditorName: row.creditorName,
        creditorId: row.creditorId,
        entryAdditionalInfo: row.entryAdditionalInfo,
        txAdditionalInfo: row.txAdditionalInfo,
        remittanceUstrd: row.remittanceUstrd,
        remittanceAdditional: row.remittanceAdditional,
      })).toBeUndefined()
    }

    const references = await db
      .select({ valueRaw: transactionReference.valueRaw, valueNormalized: transactionReference.valueNormalized })
      .from(transactionReference)
      .innerJoin(transaction, eq(transactionReference.transactionId, transaction.id))
      .where(eq(transaction.runId, runId1))
    expect(references.some((row) => row.valueRaw.includes('[CPR REDACTED]'))).toBe(true)
    expect(references.some((row) => row.valueRaw.includes('010203-1234'))).toBe(false)
    expect(references.some((row) => row.valueNormalized.includes('0102031234'))).toBe(false)

    // Sanity: document exists by content hash.
    const docs = await db
      .select({ id: bankingDocument.id })
      .from(bankingDocument)
      .where(eq(bankingDocument.contentHash, contentHash))
      .limit(1)
    expect(docs[0]?.id).toBeTruthy()

    // Sanity: the second run exists but did not insert more docs.
    const runs = await db.select({ id: run.id, status: run.status }).from(run).where(eq(run.id, runId2)).limit(1)
    expect(runs[0]?.id).toBe(runId2)
  })
})
