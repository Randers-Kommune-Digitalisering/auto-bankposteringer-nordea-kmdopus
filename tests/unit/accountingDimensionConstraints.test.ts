import { describe, expect, it } from 'vitest'
import { validateAccountingDimensionConstraints, type AccountingDimensionConstraintLike } from '../../engine/erp-integration/domain/accountingDimensionConstraints'

describe('accounting dimension constraints', () => {
  const constraints: AccountingDimensionConstraintLike[] = [
    {
      ifKey: 'artskonto',
      kind: 'requires_exactly_one_of',
      members: ['omkostningssted', 'psp-element'],
    },
  ]

  it('fails when none of members are present', () => {
    expect(() => validateAccountingDimensionConstraints(
      new Set(['artskonto']),
      constraints,
    )).toThrow(/præcist én/i)
  })

  it('fails when more than one member is present', () => {
    expect(() => validateAccountingDimensionConstraints(
      new Set(['artskonto', 'omkostningssted', 'psp-element']),
      constraints,
    )).toThrow(/kun én/i)
  })

  it('passes when exactly one member is present', () => {
    expect(() => validateAccountingDimensionConstraints(
      new Set(['artskonto', 'omkostningssted']),
      constraints,
    )).not.toThrow()
  })
})
