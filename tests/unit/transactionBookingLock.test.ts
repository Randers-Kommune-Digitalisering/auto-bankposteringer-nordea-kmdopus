import { describe, expect, it } from 'vitest'
import { resolveBookingLockScope, type BookingLockCandidate } from '../../server/utils/transactionBookingLock'

describe('transaction booking lock scope', () => {
  it('resolves the full semantic group independently of filtered results', () => {
    const candidates: BookingLockCandidate[] = [
      {
        id: '00000000-0000-4000-8000-000000000001',
        accountId: 'account-a',
        bookingDate: new Date('2026-01-02T00:00:00.000Z'),
        creditDebitIndicator: 'CRDT',
        statementId: 'statement-a',
        entryIndex: 1,
        ntryRef: 'Batch-1',
        ntryAcctSvcrRef: 'Entry-1',
        entryAdditionalInfo: null,
        processingStatus: 'åben',
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        accountId: 'account-a',
        bookingDate: new Date('2026-01-02T00:00:00.000Z'),
        creditDebitIndicator: 'CRDT',
        statementId: 'statement-a',
        entryIndex: 1,
        ntryRef: 'Batch-1',
        ntryAcctSvcrRef: 'Entry-1',
        entryAdditionalInfo: null,
        processingStatus: 'åben',
      },
      {
        id: '00000000-0000-4000-8000-000000000003',
        accountId: 'account-a',
        bookingDate: new Date('2026-01-02T00:00:00.000Z'),
        creditDebitIndicator: 'CRDT',
        statementId: 'statement-a',
        entryIndex: 2,
        ntryRef: 'Unrelated',
        ntryAcctSvcrRef: 'Entry-2',
        entryAdditionalInfo: null,
        processingStatus: 'åben',
      },
    ]

    expect(resolveBookingLockScope(candidates[0]!.id, candidates)).toEqual({
      allTransactionIds: [candidates[0]!.id, candidates[1]!.id],
      openTransactionIds: [candidates[0]!.id, candidates[1]!.id],
    })
  })

  it('keeps processed members in the semantic group but excludes them from the active claim', () => {
    const candidates: BookingLockCandidate[] = [
      {
        id: '00000000-0000-4000-8000-000000000011',
        accountId: 'account-a',
        bookingDate: new Date('2026-01-02T00:00:00.000Z'),
        creditDebitIndicator: 'CRDT',
        statementId: 'statement-a',
        entryIndex: 1,
        ntryRef: 'Batch-1',
        ntryAcctSvcrRef: 'Entry-1',
        entryAdditionalInfo: null,
        processingStatus: 'åben',
      },
      {
        id: '00000000-0000-4000-8000-000000000012',
        accountId: 'account-a',
        bookingDate: new Date('2026-01-02T00:00:00.000Z'),
        creditDebitIndicator: 'CRDT',
        statementId: 'statement-a',
        entryIndex: 1,
        ntryRef: 'Batch-1',
        ntryAcctSvcrRef: 'Entry-1',
        entryAdditionalInfo: null,
        processingStatus: 'bogført',
      },
    ]

    expect(resolveBookingLockScope(candidates[0]!.id, candidates)).toEqual({
      allTransactionIds: [candidates[0]!.id, candidates[1]!.id],
      openTransactionIds: [candidates[0]!.id],
    })
  })
})