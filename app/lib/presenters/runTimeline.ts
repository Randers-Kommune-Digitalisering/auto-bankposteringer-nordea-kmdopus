import type { RunTimelineResponse, TimelineOutbox, TimelineStageEvent } from '~/types/runTimeline'

export type ErpTimelineDelivery = {
  key: string
  documentId: string | null
  requestIds: string[]
  requestId: string | null
  firstCreatedAt: string | null
  latestCreatedAt: string | null
  rows: TimelineOutbox[]
  events: TimelineStageEvent[]
}

export type TimelineStatusColor = 'success' | 'error' | 'warning' | 'neutral'

export type ErpTimelineState = {
  color: TimelineStatusColor
  label: string
  description: string
}

export function groupErpTimelineDeliveries(
  requests: RunTimelineResponse['erpRequests'],
  outbox: TimelineOutbox[],
  events: TimelineStageEvent[],
): ErpTimelineDelivery[] {
  const requestById = new Map(requests.map(request => [request.requestId, request]))
  const byKey = new Map<string, ErpTimelineDelivery>()
  const keyByRequest = new Map<string, string>()

  function requestKey(requestId: string): string {
    const visited = new Set<string>()
    let currentId = requestId
    while (!visited.has(currentId)) {
      visited.add(currentId)
      const request = requestById.get(currentId)
      if (!request) break
      if (request.documentId) return `document:${request.documentId}`
      if (!request.sourceRequestId) break
      currentId = request.sourceRequestId
    }
    return `request:${currentId}`
  }

  function ensureDelivery(key: string, documentId: string | null = null): ErpTimelineDelivery {
    const existing = byKey.get(key)
    if (existing) {
      if (!existing.documentId && documentId) existing.documentId = documentId
      return existing
    }
    const created: ErpTimelineDelivery = {
      key,
      documentId,
      requestIds: [],
      requestId: null,
      firstCreatedAt: null,
      latestCreatedAt: null,
      rows: [],
      events: [],
    }
    byKey.set(key, created)
    return created
  }

  for (const request of requests) {
    const key = request.documentId ? `document:${request.documentId}` : requestKey(request.requestId)
    ensureDelivery(key, request.documentId).requestIds.push(request.requestId)
    keyByRequest.set(request.requestId, key)
  }

  for (const row of outbox) {
    const key = row.requestId
      ? row.documentId
        ? `document:${row.documentId}`
        : keyByRequest.get(row.requestId) ?? requestKey(row.requestId)
      : 'unknown'
    const target = ensureDelivery(key, row.documentId)
    target.rows.push(row)

    if (row.createdAt && (!target.firstCreatedAt || Date.parse(row.createdAt) < Date.parse(target.firstCreatedAt))) {
      target.firstCreatedAt = row.createdAt
    }
    if (row.createdAt && (!target.latestCreatedAt || Date.parse(row.createdAt) > Date.parse(target.latestCreatedAt))) {
      target.latestCreatedAt = row.createdAt
      if (row.requestId) target.requestId = row.requestId
    }
    if (row.requestId) {
      if (!target.requestIds.includes(row.requestId)) target.requestIds.push(row.requestId)
      keyByRequest.set(row.requestId, key)
    }
  }

  for (const event of events) {
    if (event.stage !== 'erp') continue
    const key = event.requestId ? keyByRequest.get(event.requestId) ?? requestKey(event.requestId) : 'unknown'
    ensureDelivery(key).events.push(event)
  }

  return Array.from(byKey.values()).map((delivery) => {
    delivery.requestIds = [...new Set(delivery.requestIds)]
    delivery.events.sort((a, b) => a.sequence - b.sequence)

    function requestDepth(requestId: string): number {
      let depth = 0
      let currentId = requestId
      const visited = new Set<string>()
      while (!visited.has(currentId)) {
        visited.add(currentId)
        const sourceRequestId = requestById.get(currentId)?.sourceRequestId
        if (!sourceRequestId) break
        currentId = sourceRequestId
        depth += 1
      }
      return depth
    }

    const latestEditedResendSequence = new Map<string, number>()
    for (const event of delivery.events) {
      if (event.eventType === 'edited_resend_created' && event.requestId) {
        latestEditedResendSequence.set(event.requestId, event.sequence)
      }
    }

    const latestOutboxCreatedAt = new Map<string, number>()
    for (const row of delivery.rows) {
      if (!row.requestId) continue
      const createdAt = Date.parse(row.createdAt)
      if (createdAt > (latestOutboxCreatedAt.get(row.requestId) ?? 0)) {
        latestOutboxCreatedAt.set(row.requestId, createdAt)
      }
    }

    delivery.requestId = [...delivery.requestIds].sort((a, b) => (
      requestDepth(a) - requestDepth(b)
      || (latestEditedResendSequence.get(a) ?? 0) - (latestEditedResendSequence.get(b) ?? 0)
      || (latestOutboxCreatedAt.get(a) ?? 0) - (latestOutboxCreatedAt.get(b) ?? 0)
      || a.localeCompare(b)
    )).at(-1) ?? null
    return delivery
  }).sort((a, b) => {
    if (!a.firstCreatedAt && !b.firstCreatedAt) return 0
    if (!a.firstCreatedAt) return 1
    if (!b.firstCreatedAt) return -1
    return Date.parse(a.firstCreatedAt) - Date.parse(b.firstCreatedAt)
  })
}

export function getErpTimelineDeliveryState(delivery: ErpTimelineDelivery): ErpTimelineState {
  const requestEvents = delivery.events.filter(event => delivery.requestId
    ? event.requestId === delivery.requestId
    : !event.requestId)
  const latestEvent = requestEvents.at(-1)
  if (latestEvent?.status) {
    const color: TimelineStatusColor = ['failed', 'rejected'].includes(latestEvent.status)
      ? 'error'
      : ['succeeded', 'accepted'].includes(latestEvent.status)
        ? 'success'
        : ['skipped', 'blocked', 'unknown'].includes(latestEvent.status)
          ? 'neutral'
          : 'warning'
    const label = latestEvent.status === 'accepted'
      ? 'Accepteret'
      : latestEvent.status === 'rejected'
        ? 'Afvist'
        : latestEvent.status === 'sent'
          ? 'Afsendt'
          : latestEvent.status === 'processing'
            ? 'Sender'
            : latestEvent.status === 'skipped'
              ? 'Sprunget over'
              : latestEvent.status === 'blocked'
                ? 'Blokeret'
                : latestEvent.status === 'unknown'
                  ? 'Ukendt'
                  : latestEvent.status === 'needs_attention'
                    ? 'Åbne poster'
                : color === 'success'
                  ? 'OK'
                  : color === 'error'
                    ? 'Fejl'
                    : 'Afventer'
    return { color, label, description: latestEvent.detail ?? label }
  }

  const latestRow = [...delivery.rows].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]
  if (!latestRow) return { color: 'neutral', label: 'Afventer', description: 'Ingen ERP-request endnu' }

  if (latestRow.responseId && latestRow.responseStatusText) {
    const accepted = latestRow.responseStatusText.trim().toUpperCase().startsWith('OK')
    return {
      color: accepted ? 'success' : 'error',
      label: accepted ? 'Accepteret' : 'Afvist',
      description: latestRow.responseStatusText,
    }
  }
  if (latestRow.status === 'failed') {
    return { color: 'error', label: 'Fejl', description: latestRow.lastError ?? 'Afsendelse fejlede' }
  }
  if (latestRow.status === 'sent') {
    return { color: 'warning', label: 'Afsendt', description: 'Afventer ERP-svar' }
  }
  if (latestRow.status === 'processing') {
    return { color: 'warning', label: 'Sender', description: 'ERP-request sendes' }
  }
  return { color: 'warning', label: 'Afventer', description: 'ERP-request afventer afsendelse' }
}

export function getErpTimelineStageState(deliveries: ErpTimelineDelivery[]): ErpTimelineState {
  if (!deliveries.length) {
    return { color: 'neutral', label: 'Afventer', description: 'Ingen ERP-requests endnu' }
  }

  const states = deliveries.map(getErpTimelineDeliveryState)
  const failedCount = states.filter(state => state.color === 'error').length
  const pendingCount = states.filter(state => state.color === 'warning').length
  const acceptedCount = states.filter(state => state.color === 'success').length
  const color: TimelineStatusColor = failedCount > 0 ? 'error' : pendingCount > 0 ? 'warning' : acceptedCount > 0 ? 'success' : 'neutral'
  const label = failedCount > 0 ? 'Fejl' : pendingCount > 0 ? 'Afventer' : acceptedCount > 0 ? 'OK' : 'Afventer'
  const description = `${deliveries.length} bilag${failedCount ? `, ${failedCount} med fejl` : ''}${pendingCount ? `, ${pendingCount} afventer` : ''}`
  return { color, label, description }
}