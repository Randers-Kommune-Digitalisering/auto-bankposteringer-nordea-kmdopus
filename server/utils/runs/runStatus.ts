import type { RunStatus } from '~/lib/db/schema/enums'

const MISSING_MAPPING_ERROR_PATTERN = /Mangler konterings-mapping \((artskonto|statuskonto)\) for bankkonto:/i
const RECOVERY_SUCCESS_PATTERN = /^Genkørsel efter (statuskonto-mapping|ignorering af bankkonto) lykkedes\./i
const RECOVERY_REQUESTED_PATTERN = /Automatisk genkørsel planlagt\./i

export type RunErrorSummaryRow = {
  source?: unknown
  errorCode: unknown
  errorString: unknown
  createdAt: unknown
}

export type RunStageEventSummary = {
  stage: unknown
  eventType: unknown
  status: unknown
  createdAt: unknown
}

export type RunJobSummary = {
  type: unknown
  status: unknown
  updatedAt: unknown
}

export function isSeverityError(code: unknown): boolean {
  if (code == null) return true
  const numericCode = Number(code)
  return !Number.isFinite(numericCode) || numericCode >= 400
}

function toEpochMs(value: unknown): number {
  const timestamp = value instanceof Date ? value : new Date(String(value ?? ''))
  const milliseconds = timestamp.getTime()
  return Number.isFinite(milliseconds) ? milliseconds : 0
}

function isMissingMappingError(message: unknown): boolean {
  return MISSING_MAPPING_ERROR_PATTERN.test(String(message ?? ''))
}

function isRecoverySuccessEvent(row: RunErrorSummaryRow): boolean {
  const code = Number(row.errorCode)
  if (Number.isFinite(code) && code !== 200) return false
  return RECOVERY_SUCCESS_PATTERN.test(String(row.errorString ?? ''))
}

function isRecoveryRequestedEvent(row: RunErrorSummaryRow): boolean {
  return Number(row.errorCode) === 202 && RECOVERY_REQUESTED_PATTERN.test(String(row.errorString ?? ''))
}

function isResolvedByLaterStageEvent(
  row: RunErrorSummaryRow,
  events: RunStageEventSummary[],
): boolean {
  const stage = row.source === 'banking'
    ? 'banking'
    : row.source === 'application' && isMissingMappingError(row.errorString)
      ? 'matching'
      : null
  if (!stage) return false

  const errorAt = toEpochMs(row.createdAt)
  const laterEvents = events.filter(event => (
    event.stage === stage && toEpochMs(event.createdAt) >= errorAt
  ))

  return laterEvents.some(event => (
    event.eventType === 'continuation_requested'
    || ['succeeded', 'accepted', 'needs_attention'].includes(String(event.status ?? ''))
  ))
}

export function isSupersededBankingJobFailure(
  job: RunJobSummary,
  stageEvents: RunStageEventSummary[],
): boolean {
  if (job.type !== 'banking.ingest' || job.status !== 'failed') return false
  const updatedAt = toEpochMs(job.updatedAt)
  return stageEvents.some(event => (
    (event.stage === 'banking' || event.stage === 'matching')
    && event.eventType === 'continuation_requested'
    && toEpochMs(event.createdAt) >= updatedAt
  ))
}

export function filterActiveRunErrors<T extends RunErrorSummaryRow>(
  rows: T[],
  stageEvents: RunStageEventSummary[] = [],
): T[] {
  return rows.filter((row) => {
    const recoveredAfterError = (
      isMissingMappingError(row.errorString)
      && rows.some((candidate) => (
        (isRecoverySuccessEvent(candidate) || isRecoveryRequestedEvent(candidate))
        && toEpochMs(candidate.createdAt) >= toEpochMs(row.createdAt)
      ))
    ) || isResolvedByLaterStageEvent(row, stageEvents)

    return !recoveredAfterError && isSeverityError(row.errorCode)
  })
}

export function resolveEffectiveRunStatus(input: {
  baseStatus: unknown
  hasActiveErrors: boolean
  hasNegativeErpResponse: boolean
  hasFailedIo: boolean
  hasInFlightIo: boolean
}): RunStatus {
  if (input.hasActiveErrors || input.hasNegativeErpResponse || input.hasFailedIo) return 'fejl'
  if (input.hasInFlightIo) return 'afventer'
  return (input.baseStatus as RunStatus | null) ?? 'afventer'
}