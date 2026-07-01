import { buildNordeaDeterministicGroupKey } from '#engine/banking-ingestion/handlers/camt053/nordeaAdditionalEntryInfo'

export type SamlepostIdentityInput = {
  id: string | null
  accountId: string | null
  entryGroupSize: number | null
  bookingDate: Date | string | null
  creditDebitIndicator: string | null
  ntryRef: string | null
  entryAdditionalInfo: string | null
  ntryAcctSvcrRef: string | null
}

function toDateOnlyDate(value: Date | string | null): Date {
  if (value instanceof Date) return value
  const parsed = value ? new Date(value) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

// ISO 20022-aware samlepost identity. A group exists when Btch-level semantics are present.
export function toSamlepostId(input: SamlepostIdentityInput): string {
  const groupKey = buildNordeaDeterministicGroupKey({
    accountId: input.accountId ?? '',
    bookingDate: toDateOnlyDate(input.bookingDate),
    creditDebitIndicator: input.creditDebitIndicator ?? null,
    entryGroupSize: input.entryGroupSize ?? 0,
    ntryRef: input.ntryRef ?? null,
    entryAdditionalInfo: input.entryAdditionalInfo ?? null,
    ntryAcctSvcrRef: input.ntryAcctSvcrRef ?? null,
  })

  if (groupKey) return `group:${groupKey}`
  return `single:${String(input.id ?? '')}`
}

export function toStatementEntryKey(statementId: string | null, entryIndex: number | null): string | null {
  const normalizedStatementId = String(statementId ?? '').trim()
  if (!normalizedStatementId) return null

  const normalizedEntryIndex = Number(entryIndex)
  if (!Number.isInteger(normalizedEntryIndex) || normalizedEntryIndex < 1) return null

  return `${normalizedStatementId}:${normalizedEntryIndex}`
}
