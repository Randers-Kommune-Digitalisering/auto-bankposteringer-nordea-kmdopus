import type {
  TransactionSummary,
  TransactionSummaryField,
  TransactionSummarySection,
} from '~/types/transactions'
import { transactionFieldForSourcePath } from '~~/engine/matching/domain/transactionFieldCatalog'

export type TransactionSummaryCategoryKey = TransactionSummarySection['key']

export type TransactionSummaryValueLine = {
  label?: string
  value: string
}

export type TransactionSummaryEntry = TransactionSummaryField & {
  valueLines?: TransactionSummaryValueLine[]
}

export type VisibleTransactionSummarySection = {
  key: TransactionSummarySection['key']
  label: string
  values: TransactionSummaryEntry[]
}

function parseTriadToken(token: string): string | null {
  const match = /^\d{2,3}:([^:]+):(.*)$/.exec(token)
  if (!match) return null

  const value = String(match[2] ?? '').trim()
  return value || null
}

export function toSummarySectionEntries(section: TransactionSummarySection): TransactionSummaryEntry[] {
  return section.fields.flatMap((field): TransactionSummaryEntry[] => {
    const sourcePath = field.sourcePath?.trim() || undefined
    if (sourcePath?.replace(/^\/+/, '').toLowerCase() === 'ntry/ntryref') return []

    const catalogField = sourcePath ? transactionFieldForSourcePath(sourcePath) : undefined
    const label = catalogField?.label ?? field.label

    if (sourcePath?.toLowerCase() === '/ntry/addtlntryinf') {
      const valueLines = parseAdditionalEntryInfo(field.value)
      return valueLines.length
        ? [{ label, value: '', sourcePath, valueLines }]
        : []
    }

    const values = section.key === 'reference'
      ? field.value.split(';').map((value) => value.trim()).filter(Boolean)
      : [field.value.trim()]

    return values.flatMap((value) => {
      const parsedValue = section.key === 'reference' ? parseTriadToken(value) : null
      return [{
        label,
        value: parsedValue ?? value,
        sourcePath,
      }]
    })
  }).filter((field) => Boolean(field.value || field.valueLines?.length))
}

function parseAdditionalEntryInfo(value: string): TransactionSummaryValueLine[] {
  return value.split(';').map((segment) => {
    const trimmedSegment = segment.trim()
    if (!trimmedSegment) return null

    const match = /^(\d{2,3}):([^:]+):(.*)$/.exec(trimmedSegment)
    const segmentValue = String(match?.[3] ?? '').trim()
    if (!match || !segmentValue) {
      return { value: trimmedSegment }
    }

    return {
      label: `${String(match[1]).trim()} · ${String(match[2]).trim()}`,
      value: segmentValue,
    }
  }).filter((line): line is TransactionSummaryValueLine => Boolean(line))
}

export function toVisibleSummarySections(
  sections: TransactionSummarySection[],
): VisibleTransactionSummarySection[] {
  return sections.flatMap((section) => {
    const values = toSummarySectionEntries(section)
    return values.length ? [{ key: section.key, label: section.label, values }] : []
  })
}

export function extractSummaryCategoryEntries(
  summary: TransactionSummary,
  key: TransactionSummaryCategoryKey,
): TransactionSummaryEntry[] {
  const section = summary.sections.find((entry) => entry.key === key)
  return section ? toSummarySectionEntries(section) : []
}
