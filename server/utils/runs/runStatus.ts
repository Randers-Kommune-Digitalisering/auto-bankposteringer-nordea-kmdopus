import type { RunStatus } from '~/lib/db/schema/enums'

const MISSING_MAPPING_ERROR_PATTERN = /Mangler konterings-mapping \((artskonto|statuskonto)\) for bankkonto:/i
const MAPPING_RECOVERY_SUCCESS_PATTERN = /^Genkørsel efter statuskonto-mapping lykkedes\./i

export type RunErrorSummaryRow = {
  errorCode: unknown
  errorString: unknown
  createdAt: unknown
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

function isMappingRecoverySuccessEvent(row: RunErrorSummaryRow): boolean {
  const code = Number(row.errorCode)
  if (Number.isFinite(code) && code !== 200) return false
  return MAPPING_RECOVERY_SUCCESS_PATTERN.test(String(row.errorString ?? ''))
}

export function filterActiveRunErrors<T extends RunErrorSummaryRow>(rows: T[]): T[] {
  return rows.filter((row) => {
    const recoveredAfterError = isMissingMappingError(row.errorString) && rows.some((candidate) => (
      isMappingRecoverySuccessEvent(candidate) && toEpochMs(candidate.createdAt) >= toEpochMs(row.createdAt)
    ))

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
  if (input.hasInFlightIo) return 'indlæser'
  return (input.baseStatus as RunStatus | null) ?? 'afventer'
}