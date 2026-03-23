import { describe, expect, it } from 'vitest'
import { validateAccountingDimensionConstraints, type AccountingDimensionConstraintLike } from '../../engine/erp-integration/domain/accountingDimensionConstraints'

describe('accounting dimension constraints', () => {
  const constraints: AccountingDimensionConstraintLike[] = [
    {
      ifKey: 'artskonto',
      kind: 'forbids_any_of',
      ifValueRegex: '^[S9].*',
      members: ['omkostningssted', 'psp-element'],
    },
    {
      ifKey: 'artskonto',
      kind: 'requires_exactly_one_of',
      ifValueRegex: '^(?![S9]).+',
      members: ['omkostningssted', 'psp-element'],
    },
  ]

  it('fails when none of members are present', () => {
    expect(() => validateAccountingDimensionConstraints(
      new Map([['artskonto', '12000000']]),
      constraints,
    )).toThrow(/præcist én/i)
  })

  it('fails when more than one member is present', () => {
    expect(() => validateAccountingDimensionConstraints(
      new Map([
        ['artskonto', '12000000'],
        ['omkostningssted', '0001'],
        ['psp-element', 'WBS1'],
      ]),
      constraints,
    )).toThrow(/kun én/i)
  })

  it('passes when exactly one member is present', () => {
    expect(() => validateAccountingDimensionConstraints(
      new Map([
        ['artskonto', '12000000'],
        ['omkostningssted', '0001'],
      ]),
      constraints,
    )).not.toThrow()
  })

  it('passes with S/9 artskonto when only artskonto is present', () => {
    expect(() => validateAccountingDimensionConstraints(
      new Map([['artskonto', '90000000']]),
      constraints,
    )).not.toThrow()
  })

  it('fails with S/9 artskonto when a member is present', () => {
    expect(() => validateAccountingDimensionConstraints(
      new Map([
        ['artskonto', 'S123'],
        ['psp-element', 'WBS1'],
      ]),
      constraints,
    )).toThrow(/må \[psp-element\] ikke/i)
  })
})
