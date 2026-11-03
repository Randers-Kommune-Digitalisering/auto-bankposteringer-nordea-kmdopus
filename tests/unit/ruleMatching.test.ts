import { describe, expect, it } from 'vitest'
import type { MatchableTransaction } from '../../engine/matching/handlers/transactionMatchingService'
import { evaluateConditionGroups } from '../../engine/matching/handlers/transactionMatchingService'
import { mapConditionsToMatches, mapMatchesToConditionRows, mapRuleToListDto, matchEntrySchema } from '../../app/lib/db/schema/rule'
import { encodeTransactionTypeCatalogReference } from '../../app/lib/rules/transactionTypeCatalog'
import { matchFieldOptionsByCategory } from '../../app/lib/rules/match-config'

const transaction = {
  transactionId: 'transaction-1',
  groupedTransactionIds: ['transaction-1'],
  groupKey: null,
  runId: 'run-1',
  accountId: 'account-1',
  statusDimensions: {},
  bookingDate: new Date('2026-01-01'),
  amount: 100,
  counterpartName: 'Nets Danmark A/S',
  processingStatus: null,
  hasProcessingRow: false,
} as MatchableTransaction

const nordeaTransaction = {
  ...transaction,
  counterpartName: 'NETS DENMARK A/S',
  entryAdditionalInfo: '502:REFERENCE:N54102770457',
}

describe('rule matching groups', () => {
  it('uses the canonical counterparty label and CAMT path in rule selectors', () => {
    expect(matchFieldOptionsByCategory.Modpart).toEqual([{
      label: 'Modpart · RltdPties/Dbtr|Cdtr (PstlAdr/AdrLine first, then Nm|Pty/Nm); fallback UltmtDbtr|UltmtCdtr',
      value: 'counterparty_name',
    }])
  })

  it('allows selecting only the canonical counterparty field in the Modpart category', () => {
    const legacyEntry = matchEntrySchema.safeParse({
      category: 'Modpart',
      value: 'nets',
      operator: 'ilike',
      gate: 'ELLER',
      fields: ['counterparty_name'],
    })

    expect(legacyEntry.success).toBe(true)
  })

  it('maps the persisted counterparty field back to the Modpart category', () => {
    const matches = mapConditionsToMatches([
      { field: 'counterparty_name', operator: 'ilike', gate: 'ELLER', value: 'nets' } as any,
    ])

    expect(matches).toEqual([{
      category: 'Modpart',
      value: 'nets',
      operator: 'ilike',
      gate: 'ELLER',
    }])
  })

  it('maps the Modpart category to the single canonical counterparty field', () => {
    const conditions = mapMatchesToConditionRows([{
      category: 'Modpart',
      value: 'Nets',
      operator: 'ilike',
      gate: 'ELLER',
    }])

    expect(conditions.map(condition => condition.field)).toEqual(['counterparty_name'])
    expect(conditions.every(condition => condition.gate === 'ELLER')).toBe(true)
    expect(conditions.every(condition => condition.operator === 'ilike' && condition.value === 'Nets')).toBe(true)
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

  it('matches a Modpart rule against the retained counterparty name', () => {
    const conditions = mapMatchesToConditionRows([{
      category: 'Modpart',
      value: 'Nets',
      operator: 'ilike',
      gate: 'ELLER',
    }])

    expect(evaluateConditionGroups(nordeaTransaction, conditions as any)).toBe(true)
    expect(evaluateConditionGroups({
      ...nordeaTransaction,
      counterpartName: null,
    }, conditions as any)).toBe(false)
  })

  it('treats ilike values as substrings rather than SQL wildcard patterns', () => {
    const conditions = mapMatchesToConditionRows([{
      category: 'Modpart',
      value: '%Nets%',
      operator: 'ilike',
      gate: 'ELLER',
      fields: ['counterparty_name'],
    }])

    expect(evaluateConditionGroups(nordeaTransaction, conditions as any)).toBe(false)
  })
})