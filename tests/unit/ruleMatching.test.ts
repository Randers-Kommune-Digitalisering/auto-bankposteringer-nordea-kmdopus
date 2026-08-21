import { describe, expect, it } from 'vitest'
import type { MatchableTransaction } from '../../engine/matching/handlers/transactionMatchingService'
import { evaluateConditionGroups } from '../../engine/matching/handlers/transactionMatchingService'
import { mapConditionsToMatches, mapMatchesToConditionRows, matchEntrySchema } from '../../app/lib/db/schema/rule'

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
})