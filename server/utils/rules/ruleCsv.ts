import { ruleConditionOperatorValues } from '~/lib/db/schema/enums'
import type { RuleConditionField, RuleConditionGate, RuleConditionOperator } from '~/lib/db/schema/enums'
import { fieldToCategory, matchFieldEnumValues } from '~/lib/rules/match-config'
import type { MatchField } from '~/lib/rules/match-config'

const baseHeaders = [
  'type',
  'status',
  'relatedBankAccounts',
  'ruleTags',
  'matchOperator',
  'matchReferences',
  'matchCounterparties',
  'matchClassification',
  'matchAmountMin',
  'matchAmountMax',
  'accountingText',
  'accountingTextTemplate',
  'accountingCprType',
  'accountingCprNumber',
  'accountingNote',
]

export function buildRuleCsvHeaders(dimensionKeys: string[], advanced: boolean): string[] {
  return [
    ...baseHeaders,
    ...dimensionKeys.map(key => `dim_${key}`),
    ...(advanced ? matchFieldEnumValues.map(field => `field_${field}`) : []),
  ]
}

export function getUnsupportedAdvancedFieldColumns(row: Record<string, unknown>): string[] {
  return Object.entries(row)
    .filter(([key, value]) => {
      if (!key.startsWith('field_') || value == null || String(value).trim() === '') return false
      return !matchFieldEnumValues.includes(key.slice('field_'.length) as MatchField)
    })
    .map(([key]) => key)
}

export function getUnsupportedRuleConditionFields(fields: RuleConditionField[]): RuleConditionField[] {
  return [...new Set(fields.filter(field => !matchFieldEnumValues.includes(field as MatchField)))]
}

export function parseAdvancedFieldToken(
  token: string,
  defaultOperator: RuleConditionOperator,
  fieldKey: MatchField,
): { operator: RuleConditionOperator; gate: RuleConditionGate; value: string } {
  let raw = token.trim()
  let gate: RuleConditionGate = 'ELLER'

  const gateSeparator = raw.indexOf(':')
  if (gateSeparator > 0) {
    const gatePrefix = raw.slice(0, gateSeparator).trim().toUpperCase()
    if (gatePrefix === 'OG' || gatePrefix === 'ELLER') {
      gate = gatePrefix
      raw = raw.slice(gateSeparator + 1).trim()
      if (!raw.length) throw new Error(`Match-værdi mangler efter "${gatePrefix.toLowerCase()}:"`)
    }
  }

  let operator = defaultOperator
  const operatorSeparator = raw.indexOf(':')
  if (operatorSeparator > 0) {
    const prefix = raw.slice(0, operatorSeparator).trim().toLowerCase()
    if ((ruleConditionOperatorValues as readonly string[]).includes(prefix)) {
      operator = prefix as RuleConditionOperator
      raw = raw.slice(operatorSeparator + 1).trim()
      if (!raw.length) throw new Error(`Match-værdi mangler efter "${prefix}:"`)
    }
  }

  if (operator === 'regex') {
    const category = Object.hasOwn(fieldToCategory, fieldKey) ? fieldToCategory[fieldKey] : undefined
    if (category !== 'Reference' && category !== 'Modpart') {
      throw new Error('Regex er kun understøttet for felter i Reference og Modpart')
    }
    if (raw.length > 512) {
      throw new Error('Regex-mønstret er for langt (maks 512 tegn)')
    }
    try {
      // eslint-disable-next-line no-new
      new RegExp(raw)
    } catch {
      throw new Error(`Ugyldigt regex-mønster: ${raw}`)
    }
  }

  return { operator, gate, value: raw }
}

export function formatAdvancedFieldToken(condition: {
  operator: RuleConditionOperator
  gate: RuleConditionGate
  value: string
}): string {
  const gatePrefix = condition.gate === 'OG' ? 'og:' : ''
  const operatorPrefix = condition.operator === 'eq' ? '' : `${condition.operator}:`
  return `${gatePrefix}${operatorPrefix}${condition.value}`
}

export function assertConsistentRuleMatchGates(matches: Array<{
  category: string
  gate: RuleConditionGate
}>): void {
  const gateByCategory = new Map<string, RuleConditionGate>()
  for (const match of matches) {
    const previousGate = gateByCategory.get(match.category)
    if (previousGate && previousGate !== match.gate) {
      throw new Error(`Alle kriterier i kategorien "${match.category}" skal bruge samme gate (OG/ELLER)`)
    }
    gateByCategory.set(match.category, match.gate)
  }
}
