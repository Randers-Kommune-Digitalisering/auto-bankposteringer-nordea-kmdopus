import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { eq, inArray, sql } from 'drizzle-orm'

import {
  persistPreparedCamt053Document,
  prepareCamt053Document,
} from '../../engine/banking-ingestion/handlers/ingestCamt053Document'
import { parseCamt053Xml } from '../../engine/banking-ingestion/handlers/camt053/parseCamt053Xml'

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

describe('persistPreparedCamt053Document (integration)', () => {
  it('stores one amount-authoritative aggregate per CAMT entry and deduplicates by hash', async () => {
    const { default: db } = await import('../../app/lib/db/index')
    const { run } = await import('../../app/lib/db/schema/run')
    const { account } = await import('../../app/lib/db/schema/account')
    const { bankingDocument, bankingStatement, bankingStatementBalance } = await import(
      '../../app/lib/db/schema/statement'
    )
    const { transaction, transactionProcessing } = await import('../../app/lib/db/schema/transaction')

    const fixturePath = join(
      process.cwd(),
      'resources',
      'banking',
      'nordea',
      'examples',
      'camt.053e.xml',
    )
    const fixtureXml = await readFile(fixturePath, 'utf8')
    const testToken = randomUUID().replaceAll('-', '')
    const iban = `DK${testToken.slice(0, 16).replace(/[a-f]/gi, '0')}`
    const xml = fixtureXml
      .replace('DK0320009876543210', iban)
      .replace('2020-09-25-030731-DKK8496', `test-${testToken}`)
      .replace('<Ustrd>', '<Ustrd>CPR 010203-1234; ')
    if (xml === fixtureXml) throw new Error('Test setup failed: fixture was not changed')

    const prepared = await withNodeEnv('development', async () => prepareCamt053Document({
      filename: 'camt.053e.xml',
      xml,
    }))
    const expectedTransactions = parseCamt053Xml(xml).statements[0]!.transactions
    const derivedAccountId = `${iban}-${expectedTransactions[0]?.currency ?? 'DKK'}`
    const runId1 = randomUUID()
    const runId2 = randomUUID()
    const testYear = 2200 + Number.parseInt(testToken.slice(0, 3), 16) % 1000
    const runDate1 = new Date(Date.UTC(testYear, 0, 1))
    const runDate2 = new Date(Date.UTC(testYear, 0, 2))
    let databaseInitialized = false

    try {
      await db.insert(run).values([
        { id: runId1, bookingDate: runDate1, status: 'indlæser' },
        { id: runId2, bookingDate: runDate2, status: 'indlæser' },
      ])
      databaseInitialized = true

      const result1 = await db.transaction((trx) => persistPreparedCamt053Document(trx, {
        runId: runId1,
        provider: 'nordea',
        prepared,
      }))
      expect(result1.deduplicated).toBe(false)
      expect(result1.insertedStatements).toBe(1)
      expect(result1.insertedBalances).toBe(3)
      expect(result1.insertedTransactions).toBe(expectedTransactions.length)
      expect(expectedTransactions.length).toBe(6)

      const result2 = await db.transaction((trx) => persistPreparedCamt053Document(trx, {
        runId: runId2,
        provider: 'nordea',
        prepared,
      }))
      expect(result2.deduplicated).toBe(true)
      expect(result2.insertedStatements).toBe(0)
      expect(result2.insertedBalances).toBe(0)
      expect(result2.insertedTransactions).toBe(0)

      const documents = await db
        .select({ id: bankingDocument.id })
        .from(bankingDocument)
        .where(eq(bankingDocument.contentHash, prepared.contentHash))
      expect(documents).toHaveLength(1)

      const storedTransactions = await db
        .select({
          entryIndex: transaction.entryIndex,
          amount: transaction.amount,
          underlyingTransactionCount: transaction.underlyingTransactionCount,
          entryAdditionalInfo: transaction.entryAdditionalInfo,
        })
        .from(transaction)
        .where(eq(transaction.runId, runId1))
        .orderBy(transaction.entryIndex)
      expect(storedTransactions).toHaveLength(expectedTransactions.length)
      expect(storedTransactions.map((row) => ({
        entryIndex: row.entryIndex,
        amount: String(row.amount),
        underlyingTransactionCount: row.underlyingTransactionCount,
      }))).toEqual(expectedTransactions.map((row) => ({
        entryIndex: row.entryIndex,
        amount: row.amount,
        underlyingTransactionCount: row.underlyingTransactionCount,
      })))
      expect(JSON.stringify(storedTransactions)).not.toContain('CPR')
      expect(JSON.stringify(storedTransactions)).not.toContain('Ustrd')
      expect(storedTransactions.some((row) => row.entryAdditionalInfo?.includes('0102031234'))).toBe(false)

      const transactionCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(transaction)
        .where(eq(transaction.accountId, derivedAccountId))
      expect(Number(transactionCount[0]?.count)).toBe(expectedTransactions.length)
    } finally {
      if (databaseInitialized) {
        await db.delete(transactionProcessing).where(inArray(
          transactionProcessing.transactionId,
          db.select({ id: transaction.id }).from(transaction).where(inArray(transaction.runId, [runId1, runId2])),
        ))
        await db.delete(transaction).where(inArray(transaction.runId, [runId1, runId2]))
        await db.execute(sql`
          delete from banking_statement_balance
          where statement_id in (
            select id from banking_statement where document_id in (
              select id from banking_document where content_hash = ${prepared.contentHash}
            )
          )
        `)
        await db.execute(sql`
          delete from banking_statement
          where document_id in (
            select id from banking_document where content_hash = ${prepared.contentHash}
          )
        `)
        await db.delete(bankingDocument).where(eq(bankingDocument.contentHash, prepared.contentHash))
        await db.delete(account).where(eq(account.id, derivedAccountId))
        await db.delete(run).where(inArray(run.id, [runId1, runId2]))
      }
    }
  })
})
