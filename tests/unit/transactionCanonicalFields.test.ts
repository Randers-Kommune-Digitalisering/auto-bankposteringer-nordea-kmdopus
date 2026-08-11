import { describe, expect, it } from 'vitest'

import { projectCanonicalTransactionFields } from '../../server/presenters/transactionCanonicalFields'

describe('transactionCanonicalFields', () => {
  it('prefers readable counterpart-reference posting text', () => {
    const projected = projectCanonicalTransactionFields({
      id: 'tx-1',
      runId: 'run-1',
      bookingDate: '2026-06-02',
      amount: 92,
      creditDebitIndicator: 'CRDT',
      debtorName: 'BAMBORA AB',
      debtorId: null,
      creditorName: null,
      creditorId: null,
      remittanceUstrd: ['63470645-20260804'],
      remittanceAdditional: null,
      remittanceCreditorReference: null,
      entryAdditionalInfo: '502:REFERENCE:KON konto 0970205918',
      txAdditionalInfo: null,
      refsEndToEndId: null,
      refsInstrId: null,
      refsPmtInfId: null,
      uetr: null,
      txAcctSvcrRef: null,
      ntryAcctSvcrRef: null,
      ntryRef: null,
    })

    expect(projected.preferredReference).toBe('63470645-20260804')
    expect(projected.postingText).toBe('BAMBORA AB — 63470645-20260804')
  })

  it('falls back to bank message when counterpart and promoted reference are missing', () => {
    const projected = projectCanonicalTransactionFields({
      id: 'tx-2',
      runId: 'run-1',
      bookingDate: '2026-06-02',
      amount: -32.5,
      creditDebitIndicator: 'DBIT',
      debtorName: null,
      debtorId: null,
      creditorName: null,
      creditorId: null,
      remittanceUstrd: null,
      remittanceAdditional: null,
      remittanceCreditorReference: null,
      entryAdditionalInfo: null,
      txAdditionalInfo: 'KSD12345678901234567890',
      refsEndToEndId: null,
      refsInstrId: null,
      refsPmtInfId: null,
      uetr: null,
      txAcctSvcrRef: null,
      ntryAcctSvcrRef: null,
      ntryRef: null,
    })

    expect(projected.preferredReference).toBe('KSD12345678901234567890')
    expect(projected.postingText).toBe('KSD123456789012345678')
  })
})
