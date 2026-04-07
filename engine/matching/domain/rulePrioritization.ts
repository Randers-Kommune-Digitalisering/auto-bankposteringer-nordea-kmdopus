import type { RuleConditionOperator, RuleType } from '~/lib/db/schema/enums'

type ConditionLike = { operator?: RuleConditionOperator | null }

type RuleLike = {
  id: number
  type: RuleType
  amountMin?: number
  amountMax?: number
  conditions?: ConditionLike[]
}

const RULE_TYPE_PRIORITY: Record<RuleType, number> = {
  undtagelse: 0,
  engangs: 1,
  standard: 2,
}

const OPERATOR_SPECIFICITY: Record<RuleConditionOperator, number> = {
  eq: 50,
  neq: 50,
  in: 40,
  gt: 35,
  gte: 35,
  lt: 35,
  lte: 35,
  regex: 30,
  ilike: 20,
  like: 10,
}

export type RuleSortKey = {
  typePriority: number
  conditionsCount: number
  operatorSpecificitySum: number
  hasAnyAmountBound: 0 | 1
  hasBothAmountBounds: 0 | 1
  amountRangeWidth: number
  id: number
}

export function computeRuleSortKey(rule: RuleLike): RuleSortKey {
  const conditions = rule.conditions ?? []
  const conditionsCount = conditions.length

  const operatorSpecificitySum = conditions.reduce((sum, condition) => {
    const operator = (condition.operator ?? 'eq') as RuleConditionOperator
    return sum + (OPERATOR_SPECIFICITY[operator] ?? 0)
  }, 0)

  const minAbs = rule.amountMin == null ? undefined : Math.abs(rule.amountMin)
  const maxAbs = rule.amountMax == null ? undefined : Math.abs(rule.amountMax)

  const hasAnyAmountBound: 0 | 1 = minAbs != null || maxAbs != null ? 1 : 0
  const hasBothAmountBounds: 0 | 1 = minAbs != null && maxAbs != null ? 1 : 0

  const amountRangeWidth = (() => {
    if (minAbs == null || maxAbs == null) {
      return Number.POSITIVE_INFINITY
    }
    const lower = Math.min(minAbs, maxAbs)
    const upper = Math.max(minAbs, maxAbs)
    return upper - lower
  })()

  return {
    typePriority: RULE_TYPE_PRIORITY[rule.type],
    conditionsCount,
    operatorSpecificitySum,
    hasAnyAmountBound,
    hasBothAmountBounds,
    amountRangeWidth,
    id: rule.id,
  }
}

export function compareRulesBySpecificity(a: RuleLike, b: RuleLike): number {
  const ka = computeRuleSortKey(a)
  const kb = computeRuleSortKey(b)

  if (ka.typePriority !== kb.typePriority) return ka.typePriority - kb.typePriority

  if (ka.conditionsCount !== kb.conditionsCount) return kb.conditionsCount - ka.conditionsCount
  if (ka.operatorSpecificitySum !== kb.operatorSpecificitySum) return kb.operatorSpecificitySum - ka.operatorSpecificitySum

  if (ka.hasBothAmountBounds !== kb.hasBothAmountBounds) return kb.hasBothAmountBounds - ka.hasBothAmountBounds
  if (ka.hasAnyAmountBound !== kb.hasAnyAmountBound) return kb.hasAnyAmountBound - ka.hasAnyAmountBound

  if (ka.amountRangeWidth !== kb.amountRangeWidth) return ka.amountRangeWidth - kb.amountRangeWidth

  return ka.id - kb.id
}

export function amountMatchesAbsolute(transactionAmount: number, min?: number, max?: number): boolean {
  const amountAbs = Math.abs(transactionAmount)

  const minAbs = min == null ? undefined : Math.abs(min)
  const maxAbs = max == null ? undefined : Math.abs(max)

  if (minAbs == null && maxAbs == null) {
    return true
  }

  const lower = minAbs == null ? Number.NEGATIVE_INFINITY : minAbs
  const upper = maxAbs == null ? Number.POSITIVE_INFINITY : maxAbs

  const effectiveLower = Math.min(lower, upper)
  const effectiveUpper = Math.max(lower, upper)

  if (amountAbs < effectiveLower) return false
  if (amountAbs > effectiveUpper) return false

  return true
}
