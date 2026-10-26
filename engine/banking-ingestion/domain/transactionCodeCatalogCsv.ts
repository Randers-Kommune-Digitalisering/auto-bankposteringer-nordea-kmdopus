import Papa from 'papaparse'
import { z } from 'zod'
import type { BankProvider } from '../../../app/lib/db/schema/bankingAgreement'

const CsvRowSchema = z.object({
  codeKey: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  domain: z.string().optional(),
  family: z.string().optional(),
  subFamily: z.string().optional(),
  proprietary: z.string().optional(),
  description: z.string().optional(),
  sourceDocument: z.string().optional(),
  isActive: z.boolean(),
})

export type ParsedTransactionCodeCatalogRow = z.infer<typeof CsvRowSchema>

function normalizeOptionalText(value: unknown): string | undefined {
  const text = String(value ?? '').trim()
  return text.length ? text : undefined
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
  return !['0', 'false', 'nej', 'no'].includes(normalized)
}

export function parseTransactionCodeCatalogCsv(
  csv: string,
  provider: BankProvider,
): ParsedTransactionCodeCatalogRow[] {
  const parsed = Papa.parse<Record<string, unknown>>(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    delimiter: '',
    transformHeader: (header) => String(header ?? '').trim(),
  })

  if (parsed.errors.length) {
    throw new Error(`Catalog CSV parse error: ${parsed.errors.map(error => error.message).join('; ')}`)
  }

  if (!parsed.data.length) {
    throw new Error('Catalog CSV contains no rows')
  }

  const codeKeys = new Set<string>()
  return parsed.data.map((raw, index) => {
    const rowNumber = index + 2
    const rowProvider = String(raw.provider ?? '').trim().toLowerCase()
    if (rowProvider !== provider) {
      throw new Error(`Row ${rowNumber}: provider must be ${provider}`)
    }

    const candidate = {
      codeKey: normalizeCodeKey(raw.codeKey),
      displayName: String(raw.displayName ?? '').trim(),
      domain: normalizeOptionalText(raw.domain),
      family: normalizeOptionalText(raw.family),
      subFamily: normalizeOptionalText(raw.subFamily),
      proprietary: normalizeOptionalText(raw.proprietary),
      description: normalizeOptionalText(raw.description),
      sourceDocument: normalizeOptionalText(raw.sourceDocument),
      isActive: parseBoolean(raw.isActive),
    }

    const result = CsvRowSchema.safeParse(candidate)
    if (!result.success) {
      const message = result.error.issues.map(issue => issue.message).join('; ')
      throw new Error(`Row ${rowNumber}: ${message}`)
    }

    if (codeKeys.has(result.data.codeKey)) {
      throw new Error(`Row ${rowNumber}: duplicate codeKey ${result.data.codeKey}`)
    }
    codeKeys.add(result.data.codeKey)

    return result.data
  })
}