import { describe, expect, it } from 'vitest'
import {
  getErpGroupStatus,
  getErpOverviewStatus,
  isErpRequestAccepted,
  selectLatestErpRequestPerDocument,
  type ErpRequestAttempt,
} from '../../app/lib/presenters/erpRequestOverview'

type Attempt = ErpRequestAttempt & {
  status: string
}

describe('ERP request overview', () => {
  it('recognizes accepted requests from document status and legacy response summary', () => {
    expect(isErpRequestAccepted({ documentStatus: 'accepted', responseStatusText: null })).toBe(true)
    expect(isErpRequestAccepted({ documentStatus: 'rejected', responseStatusText: 'OK: 1/1 bilag godkendt' })).toBe(false)
    expect(isErpRequestAccepted({ documentStatus: null, responseStatusText: 'OK: 1/1 bilag godkendt' })).toBe(true)
    expect(isErpRequestAccepted({ documentStatus: null, responseStatusText: 'FEJL: 1 bilag afvist' })).toBe(false)
  })

  it('selects the latest attempt per document without duplicating resend rows', () => {
    const attempts: Attempt[] = [
      {
        requestId: 'initial',
        sourceRequestId: null,
        documentId: 'voucher-1',
        runId: 'run-1',
        outboxCreatedAt: '2026-10-16T08:00:00.000Z',
        eventCreatedAt: '2026-10-16T08:20:00.000Z',
        eventSequence: 5,
        status: 'rejected',
      },
      {
        requestId: 'resend',
        sourceRequestId: 'initial',
        documentId: 'voucher-1',
        runId: 'run-1',
        outboxCreatedAt: '2026-10-16T08:10:00.000Z',
        eventCreatedAt: '2026-10-16T08:11:00.000Z',
        eventSequence: 6,
        status: 'pending',
      },
      {
        requestId: 'manual',
        sourceRequestId: null,
        documentId: 'voucher-2',
        runId: 'run-1',
        outboxCreatedAt: '2026-10-16T08:05:00.000Z',
        eventCreatedAt: '2026-10-16T08:06:00.000Z',
        eventSequence: 3,
        status: 'accepted',
      },
    ]

    const latest = selectLatestErpRequestPerDocument(attempts)

    expect(latest.map(attempt => attempt.requestId)).toEqual(['resend', 'manual'])
    expect(latest.find(attempt => attempt.documentId === 'voucher-1')?.status).toBe('pending')
  })

  it('keeps legacy requests without a document identity separate', () => {
    const attempts: ErpRequestAttempt[] = [
      {
        requestId: 'legacy-1',
        sourceRequestId: null,
        documentId: null,
        runId: 'run-1',
        outboxCreatedAt: null,
        eventCreatedAt: null,
        eventSequence: null,
      },
      {
        requestId: 'legacy-2',
        sourceRequestId: null,
        documentId: null,
        runId: 'run-1',
        outboxCreatedAt: null,
        eventCreatedAt: null,
        eventSequence: null,
      },
    ]

    expect(selectLatestErpRequestPerDocument(attempts).map(attempt => attempt.requestId)).toEqual([
      'legacy-1',
      'legacy-2',
    ])
  })

  it('uses the current send state when a resend has no ERP response yet', () => {
    expect(getErpOverviewStatus({
      responseId: null,
      responseStatusText: null,
      outboxStatus: 'pending',
      outboxLastError: null,
      eventStatus: 'processing',
      eventDetail: 'Genfremsendelse startet.',
    })).toEqual({
      label: 'Sender',
      color: 'warning',
      detail: 'Genfremsendelse startet.',
    })
  })

  it('aggregates child document statuses into the batch status', () => {
    expect(getErpGroupStatus([
      { label: 'Afvist', color: 'error', detail: 'ERP afviste bilaget.' },
      { label: 'Accepteret', color: 'success', detail: 'OK' },
    ])).toEqual({
      label: 'Delvist fejlet',
      color: 'error',
      detail: '1 med fejl, 1 accepteret',
    })
  })
})
