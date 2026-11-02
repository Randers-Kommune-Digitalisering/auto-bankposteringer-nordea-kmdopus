import { describe, expect, it } from 'vitest'
import { ruleRequiresAccounting } from '../../app/lib/rules/ruleAccountingRequirements'

describe('rule accounting requirements', () => {
  it('requires accounting only for active non-exception rules', () => {
    expect(ruleRequiresAccounting('standard', 'aktiv')).toBe(true)
    expect(ruleRequiresAccounting('engangs', 'aktiv')).toBe(true)
    expect(ruleRequiresAccounting('undtagelse', 'aktiv')).toBe(false)
    expect(ruleRequiresAccounting('standard', 'inaktiv')).toBe(false)
    expect(ruleRequiresAccounting('undtagelse', 'inaktiv')).toBe(false)
  })
})
