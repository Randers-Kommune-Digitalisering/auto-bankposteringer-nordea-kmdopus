export type NordeaAdditionalEntryInfoSegment = {
  code: string
  label: string
  value: string
}

export type NordeaGroupingIdentifiers = {
  summaryItemId: string | null
  gsipTransactionDetailKey: string | null
  idTag: string | null
}

export function parseNordeaAdditionalEntryInfo(input: string | null | undefined): NordeaAdditionalEntryInfoSegment[] {
  const raw = String(input ?? '').trim()
  if (!raw) return []

  return raw
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = /^(\d{2,3}):([^:]+):(.*)$/.exec(part)
      if (!match) return null
      return {
        code: String(match[1] ?? '').trim(),
        label: String(match[2] ?? '').trim(),
        value: String(match[3] ?? '').trim(),
      } satisfies NordeaAdditionalEntryInfoSegment
    })
    .filter((segment): segment is NordeaAdditionalEntryInfoSegment => Boolean(segment))
}

export function extractNordeaGroupingIdentifiers(input: string | null | undefined): NordeaGroupingIdentifiers {
  const segments = parseNordeaAdditionalEntryInfo(input)

  const findValue = (code: string, label: string): string | null => {
    const segment = segments.find((s) => s.code === code && s.label.toUpperCase() === label.toUpperCase())
    const value = String(segment?.value ?? '').trim()
    return value.length ? value : null
  }

  return {
    summaryItemId: findValue('528', 'SUMMARY ITEM'),
    gsipTransactionDetailKey: findValue('559', 'GSIPTRANSACTIONDETKEY'),
    idTag: findValue('196', 'ID.'),
  }
}

export function buildNordeaDeterministicGroupKey(input: {
  accountId: string
  bookingDate: Date
  creditDebitIndicator?: string | null
  entryAdditionalInfo?: string | null
}): string | null {
  const ids = extractNordeaGroupingIdentifiers(input.entryAdditionalInfo)
  const bookingDateIso = input.bookingDate.toISOString().slice(0, 10)
  const cdi = String(input.creditDebitIndicator ?? '').toUpperCase() || 'UNKNOWN'
  const idTag = ids.idTag ?? '-'

  if (ids.summaryItemId) {
    return `nordea:summary:${input.accountId}:${bookingDateIso}:${cdi}:${idTag}:${ids.summaryItemId}`
  }

  if (ids.gsipTransactionDetailKey) {
    return `nordea:gsip:${input.accountId}:${bookingDateIso}:${cdi}:${idTag}:${ids.gsipTransactionDetailKey}`
  }

  return null
}
