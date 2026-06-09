import type { TransactionSummary, TransactionSummarySection } from '~/types/transactions'

export type TransactionSummaryCategoryKey = TransactionSummarySection['key']

export type TransactionSummaryEntry = {
  value: string
  hint?: string
}

function splitTriadTokens(values: Array<{ value: string; source?: string }>): Array<{ value: string; source?: string }> {
  return values
    .flatMap((entry) => String(entry?.value ?? '').split(';').map((value) => ({ value, source: entry?.source })))
    .map((entry) => ({ value: String(entry.value ?? '').trim(), source: entry.source }))
    .filter((entry) => Boolean(entry.value))
}

function parseTriadToken(token: string): { code: string; label: string; value: string } | null {
  const match = /^(\d{2,3}):([^:]+):(.*)$/.exec(token)
  if (!match) return null

  const code = String(match[1] ?? '').trim()
  const label = String(match[2] ?? '').trim()
  const value = String(match[3] ?? '').trim()

  if (!code || !label || !value) return null
  return { code, label, value }
}

function isReferenceTriadCode(code: string): boolean {
  return code === '500' || code === '502'
}

export function toSummarySectionEntries(section: TransactionSummarySection): TransactionSummaryEntry[] {
  if (section.key === 'part' || section.key === 'transaktionstype') {
    return section.items
      .map((item) => ({
        value: String(item.value ?? '').trim(),
        hint: item.hint ?? item.label,
      }))
      .filter((item) => Boolean(item.value))
  }

  const tokens = splitTriadTokens(section.chips)

  return tokens.map((token) => {
    const triad = parseTriadToken(token.value)
    if (triad && (section.key === 'teknisk' || isReferenceTriadCode(triad.code))) {
      return {
        value: triad.value,
        hint: token.source ?? `${triad.code}: ${triad.label}`,
      }
    }

    return {
      value: token.value,
      hint: token.source ?? section.label,
    }
  })
}

export function extractSummaryCategoryEntries(summary: TransactionSummary, key: TransactionSummaryCategoryKey): TransactionSummaryEntry[] {
  const section = summary.sections.find((entry) => entry.key === key)
  if (!section) {
    return []
  }

  return toSummarySectionEntries(section)
}
