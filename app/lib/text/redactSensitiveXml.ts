const SENSITIVE_ELEMENT_NAMES = 'SERV_REC_NO|CPR|CPR_NO|PERSON_NAME|FIRST_NAME|LAST_NAME|DEBTOR_NAME|CREDITOR_NAME|BENEFICIARY_NAME|NAME'
const SENSITIVE_ELEMENT = new RegExp(
  `(<((?:[\\w.-]+:)?(?:${SENSITIVE_ELEMENT_NAMES}))\\b[^>]*>)[\\s\\S]*?(<\\/\\2\\s*>)`,
  'gi',
)

export function redactSensitiveXml(xml: string | null | undefined): string {
  if (!xml) return ''
  return xml.replace(SENSITIVE_ELEMENT, '$1[REDACTED]$3')
}