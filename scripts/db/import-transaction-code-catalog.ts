import 'dotenv/config'
import dns from 'node:dns/promises'
import fs from 'node:fs/promises'
import path from 'node:path'
import Papa from 'papaparse'
import { z } from 'zod'

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
    // Ignore invalid URLs; drizzle will produce a clear runtime error.
  }
}

await normalizeDatabaseUrlForLocalScripts()

const { default: db } = await import('../../app/lib/db')
const { transactionCodeCatalog } = await import('../../app/lib/db/schema/transactionCodeCatalog')

const ProviderSchema = z.enum(['danskebank', 'nordea', 'bankconnect'])

const CsvRowSchema = z.object({
  provider: ProviderSchema,
  codeKey: z.string().min(1),
  displayName: z.string().min(1),
  domain: z.string().optional(),
  family: z.string().optional(),
  subFamily: z.string().optional(),
  proprietary: z.string().optional(),
  description: z.string().optional(),
  sourceDocument: z.string().optional(),
  isActive: z.boolean().default(true),
})

const args = process.argv.slice(2)
const csvPathArg = args[0] ?? 'resources/banking/nordea/transaction-code-catalog.template.csv'
const csvPath = path.resolve(process.cwd(), csvPathArg)

function normalizeOptionalText(value: unknown): string | null {
  const text = String(value ?? '').trim()
  return text.length ? text : null
}

function normalizeCodeKey(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw.length) return ''
  if (raw.toUpperCase().startsWith('PRTRY:')) {
    const proprietary = raw.slice('PRTRY:'.length).trim().toUpperCase()
    return proprietary.length ? `PRTRY:${proprietary}` : ''
  }
  return raw.toUpperCase()
}

function parseBoolean(value: unknown): boolean {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized.length) return true
  return !['0', 'false', 'nej', 'no'].includes(normalized)
}

type ParsedCsvRow = z.infer<typeof CsvRowSchema>

function parseRow(raw: Record<string, unknown>, rowNumber: number): ParsedCsvRow {
  const candidate = {
    provider: String(raw.provider ?? '').trim().toLowerCase(),
    codeKey: normalizeCodeKey(raw.codeKey),
    displayName: String(raw.displayName ?? '').trim(),
    domain: normalizeOptionalText(raw.domain) ?? undefined,
    family: normalizeOptionalText(raw.family) ?? undefined,
    subFamily: normalizeOptionalText(raw.subFamily) ?? undefined,
    proprietary: normalizeOptionalText(raw.proprietary) ?? undefined,
    description: normalizeOptionalText(raw.description) ?? undefined,
    sourceDocument: normalizeOptionalText(raw.sourceDocument) ?? undefined,
    isActive: parseBoolean(raw.isActive),
  }

  const parsed = CsvRowSchema.safeParse(candidate)
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join('; ')
    throw new Error(`Row ${rowNumber}: ${message}`)
  }

  return parsed.data
}

async function main() {
  const csv = await fs.readFile(csvPath, 'utf8')
  const parsed = Papa.parse<Record<string, unknown>>(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    delimiter: '',
    transformHeader: (header) => String(header ?? '').trim(),
  })

  if (parsed.errors.length) {
    const errorLines = parsed.errors
      .map((err) => `row ${Number(err.row ?? 0) + 1}: ${err.message}`)
      .join('\n')
    throw new Error(`CSV parse errors:\n${errorLines}`)
  }

  const rows = Array.isArray(parsed.data) ? parsed.data : []
  if (!rows.length) {
    // eslint-disable-next-line no-console
    console.log(`[import-transaction-code-catalog] no rows in ${csvPathArg}`)
    return
  }

  let upserted = 0

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2
    const row = parseRow(rows[i] ?? {}, rowNumber)

    await db
      .insert(transactionCodeCatalog)
      .values({
        provider: row.provider,
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

    upserted++
  }

  // eslint-disable-next-line no-console
  console.log(`[import-transaction-code-catalog] upserted ${upserted} rows from ${csvPathArg}`)
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[import-transaction-code-catalog] failed', error)
  process.exitCode = 1
})