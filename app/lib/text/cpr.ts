// Note: This is intentionally strict and does not accept hyphens.
// Format: DDMMÅÅXXXX (10 digits), with date validation.
const CPR_STRICT_REGEX = /^(?:(?:0[1-9]|[12][0-9]|3[01])(?:0[13578]|1[02])|(?:0[1-9]|[12][0-9]|30)(?:0[469]|11)|(?:0[1-9]|1[0-9]|2[0-8])02|29(?:02)(?:00|(?:[2468][048]|[13579][26])))(\d{2})(\d{4})$/

const CPR_TEXT_REGEX_SOURCE = '(?<![\\p{L}\\p{N}])(?:((0[1-9]|[12][0-9]|3[01])(0[13578]|10|12)(\\d{2}))|(([0][1-9]|[12][0-9]|30)(0[469]|11)(\\d{2}))|((0[1-9]|1[0-9]|2[0-8])(02)(\\d{2}))|((29)(02)(00))|((29)(02)([2468][048]))|((29)(02)([13579][26])))[-]*\\d{4}(?![\\p{L}\\p{N}])'

export function findCprNumbers(value: string): string[] {
  return value.match(new RegExp(CPR_TEXT_REGEX_SOURCE, 'gu')) ?? []
}

export function extractCprFromText(value: string): string | undefined {
  return findCprNumbers(value)[0]?.replace('-', '')
}

export function anonymizeCprInText(value: string): string {
  return value.replace(new RegExp(CPR_TEXT_REGEX_SOURCE, 'gu'), '[CPR REDACTED]')
}

export function isValidCprStrict(value: string): boolean {
  const trimmed = value.trim()
  return CPR_STRICT_REGEX.test(trimmed)
}
