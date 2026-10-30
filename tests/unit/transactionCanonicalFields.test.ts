import { describe, expect, it } from 'vitest'

import { projectCanonicalTransactionFields } from '../../server/presenters/transactionCanonicalFields'

describe('transactionCanonicalFields', () => {
  it('prefers a retained entry reference over technical additional information', () => {
    const projected = projectCanonicalTransactionFields({
      id: 'tx-1',
      runId: 'run-1',
      bookingDate: '2026-06-02',
      amount: 92,
      creditDebitIndicator: 'CRDT',
      entryAdditionalInfo: '502:REFERENCE:KON konto 0970205918',
      ntryAcctSvcrRef: null,
      ntryRef: '63470645-20260804',
    })

    expect(projected.preferredReference).toBe('63470645-20260804')
    expect(projected.postingText).toBe('63470645-20260804')
  })

  it('uses entry-level additional information when no entry reference exists', () => {
    const projected = projectCanonicalTransactionFields({
      id: 'tx-2',
      runId: 'run-1',
      bookingDate: '2026-06-02',
      amount: -32.5,
      creditDebitIndicator: 'DBIT',
      entryAdditionalInfo: 'KSD12345678901234567890',
      ntryAcctSvcrRef: null,
      ntryRef: null,
    })

    expect(projected.preferredReference).toBe('KSD12345678901234567890')
    expect(projected.postingText).toBe('KSD12345678901234567890')
  })
})
