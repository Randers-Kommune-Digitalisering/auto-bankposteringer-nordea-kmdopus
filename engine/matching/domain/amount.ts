export function parseAmountOrUndefined(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value !== 'string') return undefined

  const raw = value.trim()
  if (!raw) return undefined

  // Remove spaces (including NBSP) used as thousand separators.
  const compact = raw.replace(/[\s\u00A0]/g, '')

  const lastComma = compact.lastIndexOf(',')
  const lastDot = compact.lastIndexOf('.')

  let normalized = compact

  // If both separators are present, use the last one as decimal separator.
  if (lastComma !== -1 && lastDot !== -1) {
    const commaIsDecimal = lastComma > lastDot
    if (commaIsDecimal) {
      // 1.234,56 -> 1234.56
      normalized = normalized.replace(/\./g, '').replace(/,/g, '.')
    } else {
      // 1,234.56 -> 1234.56
      normalized = normalized.replace(/,/g, '')
    }
  } else if (lastComma !== -1) {
    // 1234,56 -> 1234.56
    normalized = normalized.replace(/,/g, '.')
  } else {
    // 1234.56 or 1234
    // Keep dots as decimal separator, but drop stray commas if any.
    normalized = normalized.replace(/,/g, '')
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function parseAmount(value: unknown): number {
  return parseAmountOrUndefined(value) ?? 0
}
