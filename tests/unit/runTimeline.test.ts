import { describe, expect, it } from 'vitest'
import { getErpTimelineDeliveryState, getErpTimelineStageState, groupErpTimelineDeliveries } from '../../app/lib/presenters/runTimeline'
import type { RunTimelineResponse } from '../../app/types/runTimeline'

const emptyTimeline: RunTimelineResponse = {
  run: { id: 'run-1', bookingDate: '2026-10-06', status: 'udført' },
  jobs: [],
  outbox: [],
  erpRequests: [],
  errors: [],
  events: [],
  matching: { totalTransactions: 0, processedTransactions: 0, matched: 0, exception: 0, open: 0 },
}

describe('run timeline ERP grouping', () => {
  it('keeps corrected requests for the same document in one delivery group', () => {
    const requests: RunTimelineResponse['erpRequests'] = [
      { requestId: 'request-original', sourceRequestId: null, documentId: 'document-1', responseId: null, responseStatusText: null, lineCount: 1 },
      { requestId: 'request-retry', sourceRequestId: 'request-original', documentId: 'document-1', responseId: null, responseStatusText: null, lineCount: 1 },
    ]

    const groups = groupErpTimelineDeliveries(requests, [], [])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.requestIds).toEqual(['request-original', 'request-retry'])
    expect(getErpTimelineStageState(groups).label).toBe('Afventer')
  })

  it('uses the latest correlated event as the document status', () => {
    const events: RunTimelineResponse['events'] = [
      { id: 'event-1', sequence: 1, stage: 'erp', eventType: 'response_rejected', status: 'rejected', detail: 'ERP afviste bilaget.', requestId: 'request-1', outboxId: null, attempt: null, createdAt: '2026-10-06T10:00:00.000Z' },
      { id: 'event-2', sequence: 2, stage: 'erp', eventType: 'upload_attempt_started', status: 'processing', detail: 'Korrigeret forsøg startet.', requestId: 'request-2', outboxId: 'outbox-2', attempt: 1, createdAt: '2026-10-06T10:05:00.000Z' },
      { id: 'event-3', sequence: 3, stage: 'erp', eventType: 'response_rejected', status: 'rejected', detail: 'Forsinket svar på originalen.', requestId: 'request-1', outboxId: null, attempt: null, createdAt: '2026-10-06T10:06:00.000Z' },
    ]
    const requests: RunTimelineResponse['erpRequests'] = [
      { requestId: 'request-1', sourceRequestId: null, documentId: 'document-1', responseId: null, responseStatusText: null, lineCount: 1 },
      { requestId: 'request-2', sourceRequestId: 'request-1', documentId: 'document-1', responseId: null, responseStatusText: null, lineCount: 1 },
    ]
    const groups = groupErpTimelineDeliveries(requests, emptyTimeline.outbox, events)

    expect(groups).toHaveLength(1)
    expect(getErpTimelineDeliveryState(groups[0]!).label).toBe('Sender')
    expect(getErpTimelineStageState(groups).color).toBe('warning')
  })
})