import { describe, expect, it } from 'vitest'
import { resolveRunContinuation } from '../../app/lib/presenters/runContinuation'
import type { RunTimelineResponse } from '../../app/types/runTimeline'

const emptyTimeline: Pick<RunTimelineResponse, 'jobs' | 'outbox' | 'events'> = {
  jobs: [],
  outbox: [],
  events: [],
}

function stageEvent(
  stage: RunTimelineResponse['events'][number]['stage'],
  status: string,
  eventType = status,
): RunTimelineResponse['events'][number] {
  return {
    id: `${stage}-${eventType}`,
    sequence: 1,
    stage,
    eventType,
    status,
    detail: null,
    requestId: null,
    outboxId: null,
    attempt: null,
    createdAt: '2026-10-26T10:00:00.000Z',
  }
}

describe('run continuation resolver', () => {
  it('offers continuation for a failed bank stage even when its job succeeded', () => {
    const timeline: typeof emptyTimeline = {
      ...emptyTimeline,
      jobs: [{
        id: 'job-1',
        type: 'banking.ingest',
        status: 'succeeded',
        runId: 'run-1',
        attempts: 0,
        runAt: '2026-10-26T09:00:00.000Z',
        lastError: null,
        updatedAt: '2026-10-26T10:01:00.000Z',
      }],
      events: [stageEvent('banking', 'failed', 'completed_with_errors')],
    }

    expect(resolveRunContinuation(timeline)).toEqual({
      kind: 'continue-run',
      stage: 'banking',
      label: 'Fortsæt kørsel',
    })
  })

  it('continues from a failed matching stage', () => {
    const timeline = {
      ...emptyTimeline,
      events: [stageEvent('banking', 'succeeded'), stageEvent('matching', 'failed')],
    }

    expect(resolveRunContinuation(timeline)?.stage).toBe('matching')
  })

  it('tries only technical ERP transport failures', () => {
    const timeline: typeof emptyTimeline = {
      ...emptyTimeline,
      outbox: [{
        id: 'outbox-1',
        topic: 'erp.uploadPostingXml',
        status: 'failed',
        attempts: 1,
        nextAttemptAt: '2026-10-26T10:05:00.000Z',
        lastError: 'Connection failed',
        requestId: 'request-1',
        documentId: 'document-1',
        responseId: null,
        responseStatusText: null,
        createdAt: '2026-10-26T10:00:00.000Z',
        processedAt: null,
      }],
      events: [stageEvent('banking', 'succeeded'), stageEvent('matching', 'succeeded')],
    }

    expect(resolveRunContinuation(timeline)).toEqual({
      kind: 'retry-outbox',
      stage: 'erp',
      label: 'Forsøg genkørsel',
      outboxId: 'outbox-1',
    })

    expect(resolveRunContinuation({
      ...timeline,
      events: [...timeline.events, stageEvent('erp', 'rejected', 'response_rejected')],
      outbox: timeline.outbox.map(item => ({ ...item, status: 'sent' })),
    })).toBeNull()
  })

  it('does not offer actions while run work is pending or in progress', () => {
    const timeline: typeof emptyTimeline = {
      ...emptyTimeline,
      jobs: [{
        id: 'job-1',
        type: 'banking.ingest',
        status: 'in_progress',
        runId: 'run-1',
        attempts: 0,
        runAt: '2026-10-26T09:00:00.000Z',
        lastError: null,
        updatedAt: '2026-10-26T10:01:00.000Z',
      }],
      events: [stageEvent('banking', 'failed')],
    }

    expect(resolveRunContinuation(timeline)).toBeNull()
  })

  it('does not treat manual booking activity as an automatic retry', () => {
    expect(resolveRunContinuation({
      ...emptyTimeline,
      events: [stageEvent('manual', 'failed')],
    })).toBeNull()
  })
})