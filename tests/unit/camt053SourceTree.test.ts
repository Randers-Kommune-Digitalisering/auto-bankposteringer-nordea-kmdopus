import { describe, expect, it } from 'vitest'
import { buildCamt053SourceTree } from '../../server/utils/banking/camt053SourceTree'

const source = {
  statementId: 'STATEMENT-1',
  entryIndex: 2,
  underlyingTransactionCount: 9444,
  amount: '9444.00',
  currency: 'DKK',
  creditDebitIndicator: 'CRDT',
  status: 'BOOK',
  bookingDate: '2026-06-30',
  valueDate: '2026-06-29',
  ntryRef: 'ENTRY-1',
  ntryAcctSvcrRef: 'ACCT-REF',
  entryAdditionalInfo: 'Entry summary',
  bkTxCdDomain: 'PMNT',
  bkTxCdFamily: 'RCDT',
  bkTxCdSubFamily: 'ESCT',
  bkTxCdProprietary: null,
}

function flatten(node: NonNullable<ReturnType<typeof buildCamt053SourceTree>>) {
  return [node, ...(node.children ?? []).flatMap(flatten)]
}

describe('buildCamt053SourceTree', () => {
  it('creates a generated entry summary without child transaction fields', () => {
    const tree = buildCamt053SourceTree(source)
    const nodes = flatten(tree!)

    expect(tree?.name).toBe('EntrySummary')
    expect(nodes.map((node) => node.name)).not.toContain('TxDtls')
    expect(nodes.find((node) => node.name === 'StatementId')?.children?.[0]?.value).toBe('STATEMENT-1')
    expect(nodes.find((node) => node.name === 'UnderlyingTransactionCount')?.children?.[0]?.value).toBe('9444')
    expect(nodes.find((node) => node.name === 'Amt')).toMatchObject({
      attributes: [{ name: 'Ccy', value: 'DKK' }],
      children: [{ value: '9444.00' }],
    })
    expect(nodes.find((node) => node.name === 'AddtlNtryInf')?.children?.[0]?.value).toBe('Entry summary')
  })

  it('returns null when the entry index is unavailable', () => {
    expect(buildCamt053SourceTree({ ...source, entryIndex: null })).toBeNull()
    expect(buildCamt053SourceTree({ ...source, entryIndex: 0 })).toBeNull()
  })
})
