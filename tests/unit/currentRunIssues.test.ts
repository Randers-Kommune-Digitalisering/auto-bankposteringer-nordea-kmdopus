import { describe, expect, it } from 'vitest'
import {
  collectCurrentRunIssues,
  resolveCurrentErpDocumentRejections,
} from '../../server/utils/runs/currentRunIssues'
import { resolveEffectiveRunStatus } from '../../server/utils/runs/runStatus'

describe('collectCurrentRunIssues', () => {
  it('uses current ERP outbox state and ignores retrying/sent rows', () => {
    const issues = collectCurrentRunIssues({
      errorLogs: [
        { id: 'mirror', runId: 'run-1', source: 'erp', errorCode: 502, errorString: 'SFTP timeout', createdAt: new Date('2026-10-15T10:00:00Z') },
      ],
      jobs: [],
      outbox: [
        { id: 'failed', runId: 'run-1', topic: 'erp.uploadRequestPayload', status: 'failed', lastError: 'SFTP timeout', createdAt: new Date('2026-10-15T10:00:00Z') },
        { id: 'retrying', runId: 'run-2', topic: 'erp.uploadRequestPayload', status: 'processing', lastError: 'Old timeout', createdAt: new Date('2026-10-15T10:00:00Z') },
        { id: 'sent', runId: 'run-3', topic: 'erp.uploadRequestPayload', status: 'sent', lastError: null, createdAt: new Date('2026-10-15T10:00:00Z') },
      ],
    })

    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ id: 'outbox:failed', runId: 'run-1', source: 'erp', message: 'SFTP timeout' })
  })

  it('clears a mirrored ERP upload error when its outbox row is retrying or sent', () => {
    const issues = collectCurrentRunIssues({
      errorLogs: [
        { id: 'retry-log', runId: 'run-1', source: 'erp', errorCode: 502, errorString: 'SFTP timeout', createdAt: new Date('2026-10-15T10:00:00Z') },
        { id: 'sent-log', runId: 'run-2', source: 'erp', errorCode: 502, errorString: 'SFTP timeout', createdAt: new Date('2026-10-15T10:00:00Z') },
      ],
      jobs: [],
      outbox: [
        { id: 'retrying', runId: 'run-1', topic: 'erp.uploadRequestPayload', status: 'processing', lastError: 'SFTP timeout', createdAt: new Date('2026-10-15T10:00:00Z') },
        { id: 'sent', runId: 'run-2', topic: 'erp.uploadRequestPayload', status: 'sent', lastError: null, createdAt: new Date('2026-10-15T10:00:00Z') },
      ],
    })

    expect(issues).toEqual([])
  })

  it('keeps non-ERP errors and failed run-scoped jobs', () => {
    const issues = collectCurrentRunIssues({
      errorLogs: [
        { id: 'app-error', runId: 'run-1', source: 'application', errorCode: 500, errorString: 'Matching failed', createdAt: new Date('2026-10-15T10:00:00Z') },
      ],
      jobs: [
        { id: 'job-1', runId: 'run-2', type: 'banking.ingest', status: 'failed', lastError: 'Bank unavailable', updatedAt: new Date('2026-10-15T10:00:00Z') },
        { id: 'job-2', runId: 'run-3', type: 'banking.ingest', status: 'pending', lastError: null, updatedAt: new Date('2026-10-15T10:00:00Z') },
      ],
      outbox: [],
    })

    expect(issues.map(issue => issue.id)).toEqual(['error:app-error', 'job:job-1'])
  })

  it('clears pre-continuation banking errors from the current status but keeps new retry failures', () => {
    const oldError = { id: 'old-error', runId: 'run-1', source: 'banking' as const, errorCode: null, errorString: 'First attempt failed', createdAt: new Date('2026-10-15T10:00:00Z') }
    const retryRequested = {
      runId: 'run-1',
      stage: 'banking',
      eventType: 'continuation_requested',
      status: 'pending',
      createdAt: new Date('2026-10-15T10:01:00Z'),
    }

    const pendingIssues = collectCurrentRunIssues({
      errorLogs: [oldError],
      jobs: [{ id: 'job-0', runId: 'run-1', type: 'banking.ingest', status: 'failed', lastError: 'First attempt failed', updatedAt: new Date('2026-10-15T10:00:30Z') }],
      outbox: [],
      stageEvents: [retryRequested],
    })
    expect(pendingIssues).toEqual([])
    expect(resolveEffectiveRunStatus({
      baseStatus: 'afventer',
      hasActiveErrors: pendingIssues.length > 0,
      hasNegativeErpResponse: false,
      hasFailedIo: false,
      hasInFlightIo: true,
    })).toBe('afventer')

    const failedRetryIssues = collectCurrentRunIssues({
      errorLogs: [
        oldError,
        { id: 'retry-error', runId: 'run-1', source: 'banking', errorCode: null, errorString: 'Retry failed', createdAt: new Date('2026-10-15T10:02:00Z') },
      ],
      jobs: [
        { id: 'job-0', runId: 'run-1', type: 'banking.ingest', status: 'failed', lastError: 'First attempt failed', updatedAt: new Date('2026-10-15T10:00:30Z') },
        { id: 'job-1', runId: 'run-1', type: 'banking.ingest', status: 'failed', lastError: 'Retry failed', updatedAt: new Date('2026-10-15T10:03:00Z') },
      ],
      outbox: [],
      stageEvents: [
        retryRequested,
        {
          ...retryRequested,
          eventType: 'completed_with_errors',
          status: 'failed',
          createdAt: new Date('2026-10-15T10:03:00Z'),
        },
      ],
    })
    expect(failedRetryIssues.map(issue => issue.id)).toEqual(['error:retry-error', 'job:job-1'])

    const completedIssues = collectCurrentRunIssues({
      errorLogs: [oldError],
      jobs: [{ id: 'job-0', runId: 'run-1', type: 'banking.ingest', status: 'failed', lastError: 'First attempt failed', updatedAt: new Date('2026-10-15T10:00:30Z') }],
      outbox: [],
      stageEvents: [
        retryRequested,
        {
          ...retryRequested,
          eventType: 'completed',
          status: 'succeeded',
          createdAt: new Date('2026-10-15T10:04:00Z'),
        },
      ],
    })
    expect(completedIssues).toEqual([])
    expect(resolveEffectiveRunStatus({
      baseStatus: 'udført',
      hasActiveErrors: completedIssues.length > 0,
      hasNegativeErpResponse: false,
      hasFailedIo: false,
      hasInFlightIo: false,
    })).toBe('udført')
  })

  it('counts distinct failed deliveries even when their messages match', () => {
    const issues = collectCurrentRunIssues({
      errorLogs: [],
      jobs: [],
      outbox: [
        { id: 'failed-1', runId: 'run-1', topic: 'erp.uploadRequestPayload', status: 'failed', lastError: 'SFTP timeout', createdAt: new Date('2026-10-15T10:00:00Z') },
        { id: 'failed-2', runId: 'run-1', topic: 'erp.uploadRequestPayload', status: 'failed', lastError: 'SFTP timeout', createdAt: new Date('2026-10-15T10:01:00Z') },
      ],
    })

    expect(issues.map(issue => issue.id)).toEqual(['outbox:failed-1', 'outbox:failed-2'])
  })

  it('includes failed run-scoped outbox work outside ERP', () => {
    const issues = collectCurrentRunIssues({
      errorLogs: [],
      jobs: [],
      outbox: [
        { id: 'banking-failed', runId: 'run-1', topic: 'banking.fetchStatement', status: 'failed', lastError: 'Bank unavailable', createdAt: new Date('2026-10-15T10:00:00Z') },
      ],
    })

    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ source: 'banking', message: 'Bank unavailable' })
  })

  it('includes an ERP rejection once per current bilag', () => {
    const issues = collectCurrentRunIssues({
      errorLogs: [],
      jobs: [],
      outbox: [],
      rejectedErpDocuments: [
        { id: 'response-document', runId: 'run-1', documentId: 'bilag-1', message: 'Bilag afvist', createdAt: new Date('2026-10-15T10:00:00Z') },
      ],
    })

    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ id: 'erp-document:bilag-1', source: 'erp', message: 'Bilag afvist' })
  })

  it('supersedes an old rejection while a newer request for that bilag is pending', () => {
    const rejections = resolveCurrentErpDocumentRejections({
      requests: [
        { runId: 'run-1', requestId: 'original', sourceRequestId: null, documentId: 'bilag-1' },
        { runId: 'run-1', requestId: 'correction', sourceRequestId: 'original', documentId: 'bilag-1' },
      ],
      outbox: [
        { requestId: 'original', topic: 'erp.uploadRequestPayload', createdAt: new Date('2026-10-15T10:00:00Z') },
        { requestId: 'correction', topic: 'erp.uploadRequestPayload', createdAt: new Date('2026-10-15T11:00:00Z') },
      ],
      outcomes: [
        { runId: 'run-1', requestId: 'original', documentId: 'bilag-1', status: 'rejected', messages: [{ type: 'E', number: '1', text: 'Tidligere afvist' }] },
      ],
    })

    expect(rejections).toEqual([])
  })

  it('keeps a rejection from the latest request for the bilag', () => {
    const rejections = resolveCurrentErpDocumentRejections({
      requests: [
        { runId: 'run-1', requestId: 'original', sourceRequestId: null, documentId: 'bilag-1' },
        { runId: 'run-1', requestId: 'correction', sourceRequestId: 'original', documentId: 'bilag-1' },
      ],
      outbox: [
        { requestId: 'correction', topic: 'erp.uploadRequestPayload', createdAt: new Date('2026-10-15T11:00:00Z') },
      ],
      outcomes: [
        { runId: 'run-1', requestId: 'correction', documentId: 'bilag-1', status: 'rejected', messages: [{ type: 'E', number: '2', text: 'Bilag afvist igen' }] },
      ],
    })

    expect(rejections).toHaveLength(1)
    expect(rejections[0]).toMatchObject({ documentId: 'bilag-1', message: 'Bilag afvist igen' })
  })

  it('uses a non-OK response summary when the ERP provides no document outcomes', () => {
    const rejections = resolveCurrentErpDocumentRejections({
      requests: [
        { runId: 'run-1', requestId: 'request-1', sourceRequestId: null, documentId: 'bilag-1' },
      ],
      outbox: [],
      outcomes: [],
      responseStatuses: [
        { runId: 'run-1', requestId: 'request-1', statusText: 'FEJL: Responsefil kunne ikke fortolkes' },
      ],
    })

    expect(rejections).toHaveLength(1)
    expect(rejections[0]?.message).toBe('FEJL: Responsefil kunne ikke fortolkes')
  })
})