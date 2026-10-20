export type ErpOverviewStatusColor = 'success' | 'error' | 'warning' | 'neutral'

export type ErpRequestAttempt = {
  requestId: string
  sourceRequestId: string | null
  documentId: string | null
  runId: string
  outboxCreatedAt: string | null
  eventCreatedAt: string | null
  eventSequence: number | null
}

export type ErpOverviewStatus = {
  label: string
  color: ErpOverviewStatusColor
  detail: string | null
}

export function isErpRequestAccepted(input: {
  documentStatus: string | null
  responseStatusText: string | null
}): boolean {
  const documentStatus = input.documentStatus?.trim().toLowerCase()
  if (documentStatus) return documentStatus === 'accepted'
  return input.responseStatusText?.trim().toUpperCase().startsWith('OK') ?? false
}

export function selectLatestErpRequestPerDocument<T extends ErpRequestAttempt>(attempts: T[]): T[] {
  const requestById = new Map(attempts.map(attempt => [attempt.requestId, attempt]))
  const latestByDocument = new Map<string, T>()

  function lineageDepth(attempt: ErpRequestAttempt): number {
    let depth = 0
    let sourceRequestId = attempt.sourceRequestId
    const visited = new Set([attempt.requestId])

    while (sourceRequestId && !visited.has(sourceRequestId)) {
      visited.add(sourceRequestId)
      depth += 1
      sourceRequestId = requestById.get(sourceRequestId)?.sourceRequestId ?? null
    }

    return depth
  }

  function compareAttempts(left: T, right: T): number {
    const leftActivity = left.outboxCreatedAt ?? left.eventCreatedAt
    const rightActivity = right.outboxCreatedAt ?? right.eventCreatedAt
    const activityDifference = (leftActivity ? Date.parse(leftActivity) : 0)
      - (rightActivity ? Date.parse(rightActivity) : 0)
    if (activityDifference) return activityDifference

    const depthDifference = lineageDepth(left) - lineageDepth(right)
    if (depthDifference) return depthDifference

    const sequenceDifference = (left.eventSequence ?? 0) - (right.eventSequence ?? 0)
    if (sequenceDifference) return sequenceDifference

    return left.requestId.localeCompare(right.requestId)
  }

  for (const attempt of attempts) {
    const key = attempt.documentId ? `document:${attempt.documentId}` : `request:${attempt.requestId}`
    const current = latestByDocument.get(key)
    if (!current || compareAttempts(attempt, current) > 0) {
      latestByDocument.set(key, attempt)
    }
  }

  return [...latestByDocument.values()].sort((left, right) =>
    left.runId.localeCompare(right.runId)
    || (left.documentId ?? left.requestId).localeCompare(right.documentId ?? right.requestId),
  )
}

export function getErpOverviewStatus(input: {
  responseId: string | null
  responseStatusText: string | null
  outboxStatus: string | null
  outboxLastError: string | null
  eventStatus: string | null
  eventDetail: string | null
}): ErpOverviewStatus {
  const responseStatusText = input.responseStatusText?.trim() || null
  const eventDetail = input.eventDetail?.trim() || null
  const status = input.eventStatus?.trim().toLowerCase() ?? ''

  if (status === 'accepted' || status === 'succeeded') {
    return { label: 'Accepteret', color: 'success', detail: responseStatusText ?? eventDetail }
  }
  if (status === 'rejected') {
    return { label: 'Afvist', color: 'error', detail: responseStatusText ?? eventDetail }
  }
  if (status === 'failed') {
    return { label: 'Afsendelse fejlede', color: 'error', detail: eventDetail ?? input.outboxLastError }
  }
  if (status === 'processing' || status === 'in_progress') {
    return { label: 'Sender', color: 'warning', detail: eventDetail }
  }
  if (status === 'sent') {
    return { label: 'Afsendt – afventer svar', color: 'warning', detail: eventDetail }
  }
  if (status === 'pending' || status === 'blocked') {
    return { label: 'Afventer', color: 'warning', detail: eventDetail }
  }

  if (responseStatusText) {
    const normalized = responseStatusText.toUpperCase()
    if (normalized.startsWith('OK')) {
      return { label: 'Accepteret', color: 'success', detail: responseStatusText }
    }
    if (normalized.startsWith('FEJL')) {
      return { label: 'Afvist', color: 'error', detail: responseStatusText }
    }
    return { label: 'Svar modtaget', color: 'neutral', detail: responseStatusText }
  }
  if (input.responseId) {
    return { label: 'Svar modtaget', color: 'neutral', detail: eventDetail }
  }
  if (input.outboxStatus === 'failed') {
    return {
      label: 'Afsendelse fejlede',
      color: 'error',
      detail: eventDetail ?? input.outboxLastError,
    }
  }
  if (input.outboxStatus === 'sent') {
    return { label: 'Afsendt – afventer svar', color: 'warning', detail: eventDetail }
  }
  if (input.outboxStatus === 'processing') {
    return { label: 'Sender', color: 'warning', detail: eventDetail }
  }
  if (input.outboxStatus === 'pending') {
    return { label: 'Afventer', color: 'warning', detail: eventDetail }
  }

  return { label: 'Ukendt status', color: 'neutral', detail: eventDetail }
}

export function getErpGroupStatus(statuses: ErpOverviewStatus[]): ErpOverviewStatus {
  if (!statuses.length) return { label: 'Ingen ERP-posteringer', color: 'neutral', detail: null }

  const errors = statuses.filter(status => status.color === 'error').length
  const pending = statuses.filter(status => status.color === 'warning').length
  const accepted = statuses.filter(status => status.color === 'success').length

  if (errors) {
    return {
      label: errors === statuses.length ? 'Fejl' : 'Delvist fejlet',
      color: 'error',
      detail: `${errors} med fejl${pending ? `, ${pending} afventer` : ''}${accepted ? `, ${accepted} accepteret` : ''}`,
    }
  }
  if (pending) {
    return {
      label: 'Afventer',
      color: 'warning',
      detail: `${pending} afventer${accepted ? `, ${accepted} accepteret` : ''}`,
    }
  }
  if (accepted === statuses.length) {
    return { label: 'Accepteret', color: 'success', detail: `${accepted} accepteret` }
  }
  return { label: 'Ukendt status', color: 'neutral', detail: null }
}
