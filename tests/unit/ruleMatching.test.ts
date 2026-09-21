import { describe, expect, it } from 'vitest'
import type { MatchableTransaction } from '../../engine/matching/handlers/transactionMatchingService'
import { evaluateConditionGroups } from '../../engine/matching/handlers/transactionMatchingService'
import { mapConditionsToMatches, mapMatchesToConditionRows, mapRuleToListDto, matchEntrySchema } from '../../app/lib/db/schema/rule'
import { encodeTransactionTypeCatalogReference } from '../../app/lib/rules/transactionTypeCatalog'

const transaction = {
  transactionId: 'transaction-1',
  groupedTransactionIds: ['transaction-1'],
  groupKey: null,
  runId: 'run-1',
  accountId: 'account-1',
  statusDimensions: {},
  bookingDate: new Date('2026-01-01'),
  amount: 100,
  creditorName: 'Nets Danmark A/S',
  processingStatus: null,
  hasProcessingRow: false,
} as MatchableTransaction

const nordeaTransaction = {
  ...transaction,
  debtorName: 'NETS DENMARK A/S',
  entryAdditionalInfo: '502:REFERENCE:N54102770457',
  remittanceAdditional: ['N54102770457'],
}

describe('rule matching groups', () => {
  it('persists the selected gate and matches Nets in one of the party fields', () => {
    const conditions = mapMatchesToConditionRows([{
      category: 'Modpart',
      value: 'nets',
      operator: 'ilike',
      gate: 'ELLER',
      fields: ['dbtr_name', 'cdtr_name'],
    }])

    expect(conditions).toEqual([
      { field: 'dbtr_name', operator: 'ilike', gate: 'ELLER', value: 'nets' },
      { field: 'cdtr_name', operator: 'ilike', gate: 'ELLER', value: 'nets' },
    ])
    expect(evaluateConditionGroups(transaction, conditions as any)).toBe(true)
  })

  it('requires every field when a group uses OG', () => {
    const conditions = mapMatchesToConditionRows([{
      category: 'Modpart',
      value: 'nets',
      operator: 'ilike',
      gate: 'OG',
      fields: ['dbtr_name', 'cdtr_name'],
    }])

    expect(evaluateConditionGroups(transaction, conditions as any)).toBe(false)
  })

  it('round-trips one gate for a category group', () => {
    const matches = mapConditionsToMatches([
      { field: 'dbtr_name', operator: 'ilike', gate: 'ELLER', value: 'nets' } as any,
      { field: 'cdtr_name', operator: 'ilike', gate: 'ELLER', value: 'nets' } as any,
    ])

    expect(matches).toEqual([{
      category: 'Modpart',
      value: 'nets',
      fields: ['dbtr_name', 'cdtr_name'],
      operator: 'ilike',
      gate: 'ELLER',
    }])
  })

  it('matches the Alle felter party group when one party field contains Nets', () => {
    const conditions = mapMatchesToConditionRows([{
      category: 'Modpart',
      value: 'Nets',
      operator: 'ilike',
      gate: 'ELLER',
    }])

    expect(conditions).toHaveLength(8)
    expect(evaluateConditionGroups(transaction, conditions as any)).toBe(true)
  })

  it('forces ELLER when fields are omitted from the DTO', () => {
    const entry = matchEntrySchema.parse({
      category: 'Modpart',
      value: 'Nets',
      operator: 'ilike',
      gate: 'OG',
    })

    expect(entry.gate).toBe('ELLER')
    expect(mapMatchesToConditionRows([entry]).every(condition => condition.gate === 'ELLER')).toBe(true)
  })

  it('rejects invalid regex patterns', () => {
    const result = matchEntrySchema.safeParse({
      category: 'Reference',
      value: '**HSK**',
      operator: 'regex',
      gate: 'ELLER',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]).toMatchObject({
      path: ['value'],
      message: 'Ugyldig regex-mønster',
    })
  })

  it('accepts valid regex patterns for Reference', () => {
    const result = matchEntrySchema.safeParse({
      category: 'Reference',
      value: '^HSK-[0-9]+$',
      operator: 'regex',
      gate: 'ELLER',
    })

    expect(result.success).toBe(true)
  })

  it('matches a catalog display name across all of its code keys', () => {
    const conditions = mapMatchesToConditionRows([{
      category: 'Transaktionstype',
      value: encodeTransactionTypeCatalogReference({
        label: 'Gebyrer',
        codeKeys: ['ACMT/MCOP/CHRG', 'PMNT/ICDT/CHRG'],
      }),
      operator: 'eq',
      gate: 'ELLER',
      fields: ['bk_tx_cd_domain'],
    }])

    expect(evaluateConditionGroups({
      ...transaction,
      bkTxCdDomain: 'PMNT',
      bkTxCdFamily: 'ICDT',
      bkTxCdSubFamily: 'CHRG',
    }, conditions as any)).toBe(true)
  })

  it('normalizes catalog transaction types to exact matching', () => {
    const entry = matchEntrySchema.parse({
      category: 'Transaktionstype',
      value: encodeTransactionTypeCatalogReference({ label: 'Gebyrer', codeKeys: ['PMNT/ICDT/CHRG'] }),
      gate: 'ELLER',
    })

    expect(entry.operator).toBe('eq')

    const [condition] = mapMatchesToConditionRows([entry])
    expect(condition.operator).toBe('eq')
    expect(condition.gate).toBe('ELLER')
  })

  it('uses the catalog display name in the rule list DTO', () => {
    const dto = mapRuleToListDto({
      id: 1,
      type: 'standard',
      status: 'aktiv',
      conditions: [{
        field: 'bk_tx_cd_domain',
        operator: 'eq',
        gate: 'ELLER',
        value: encodeTransactionTypeCatalogReference({
          label: 'Overførsel',
          codeKeys: ['PMNT/ICDT/DMCT'],
        }),
      }],
      bankAccounts: [],
      tags: [],
    })

    expect(dto.matching.classification).toEqual(['Overførsel'])
  })

  it('requires a match in every category when a rule has multiple categories', () => {
    const conditions = [
      ...mapMatchesToConditionRows([{
        category: 'Reference',
        value: '200654227',
        operator: 'ilike',
        gate: 'ELLER',
      }]),
      ...mapMatchesToConditionRows([{
        category: 'Modpart',
        value: 'Mobilepay',
        operator: 'ilike',
        gate: 'ELLER',
      }]),
    ]

    expect(evaluateConditionGroups({
      ...transaction,
      remittanceAdditional: ['02006542270011609269'],
    }, conditions as any)).toBe(false)
  })

  it('matches a cross-category rule when every category has a hit', () => {
    const conditions = [
      ...mapMatchesToConditionRows([{
        category: 'Reference',
        value: 'N54102',
        operator: 'ilike',
        gate: 'ELLER',
      }]),
      ...mapMatchesToConditionRows([{
        category: 'Modpart',
        value: 'Nets',
        operator: 'ilike',
        gate: 'ELLER',
      }]),
    ]

    expect(evaluateConditionGroups(nordeaTransaction, conditions as any)).toBe(true)
  })

  it('treats ilike values as substrings rather than SQL wildcard patterns', () => {
    const conditions = mapMatchesToConditionRows([{
      category: 'Modpart',
      value: '%Nets%',
      operator: 'ilike',
      gate: 'ELLER',
      fields: ['dbtr_name'],
    }])

    expect(evaluateConditionGroups(nordeaTransaction, conditions as any)).toBe(false)
  })
})