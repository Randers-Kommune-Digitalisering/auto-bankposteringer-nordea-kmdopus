import { describe, expect, it } from 'vitest'
import { compareTimelineEvents, getErpTimelineDeliveryState, getErpTimelineStageState, groupErpTimelineDeliveries, latestTimelineStageEvent, RUN_TIMELINE_STAGE_ORDER } from '../../app/lib/presenters/runTimeline'
import { getRunStatusPresentation } from '../../app/lib/presenters/runStatus'
import type { RunTimelineResponse } from '../../app/types/runTimeline'

const emptyTimeline: RunTimelineResponse = {
  run: { id: 'run-1', bookingDate: '2026-10-06', status: 'udført' },
  jobs: [],
  outbox: [],
  erpRequests: [],
  errors: [],
  events: [],
  matching: {
    totalSamleposter: 0,
    processedSamleposter: 0,
    bookedSamleposter: 0,
    exceptedSamleposter: 0,
    openSamleposter: 0,
    mixedSamleposter: 0,
    manualBookedSamleposter: 0,
  },
}

describe('run timeline ERP grouping', () => {
  it('keeps four stage positions in the agreed pipeline order', () => {
    expect(RUN_TIMELINE_STAGE_ORDER).toEqual(['banking', 'matching', 'manual', 'erp'])
  })

  it('keeps corrected requests for the same document in one delivery group', () => {
    const requests: RunTimelineResponse['erpRequests'] = [
      { requestId: 'request-original', sourceRequestId: null, documentId: 'document-1', responseId: null, responseStatusText: null, lineCount: 1 },
      { requestId: 'request-retry', sourceRequestId: 'request-original', documentId: 'document-1', responseId: null, responseStatusText: null, lineCount: 1 },
    ]

    const groups = groupErpTimelineDeliveries(requests, [], [])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.requestIds).toEqual(['request-original', 'request-retry'])
    expect(getErpTimelineStageState(groups).label).toBe('Afventer')
    expect(getErpTimelineStageState(groups).description).toBe('')
  })

  it('only includes a bilag count in the stage description when multiple deliveries exist', () => {
    const requests: RunTimelineResponse['erpRequests'] = [
      { requestId: 'request-1', sourceRequestId: null, documentId: 'document-1', responseId: null, responseStatusText: null, lineCount: 1 },
      { requestId: 'request-2', sourceRequestId: null, documentId: 'document-2', responseId: null, responseStatusText: null, lineCount: 1 },
    ]
    const groups = groupErpTimelineDeliveries(requests, [], [])

    expect(getErpTimelineStageState(groups).description).toBe('2 bilag')
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

  it('uses occurrence timestamp before sequence when selecting a stage status', () => {
    const events: RunTimelineResponse['events'] = [
      { id: 'later-sequence', sequence: 2, stage: 'manual', eventType: 'booking_failed', status: 'failed', detail: 'Later in sequence, earlier occurrence.', requestId: null, outboxId: null, attempt: null, createdAt: '2026-10-06T10:04:00.000Z' },
      { id: 'later-occurrence', sequence: 1, stage: 'manual', eventType: 'booking_completed', status: 'succeeded', detail: 'Latest occurrence.', requestId: 'request-1', outboxId: null, attempt: null, createdAt: '2026-10-06T10:05:00.000Z' },
    ]

    expect(latestTimelineStageEvent(events, 'manual')?.id).toBe('later-occurrence')
    expect(compareTimelineEvents(events[0]!, events[1]!)).toBeLessThan(0)
  })
})

describe('run status presentation', () => {
  it('uses the same overall status wording and color for the run list and timeline', () => {
    expect(getRunStatusPresentation('afventer')).toEqual({ color: 'warning', label: 'Afventer' })
    expect(getRunStatusPresentation('indlæser')).toEqual({ color: 'warning', label: 'Indlæser' })
    expect(getRunStatusPresentation('udført')).toEqual({ color: 'success', label: 'Udført' })
    expect(getRunStatusPresentation('fejl')).toEqual({ color: 'error', label: 'Fejl' })
  })
})