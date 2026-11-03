import { describe, expect, it } from 'vitest'

import { projectCanonicalTransactionFields } from '../../server/presenters/transactionCanonicalFields'

describe('transactionCanonicalFields', () => {
  it('ignores the sequential NtryRef and prefers a meaningful retained entry reference', () => {
    const projected = projectCanonicalTransactionFields({
      id: 'tx-1',
      runId: 'run-1',
      bookingDate: '2026-06-02',
      amount: 92,
      creditDebitIndicator: 'CRDT',
      entryAdditionalInfo: '502:REFERENCE:KON konto 0970205918',
      ntryAcctSvcrRef: 'ACCT-SVC-1',
      ntryRef: '63470645-20260804',
    })

    expect(projected.preferredReference).toBe('ACCT-SVC-1')
    expect(projected.postingText).toBe('ACCT-SVC-1')
    expect(projected.referenceDetails.map((entry) => entry.source)).toEqual([
      '/Ntry/AcctSvcrRef',
      '/Ntry/AddtlNtryInf',
    ])
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

  it('retains the counterparty name and source only for a single-detail entry', () => {
    const projection = projectCanonicalTransactionFields({
      id: 'tx-3',
      runId: 'run-1',
      bookingDate: '2026-06-02',
      amount: 25,
      creditDebitIndicator: 'CRDT',
      underlyingTransactionCount: 1,
      counterpartName: 'Sender A/S',
      counterpartNameSource: '/Ntry/NtryDtls/TxDtls/RltdPties/Dbtr/Pty/Nm',
      entryAdditionalInfo: null,
      ntryAcctSvcrRef: null,
      ntryRef: null,
    })

    expect(projection.counterpart).toBe('Sender A/S')
    expect(projection.counterpartHint).toBe('/Ntry/NtryDtls/TxDtls/RltdPties/Dbtr/Pty/Nm')
  })

  it('hides the counterparty from aggregated entries', () => {
    const projection = projectCanonicalTransactionFields({
      id: 'tx-4',
      runId: 'run-1',
      bookingDate: '2026-06-02',
      amount: 25,
      creditDebitIndicator: 'CRDT',
      underlyingTransactionCount: 9444,
      counterpartName: 'Sender A/S',
      counterpartNameSource: '/Ntry/NtryDtls/TxDtls/RltdPties/Dbtr/Pty/Nm',
      entryAdditionalInfo: null,
      ntryAcctSvcrRef: null,
      ntryRef: null,
    })

    expect(projection.counterpart).toBeNull()
    expect(projection.counterpartHint).toBeNull()
  })
})
