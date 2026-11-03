import { describe, expect, it } from 'vitest'
import { compileRuleDraftToDb } from '../../server/utils/rules/compileRuleDraftToDb'
import {
  assertConsistentRuleMatchGates,
  buildRuleCsvHeaders,
  formatAdvancedFieldToken,
  getUnsupportedAdvancedFieldColumns,
  getUnsupportedRuleConditionFields,
  parseAdvancedFieldToken,
} from '../../server/utils/rules/ruleCsv'
import { ruleDraftApiSchema } from '../../server/utils/rules/ruleDraftApiSchema'
import { matchFieldEnumValues } from '../../app/lib/rules/match-config'
import { mapConditionsToMatches, mapMatchesToConditionRows, matchEntrySchema } from '../../app/lib/db/schema/rule'
import { postingTextTemplateSchema } from '../../engine/matching/domain/postingTextTemplate'

describe('rule CSV format', () => {
  it('includes dynamic accounting fields in both templates and only supported match fields in the advanced template', () => {
    const standardHeaders = buildRuleCsvHeaders(['artskonto'], false)
    const advancedHeaders = buildRuleCsvHeaders(['artskonto'], true)

    expect(standardHeaders).toContain('accountingTextTemplate')
    expect(standardHeaders).toContain('accountingCprType')
    expect(standardHeaders).toContain('accountingCprNumber')
    expect(standardHeaders.some(header => header.startsWith('field_'))).toBe(false)
    expect(advancedHeaders.filter(header => header.startsWith('field_')))
      .toEqual(matchFieldEnumValues.map(field => `field_${field}`))
  })

  it('preserves the operator and gate in advanced match tokens', () => {
    const token = formatAdvancedFieldToken({
      operator: 'regex',
      gate: 'OG',
      value: String.raw`KSD-(\d+)`,
    })

    expect(token).toBe(String.raw`og:regex:KSD-(\d+)`)
    const parsed = parseAdvancedFieldToken(token, 'eq', 'ntry_ref')
    expect(parsed).toEqual({
      operator: 'regex',
      gate: 'OG',
      value: String.raw`KSD-(\d+)`,
    })
    const match = matchEntrySchema.parse({
      category: 'Reference',
      fields: ['ntry_ref'],
      value: parsed.value,
      operator: parsed.operator,
      gate: parsed.gate,
    })
    expect(mapMatchesToConditionRows([match])).toEqual([{
      field: 'ntry_ref',
      operator: 'regex',
      gate: 'OG',
      value: String.raw`KSD-(\d+)`,
    }])
  })

  it('does not silently accept field columns that are not supported by the rule editor and matcher', () => {
    expect(getUnsupportedAdvancedFieldColumns({
      field_ntry_ref: '123',
      field_not_a_rule_field: 'value',
      field_tx_acct_svcr_ref: '',
      field_dbtr_name: 'Borrower',
    })).toEqual(['field_not_a_rule_field', 'field_dbtr_name'])
    expect(getUnsupportedRuleConditionFields(['ntry_ref', 'dbtr_name'])).toEqual(['dbtr_name'])
  })

  it('keeps an OG gate in RuleModal even when every field in a category is selected', () => {
    const matches = mapConditionsToMatches([
      { id: '1', ruleId: 1, field: 'ntry_ref', operator: 'eq', gate: 'OG', value: '123' },
      { id: '2', ruleId: 1, field: 'ntry_acct_svcr_ref', operator: 'eq', gate: 'OG', value: '123' },
      { id: '3', ruleId: 1, field: 'entry_additional_info', operator: 'eq', gate: 'OG', value: '123' },
    ])

    expect(matches).toEqual([{
      category: 'Reference',
      value: '123',
      fields: ['ntry_ref', 'ntry_acct_svcr_ref', 'entry_additional_info'],
      operator: 'eq',
      gate: 'OG',
    }])
  })

  it('rejects mixed gates within the same matching category', () => {
    expect(() => assertConsistentRuleMatchGates([
      { category: 'Reference', gate: 'OG' },
      { category: 'Reference', gate: 'ELLER' },
    ])).toThrow('Alle kriterier i kategorien "Reference" skal bruge samme gate')
  })

  it('accepts and compiles dynamic accounting text and dynamic CPR', () => {
    const accountingTextTemplate = postingTextTemplateSchema.parse({
      version: 1,
      parts: [
        { type: 'text', value: 'KSD ' },
        { type: 'extract', source: 'bankMessage', pattern: String.raw`KSD-(\d+)`, captureGroup: 1 },
      ],
    })
    const draft = ruleDraftApiSchema.parse({
      type: 'standard',
      status: 'aktiv',
      relatedBankAccounts: ['account-1'],
      accountingTextTemplate: JSON.parse(JSON.stringify(accountingTextTemplate)),
      accountingCprType: 'dynamisk',
    })

    const compiled = compileRuleDraftToDb(draft)

    expect(compiled.accountingParameters.bookingTextTemplate).toEqual(accountingTextTemplate)
    expect(compiled.accountingParameters.cprType).toBe('dynamisk')
    expect(compiled.accountingParameters.cprNumber).toBeUndefined()
  })
})
