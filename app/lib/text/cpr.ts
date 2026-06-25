// Note: This is intentionally strict and does not accept hyphens.
// Format: DDMMÅÅXXXX (10 digits), with date validation.
const CPR_STRICT_REGEX = /^(?:(?:0[1-9]|[12][0-9]|3[01])(?:0[13578]|1[02])|(?:0[1-9]|[12][0-9]|30)(?:0[469]|11)|(?:0[1-9]|1[0-9]|2[0-8])02|29(?:02)(?:00|(?:[2468][048]|[13579][26])))(\d{2})(\d{4})$/

export function isValidCprStrict(value: string): boolean {
  const trimmed = value.trim()
  return CPR_STRICT_REGEX.test(trimmed)
}
