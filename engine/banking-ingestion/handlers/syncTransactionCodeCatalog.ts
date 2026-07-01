import fs from 'node:fs/promises'
import path from 'node:path'
import Papa from 'papaparse'
import { z } from 'zod'
import { transactionCodeCatalog } from '../../../app/lib/db/schema/transactionCodeCatalog'
import type { BankProvider } from '../../../app/lib/db/schema/bankingAgreement'

const CsvRowSchema = z.object({
  provider: z.string().trim().min(1),
  codeKey: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  domain: z.string().optional(),
  family: z.string().optional(),
  subFamily: z.string().optional(),
  proprietary: z.string().optional(),
  description: z.string().optional(),
  sourceDocument: z.string().optional(),
  isActive: z.boolean().default(true),
})

type ParsedCsvRow = z.infer<typeof CsvRowSchema>

type DbClient = {
  insert: any
}

export type TransactionCodeCatalogSyncResult = {
  status: 'loaded' | 'skipped'
  provider: BankProvider
  sourcePath: string
  upserted: number
  reason?: string
}

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

function parseRow(raw: Record<string, unknown>, rowNumber: number, provider: BankProvider): ParsedCsvRow {
  const candidate = {
    provider,
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

export async function syncTransactionCodeCatalogForProvider(
  db: DbClient,
  provider: BankProvider,
): Promise<TransactionCodeCatalogSyncResult> {
  const sourcePath = path.resolve(
    process.cwd(),
    'resources',
    'banking',
    provider,
    'transaction-code-catalog.dk.csv',
  )

  let csv = ''
  try {
    csv = await fs.readFile(sourcePath, 'utf8')
  } catch {
    return {
      status: 'skipped',
      provider,
      sourcePath,
      upserted: 0,
      reason: 'catalog_file_missing',
    }
  }

  try {
    const parsed = Papa.parse<Record<string, unknown>>(csv, {
      header: true,
      skipEmptyLines: 'greedy',
      delimiter: '',
      transformHeader: (header) => String(header ?? '').trim(),
    })

    if (parsed.errors.length) {
      return {
        status: 'skipped',
        provider,
        sourcePath,
        upserted: 0,
        reason: 'catalog_csv_parse_error',
      }
    }

    const rows = Array.isArray(parsed.data) ? parsed.data : []
    if (!rows.length) {
      return {
        status: 'skipped',
        provider,
        sourcePath,
        upserted: 0,
        reason: 'catalog_empty',
      }
    }

    let upserted = 0
    for (let i = 0; i < rows.length; i++) {
      const row = parseRow(rows[i] ?? {}, i + 2, provider)

      await db
        .insert(transactionCodeCatalog)
        .values({
          provider,
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

      upserted += 1
    }

    return {
      status: 'loaded',
      provider,
      sourcePath,
      upserted,
    }
  } catch {
    return {
      status: 'skipped',
      provider,
      sourcePath,
      upserted: 0,
      reason: 'catalog_invalid_or_unreadable',
    }
  }
}