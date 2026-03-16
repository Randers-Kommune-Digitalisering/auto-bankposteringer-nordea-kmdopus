import crypto from 'node:crypto'
import { join } from 'node:path'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import { account } from '~/lib/db/schema/account'
import { run } from '~/lib/db/schema/run'
import { logger } from '~/lib/logger'
import { getAdapterCursor, setAdapterCursor } from './bankAdapterCursorStore'
import { LocalFileBankAdapter } from '../infrastructure/localFileBankAdapter'
import { ingestCamt053Document } from './ingestCamt053Document'

export async function runTransactionBatch(): Promise<{ runId: string; insertedCount: number }> {
  const log = logger.child({ scope: 'banking.runTransactionBatch' })

  const runId = crypto.randomUUID()
  const now = new Date()

  const accounts = await db.select().from(account).orderBy(account.id).limit(1)
  const selectedAccount = accounts[0] ?? null
  if (!selectedAccount) {
    await db.insert(run).values({ id: runId, bookingDate: now, status: 'udført' })
    return { runId, insertedCount: 0 }
  }

  // Temporary: ingest the bundled Nordea CAMT.053 example.
  // This is intentionally deterministic and idempotent via banking_document.content_hash.
  const examplePath = join(
    process.cwd(),
    'resources',
    'banking',
    'nordea',
    'examples',
    'camt.053e.xml',
  )

  const adapter = new LocalFileBankAdapter({
    key: 'nordea-example-file',
    filePath: examplePath,
    filename: 'camt.053e.xml',
  })

  const persistedCursor = await getAdapterCursor(db as any, {
    accountId: selectedAccount.id,
    adapterKey: adapter.key,
  })

  const fetched = await adapter.fetchDocuments({
    accountId: selectedAccount.id,
    cursor: persistedCursor,
    limit: 1,
  })

  const result = await db.transaction(async (trx) => {
    await trx.insert(run).values({ id: runId, bookingDate: now, status: 'indlæser' })

    let insertedStatements = 0
    let insertedBalances = 0
    let insertedTransactions = 0
    let deduplicated = false

    for (const doc of fetched.documents) {
      if (doc.format !== 'camt053') {
        continue
      }

      const ingestResult = await ingestCamt053Document(trx as any, {
        runId,
        accountId: selectedAccount.id,
        filename: doc.filename ?? null,
        xml: doc.content,
      })

      insertedStatements += ingestResult.insertedStatements
      insertedBalances += ingestResult.insertedBalances
      insertedTransactions += ingestResult.insertedTransactions
      deduplicated = deduplicated || ingestResult.deduplicated
    }

    await trx.update(run).set({ status: 'udført' }).where(eq(run.id, runId))

    if (fetched.nextCursor) {
      await setAdapterCursor(trx as any, {
        accountId: selectedAccount.id,
        adapterKey: adapter.key,
        cursor: fetched.nextCursor,
      })
    }

    return {
      insertedStatements,
      insertedBalances,
      insertedTransactions,
      deduplicated,
    }
  })

  log.info('CAMT.053 dokument indlæst', {
    runId,
    accountId: selectedAccount.id,
    insertedStatements: result.insertedStatements,
    insertedBalances: result.insertedBalances,
    insertedTransactions: result.insertedTransactions,
    deduplicated: result.deduplicated,
  })

  return { runId, insertedCount: result.insertedTransactions }
}
