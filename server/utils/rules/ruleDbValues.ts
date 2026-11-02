export function toDbNumericStringOrUndefined(value: number | null | undefined): string | undefined {
  if (value == null) return undefined
  if (!Number.isFinite(value)) {
    throw new Error('Ugyldigt beløb (amount_min/amount_max)')
  }
  return value.toFixed(2)
}
