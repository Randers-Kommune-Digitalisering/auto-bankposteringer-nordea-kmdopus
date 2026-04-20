export function parseAmount(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return 0

  const raw = value.trim()
  if (!raw) return 0

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

  // Preserve leading sign.
  const parsed = Number(normalized)
  return Number.isNaN(parsed) ? 0 : parsed
}
