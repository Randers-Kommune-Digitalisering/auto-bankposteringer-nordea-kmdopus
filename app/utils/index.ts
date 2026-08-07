export const DEFAULT_TIME_ZONE = 'UTC'

const dkkFormatter = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
})

export function formatSignedDkk(amount: number): string {
  const value = Number(amount) || 0
  if (value < 0) return `-${dkkFormatter.format(Math.abs(value))}`
  if (value > 0) return `${dkkFormatter.format(value)}`
  return dkkFormatter.format(0)
}