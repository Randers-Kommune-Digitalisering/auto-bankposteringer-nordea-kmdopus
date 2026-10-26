export type RunContinuationSnapshot = {
  jobs: Array<{ type: string; status: string; updatedAt: string }>
  outbox: Array<{ id: string; topic: string; status: string; createdAt: string }>
  events: Array<{
    stage: 'banking' | 'matching' | 'manual' | 'erp'
    status: string | null
    createdAt: string
    sequence: number
  }>
}

export type RunContinuationAction =
  | { kind: 'continue-run'; stage: 'banking' | 'matching'; label: 'Fortsæt kørsel' }
  | { kind: 'retry-outbox'; stage: 'erp'; label: 'Forsøg genkørsel'; outboxId: string }

const RETRYABLE_OUTBOX_TOPICS = new Set(['erp.uploadRequestPayload', 'erp.uploadPostingXml'])

function isActiveJob(status: string): boolean {
  return status === 'pending' || status === 'in_progress'
}

function latestJob(jobs: RunContinuationSnapshot['jobs'], type: string) {
  return jobs
    .filter(job => job.type === type)
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))[0]
}

function latestStageEvent(snapshot: RunContinuationSnapshot, stage: 'banking' | 'matching') {
  return snapshot.events
    .filter(event => event.stage === stage)
    .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt) || left.sequence - right.sequence)
    .at(-1)
}

function isUnresolvedFailure(
  event: ReturnType<typeof latestStageEvent>,
  jobStatus?: string,
): boolean {
  if (event?.status === 'failed') return true
  if (jobStatus !== 'failed') return false
  return !event || !['succeeded', 'accepted'].includes(event.status ?? '')
}

export function resolveRunContinuation(
  timeline: RunContinuationSnapshot,
): RunContinuationAction | null {
  if (timeline.jobs.some(job => job.type === 'banking.ingest' && isActiveJob(job.status))) {
    return null
  }

  const bankingEvent = latestStageEvent(timeline, 'banking')
  const matchingEvent = latestStageEvent(timeline, 'matching')
  const bankingJob = latestJob(timeline.jobs, 'banking.ingest')

  if (isUnresolvedFailure(bankingEvent, bankingJob?.status)) {
    return { kind: 'continue-run', stage: 'banking', label: 'Fortsæt kørsel' }
  }

  if (isUnresolvedFailure(matchingEvent, bankingJob?.status)) {
    return { kind: 'continue-run', stage: 'matching', label: 'Fortsæt kørsel' }
  }

  const activeOutbox = timeline.outbox.some(item => item.status === 'pending' || item.status === 'processing')
  if (activeOutbox) return null

  const failedOutbox = timeline.outbox
    .filter(item => item.status === 'failed' && RETRYABLE_OUTBOX_TOPICS.has(item.topic))
    .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt))[0]

  if (failedOutbox) {
    return {
      kind: 'retry-outbox',
      stage: 'erp',
      label: 'Forsøg genkørsel',
      outboxId: failedOutbox.id,
    }
  }

  return null
}