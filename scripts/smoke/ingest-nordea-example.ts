import crypto from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { eq, sql } from 'drizzle-orm'

import db from '../../app/lib/db/index'
import { account } from '../../app/lib/db/schema/account'
import { run } from '../../app/lib/db/schema/run'
import { bankingDocument, bankingStatement, bankingStatementBalance } from '../../app/lib/db/schema/statement'
import { transaction } from '../../app/lib/db/schema/transaction'
import { ingestCamt053Document } from '../../engine/banking-ingestion/handlers/ingestCamt053Document'

async function main() {
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
      statusAccount: 95999999,
    })
  }

  const runId = crypto.randomUUID()
  await db.insert(run).values({ id: runId, bookingDate: new Date(), status: 'indlæser' })

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
      accountId,
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
