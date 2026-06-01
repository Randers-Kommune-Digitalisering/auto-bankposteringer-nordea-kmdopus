export type NordeaAdditionalInfoTag = {
  code: string
  label: string
  value: string
  raw: string
}

export type NordeaGroupingInfo = {
  groupingKey: string | null
  groupingKind: 'summary-item' | 'gsip-transaction-detail-key' | null
  summaryItem: string | null
  gsipTransactionDetailKey: string | null
  id196: string | null
  noticeNumber804: string | null
}

const SEGMENT_PATTERN = /^(\d{2,3}):([^:]+):(.*)$/

export function parseNordeaEntryAdditionalInfo(value: string | null | undefined): NordeaAdditionalInfoTag[] {
  if (!value) return []

  return value
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const match = SEGMENT_PATTERN.exec(segment)
      if (!match) return null
      const code = match[1]?.trim() ?? ''
      const label = (match[2]?.trim() ?? '').toUpperCase()
      const rawValue = match[3]?.trim() ?? ''
      if (!code || !label || !rawValue) return null
      return {
        code,
        label,
        value: rawValue,
        raw: segment,
      } satisfies NordeaAdditionalInfoTag
    })
    .filter((entry): entry is NordeaAdditionalInfoTag => Boolean(entry))
}

export function deriveNordeaGroupingInfo(value: string | null | undefined): NordeaGroupingInfo {
  const tags = parseNordeaEntryAdditionalInfo(value)

  const summaryItem = findTagValue(tags, '528', 'SUMMARY ITEM')
  const gsipTransactionDetailKey = findTagValue(tags, '559', 'GSIPTRANSACTIONDETKEY')
  const id196 = findTagValue(tags, '196', 'ID.')
  const noticeNumber804 = findTagValue(tags, '804', 'NOTICE NUMBER')

  if (summaryItem) {
    const groupingKey = id196
      ? `summary-item:${summaryItem}|id-196:${id196}`
      : `summary-item:${summaryItem}`
    return {
      groupingKey,
      groupingKind: 'summary-item',
      summaryItem,
      gsipTransactionDetailKey,
      id196,
      noticeNumber804,
    }
  }

  if (gsipTransactionDetailKey) {
    return {
      groupingKey: `gsip-transaction-detail-key:${gsipTransactionDetailKey}`,
      groupingKind: 'gsip-transaction-detail-key',
      summaryItem,
      gsipTransactionDetailKey,
      id196,
      noticeNumber804,
    }
  }

  return {
    groupingKey: null,
    groupingKind: null,
    summaryItem,
    gsipTransactionDetailKey,
    id196,
    noticeNumber804,
  }
}

function findTagValue(tags: NordeaAdditionalInfoTag[], code: string, label: string): string | null {
  const normalizedLabel = label.toUpperCase()
  const hit = tags.find((tag) => tag.code === code && tag.label === normalizedLabel)
  return hit?.value ?? null
}
