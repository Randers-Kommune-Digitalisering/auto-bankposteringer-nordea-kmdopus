export function capitalizeFirst(input: string): string {
  const value = String(input ?? '').trim()
  if (!value) return ''

  const chars = Array.from(value)
  const [first] = chars
  if (!first) return ''

  return first.toLocaleUpperCase('da-DK') + chars.slice(1).join('')
}
