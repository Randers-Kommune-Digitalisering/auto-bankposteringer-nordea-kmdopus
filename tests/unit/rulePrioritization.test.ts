import { describe, expect, it } from 'vitest'
import type { RuleType } from '../../lib/db/schema/enums'
import { amountMatchesAbsolute, compareRulesBySpecificity, computeRuleSortKey } from '../../engine/matching/domain/rulePrioritization'

describe('rulePrioritization', () => {
  it('matches by absolute amount', () => {
    expect(amountMatchesAbsolute(-100, 0, 150)).toBe(true)
    expect(amountMatchesAbsolute(-100, 101, 150)).toBe(false)
    expect(amountMatchesAbsolute(100, 0, 99)).toBe(false)
    expect(amountMatchesAbsolute(100, 100, 100)).toBe(true)
  })

  it('prefers more conditions within same type', () => {
    const type: RuleType = 'standard'

    const lessSpecific = { id: 1, type, conditions: [{ operator: 'eq' }] }
    const moreSpecific = { id: 2, type, conditions: [{ operator: 'eq' }, { operator: 'eq' }] }

    const sorted = [lessSpecific, moreSpecific].sort(compareRulesBySpecificity)
    expect(sorted[0].id).toBe(2)
  })

  it('prefers more specific operators within same type/condition-count', () => {
    const type: RuleType = 'standard'

    const regexRule = { id: 1, type, conditions: [{ operator: 'regex' }] }
    const eqRule = { id: 2, type, conditions: [{ operator: 'eq' }] }

    const sorted = [regexRule, eqRule].sort(compareRulesBySpecificity)
    expect(sorted[0].id).toBe(2)
  })

  it('prefers narrower amount range when otherwise equal', () => {
    const type: RuleType = 'standard'

    const wide = { id: 1, type, amountMin: 0, amountMax: 1000, conditions: [] }
    const narrow = { id: 2, type, amountMin: 100, amountMax: 200, conditions: [] }

    const sorted = [wide, narrow].sort(compareRulesBySpecificity)
    expect(sorted[0].id).toBe(2)

    const wideKey = computeRuleSortKey(wide)
    const narrowKey = computeRuleSortKey(narrow)
    expect(narrowKey.amountRangeWidth).toBeLessThan(wideKey.amountRangeWidth)
  })

  it('keeps rule type priority before specificity', () => {
    const lessSpecificException = { id: 99, type: 'undtagelse' as RuleType, conditions: [] }
    const moreSpecificStandard = { id: 1, type: 'standard' as RuleType, conditions: [{ operator: 'eq' }, { operator: 'eq' }] }

    const sorted = [moreSpecificStandard, lessSpecificException].sort(compareRulesBySpecificity)
    expect(sorted[0].type).toBe('undtagelse')
  })
})
