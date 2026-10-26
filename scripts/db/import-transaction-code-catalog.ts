import 'dotenv/config'
import dns from 'node:dns/promises'
import fs from 'node:fs/promises'
import path from 'node:path'
import { eq } from 'drizzle-orm'
import databaseEnv from '../../app/lib/env/env-database'
import { parseTransactionCodeCatalogCsv } from '../../engine/banking-ingestion/domain/transactionCodeCatalogCsv'
import type { BankProvider } from '../../app/lib/db/schema/bankingAgreement'

async function normalizeDatabaseUrlForLocalScripts() {
  const raw = databaseEnv.DATABASE_URL
  process.env.DATABASE_URL = raw
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
    // Ignore invalid URLs; drizzle will produce a clear runtime error.
  }
}

await normalizeDatabaseUrlForLocalScripts()

const { default: db } = await import('../../app/lib/db')
const { transactionCodeCatalog } = await import('../../app/lib/db/schema/transactionCodeCatalog')

const catalogProviders: BankProvider[] = ['danskebank', 'nordea']

async function main() {
  const sources = await Promise.all(catalogProviders.map(async (provider) => {
    const sourcePath = path.resolve(
      process.cwd(),
      'resources',
      'banking',
      provider,
      'transaction-code-catalog.dk.csv',
    )
    const csv = await fs.readFile(sourcePath, 'utf8')
    return {
      provider,
      sourcePath,
      rows: parseTransactionCodeCatalogCsv(csv, provider),
    }
  }))

  await db.transaction(async (tx) => {
    for (const source of sources) {
      await tx
        .update(transactionCodeCatalog)
        .set({ isActive: false })
        .where(eq(transactionCodeCatalog.provider, source.provider))

      for (const row of source.rows) {
        await tx
          .insert(transactionCodeCatalog)
          .values({
            provider: source.provider,
            codeKey: row.codeKey,
            domain: row.domain ?? null,
            family: row.family ?? null,
            subFamily: row.subFamily ?? null,
            proprietary: row.proprietary ?? null,
            displayName: row.displayName,
            description: row.description ?? null,
            sourceDocument: row.sourceDocument ?? null,
            isActive: row.isActive,
          })
          .onConflictDoUpdate({
            target: [transactionCodeCatalog.provider, transactionCodeCatalog.codeKey],
            set: {
              domain: row.domain ?? null,
              family: row.family ?? null,
              subFamily: row.subFamily ?? null,
              proprietary: row.proprietary ?? null,
              displayName: row.displayName,
              description: row.description ?? null,
              sourceDocument: row.sourceDocument ?? null,
              isActive: row.isActive,
            },
          })
      }
    }
  })

  for (const source of sources) {
    console.log(`[import-transaction-code-catalog] ${source.provider}: upserted ${source.rows.length} rows from ${source.sourcePath}`)
  }
}

main().catch((error) => {
  console.error('[import-transaction-code-catalog] failed', error)
  process.exitCode = 1
})