import { describe, expect, it } from 'vitest'
import { summarizeRunSamleposter, type RunSamlepostRow } from '../../server/utils/runs/runSamlepostSummary'

function row(input: Partial<RunSamlepostRow> & Pick<RunSamlepostRow, 'id'>): RunSamlepostRow {
  return {
    accountId: 'account-1',
    bookingDate: '2026-10-13',
    creditDebitIndicator: 'CRDT',
    statementId: null,
    entryIndex: null,
    entryGroupSize: 1,
    ntryRef: null,
    entryAdditionalInfo: null,
    ntryAcctSvcrRef: null,
    processingStatus: null,
    processingSource: null,
    ...input,
  }
}

describe('summarizeRunSamleposter', () => {
  it('counts a batch once and marks it open when a member is unprocessed', () => {
    const summary = summarizeRunSamleposter([
      row({ id: 'tx-1', statementId: 'statement-1', entryIndex: 1, ntryRef: 'entry-1', processingStatus: 'bogført' }),
      row({ id: 'tx-2', statementId: 'statement-1', entryIndex: 1, ntryRef: 'entry-1' }),
      row({ id: 'tx-3', processingStatus: 'undtaget' }),
    ])

    expect(summary).toEqual({
      totalSamleposter: 2,
      processedSamleposter: 1,
      bookedSamleposter: 0,
      exceptedSamleposter: 1,
      openSamleposter: 1,
      mixedSamleposter: 0,
      manualBookedSamleposter: 0,
    })
  })

  it('classifies and counts a group with mixed terminal statuses once', () => {
    const summary = summarizeRunSamleposter([
      row({ id: 'tx-1', statementId: 'statement-1', entryIndex: 1, ntryRef: 'entry-1', processingStatus: 'bogført' }),
      row({ id: 'tx-2', statementId: 'statement-1', entryIndex: 1, ntryRef: 'entry-1', processingStatus: 'undtaget' }),
    ])

    expect(summary.processedSamleposter).toBe(1)
    expect(summary.mixedSamleposter).toBe(1)
    expect(summary.bookedSamleposter).toBe(0)
    expect(summary.exceptedSamleposter).toBe(0)
  })

  it('counts a manually booked group once', () => {
    const summary = summarizeRunSamleposter([
      row({ id: 'tx-1', statementId: 'statement-1', entryIndex: 1, ntryRef: 'entry-1', processingStatus: 'bogført', processingSource: 'manuel' }),
      row({ id: 'tx-2', statementId: 'statement-1', entryIndex: 1, ntryRef: 'entry-1', processingStatus: 'bogført', processingSource: 'manuel' }),
    ])

    expect(summary.manualBookedSamleposter).toBe(1)
    expect(summary.processedSamleposter).toBe(1)
    expect(summary.totalSamleposter).toBe(1)
  })
})