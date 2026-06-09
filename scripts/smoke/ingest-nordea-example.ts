import 'dotenv/config'
import crypto from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import dns from 'node:dns/promises'
import { eq, sql } from 'drizzle-orm'

import { account } from '../../app/lib/db/schema/account'
import { run } from '../../app/lib/db/schema/run'
import { bankingDocument, bankingStatement, bankingStatementBalance } from '../../app/lib/db/schema/statement'
import { transaction } from '../../app/lib/db/schema/transaction'
import { ingestCamt053Document } from '../../engine/banking-ingestion/handlers/ingestCamt053Document'

async function normalizeDatabaseUrlForLocalScripts() {
  const raw = process.env.DATABASE_URL
  if (!raw) return
  try {
    const url = new URL(raw)
    if (url.hostname === 'db') {
      try {
        await dns.lookup('db')
        return
      } catch {
        url.hostname = 'localhost'
        process.env.DATABASE_URL = url.toString()
      }
    }
  } catch {
    // Ignore invalid URLs; db client will emit a useful runtime error.
  }
}

async function main() {
  await normalizeDatabaseUrlForLocalScripts()
  const { default: db } = await import('../../app/lib/db/index')

  const accountId = 'SMOKE-ACCOUNT'

  // Ensure at least one account exists (the ingestion is account-scoped).
  const existingAccount = await db
    .select({ id: account.id })
    .from(account)
    .where(eq(account.id, accountId))
    .limit(1)

  if (!existingAccount.length) {
    await db.insert(account).values({
      id: accountId,
      name: 'Smoke test account',
      provider: 'nordea',
      iban: 'SMOKE-IBAN',
      currency: 'DKK',
    })
  }

  const bookingDate = new Date()
  bookingDate.setHours(0, 0, 0, 0)

  const existingRun = await db
    .select({ id: run.id })
    .from(run)
    .where(eq(run.bookingDate, bookingDate))
    .limit(1)

  const runId = existingRun[0]?.id ?? crypto.randomUUID()

  if (existingRun.length) {
    await db
      .update(run)
      .set({ status: 'indlæser' })
      .where(eq(run.id, runId))
  } else {
    await db.insert(run).values({ id: runId, bookingDate, status: 'indlæser' })
  }

  const examplePath = join(
    process.cwd(),
    'resources',
    'banking',
    'nordea',
    'examples',
    'camt.053e.xml',
  )
  const xml = await readFile(examplePath, 'utf8')

  const ingestResult = await db.transaction(async (trx) => {
    return ingestCamt053Document(trx as any, {
      runId,
      provider: 'nordea',
      filename: 'camt.053e.xml',
      xml,
    })
  })

  await db.update(run).set({ status: 'udført' }).where(eq(run.id, runId))

  const [{ c: docCountRaw }] = await db
    .select({ c: sql`count(*)` })
    .from(bankingDocument)

  const [{ c: stmtCountRaw }] = await db
    .select({ c: sql`count(*)` })
    .from(bankingStatement)

  const [{ c: balCountRaw }] = await db
    .select({ c: sql`count(*)` })
    .from(bankingStatementBalance)

  const [{ c: txCountRaw }] = await db
    .select({ c: sql`count(*)` })
    .from(transaction)

  const docCount = Number(docCountRaw)
  const stmtCount = Number(stmtCountRaw)
  const balCount = Number(balCountRaw)
  const txCount = Number(txCountRaw)

  console.log('Smoke ingest completed')
  console.log({
    runId,
    ingestResult,
    sampleCounts: {
      banking_document: docCount,
      banking_statement: stmtCount,
      banking_statement_balance: balCount,
      transaction: txCount,
    },
  })
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
