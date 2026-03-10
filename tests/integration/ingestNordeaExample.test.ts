import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { eq, sql } from 'drizzle-orm'

import { ingestCamt053Document } from '../../engine/banking-ingestion/handlers/ingestCamt053Document'

function isDatabaseReachableError(err: unknown): boolean {
  const message = String((err as any)?.message ?? err)
  return message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')
}

describe('ingestCamt053Document (integration)', () => {
  it('ingests Nordea example and is idempotent by content hash', async () => {
    // Import db lazily so vitest.setup has time to populate env vars.
    const { default: db } = await import('../../app/lib/db/index')
    const { account } = await import('../../app/lib/db/schema/account')
    const { run } = await import('../../app/lib/db/schema/run')
    const { bankingDocument, bankingStatement, bankingStatementBalance } = await import(
      '../../app/lib/db/schema/statement'
    )
    const { transaction } = await import('../../app/lib/db/schema/transaction')

    const accountId = 'TEST-ACCOUNT'
    // Use fixed UUIDs so cleanup can be scoped precisely.
    const runId1 = '00000000-0000-0000-0000-000000000001'
    const runId2 = '00000000-0000-0000-0000-000000000002'

    // Clean only rows created by this test.
    try {
      await db.execute(
        sql`DELETE FROM transaction_processing WHERE transaction_id IN (
          SELECT id FROM "transaction" WHERE account = ${accountId}
        )`
      )
      await db.execute(sql`DELETE FROM "transaction" WHERE account = ${accountId}`)

      // Statements + balances linked to this account via banking_document.
      await db.execute(
        sql`DELETE FROM banking_statement_balance WHERE statement_id IN (
          SELECT s.id
          FROM banking_statement s
          JOIN banking_document d ON d.id = s.document_id
          WHERE d.account_id = ${accountId}
        )`
      )
      await db.execute(
        sql`DELETE FROM banking_statement WHERE document_id IN (
          SELECT id FROM banking_document WHERE account_id = ${accountId}
        )`
      )
      await db.execute(sql`DELETE FROM banking_document WHERE account_id = ${accountId}`)

      // Runs created by this test.
      await db.execute(sql`DELETE FROM run WHERE id IN (${runId1}::uuid, ${runId2}::uuid)`)
      await db.execute(sql`DELETE FROM account WHERE id = ${accountId}`)
    } catch (err) {
      if (isDatabaseReachableError(err)) {
        // Give a clearer error when Postgres isn't running.
        throw new Error(
          `Postgres not reachable for integration test. Start it with: docker compose up -d db\nDATABASE_URL=${process.env.DATABASE_URL}`
        )
      }
      throw err
    }
    await db.insert(account).values({ id: accountId, name: 'Test', statusAccount: 95999999 })

    const examplePath = join(
      process.cwd(),
      'lib',
      'banking',
      'nordea',
      'examples',
      'camt.053e.xml',
    )
    const xml = await readFile(examplePath, 'utf8')

    await db.insert(run).values({ id: runId1, bookingDate: new Date(), status: 'indlæser' })

    const result1 = await db.transaction(async (trx) => {
      return ingestCamt053Document(trx as any, {
        runId: runId1,
        accountId,
        filename: 'camt.053e.xml',
        xml,
      })
    })

    expect(result1.deduplicated).toBe(false)
    expect(result1.insertedStatements).toBe(1)
    expect(result1.insertedBalances).toBe(3)
    expect(result1.insertedTransactions).toBe(8)

    await db.insert(run).values({ id: runId2, bookingDate: new Date(), status: 'indlæser' })

    const result2 = await db.transaction(async (trx) => {
      return ingestCamt053Document(trx as any, {
        runId: runId2,
        accountId,
        filename: 'camt.053e.xml',
        xml,
      })
    })

    expect(result2.deduplicated).toBe(true)
    expect(result2.insertedStatements).toBe(0)
    expect(result2.insertedBalances).toBe(0)
    expect(result2.insertedTransactions).toBe(0)

    const [{ c: docCountRaw }] = await db.select({ c: sql`count(*)` }).from(bankingDocument)
    const [{ c: stmtCountRaw }] = await db.select({ c: sql`count(*)` }).from(bankingStatement)
    const [{ c: balCountRaw }] = await db.select({ c: sql`count(*)` }).from(bankingStatementBalance)
    const [{ c: txCountRaw }] = await db.select({ c: sql`count(*)` }).from(transaction)

    expect(Number(docCountRaw)).toBe(1)
    expect(Number(stmtCountRaw)).toBe(1)
    expect(Number(balCountRaw)).toBe(3)
    expect(Number(txCountRaw)).toBe(8)

    // Sanity: document should be linked to the correct account.
    const docs = await db.select({ accountId: bankingDocument.accountId }).from(bankingDocument).limit(1)
    expect(docs[0]?.accountId).toBe(accountId)

    // Sanity: the second run exists but did not insert more docs.
    const runs = await db.select({ id: run.id, status: run.status }).from(run).where(eq(run.id, runId2)).limit(1)
    expect(runs[0]?.id).toBe(runId2)
  })
})
