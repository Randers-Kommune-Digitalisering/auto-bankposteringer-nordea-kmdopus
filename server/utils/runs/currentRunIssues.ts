import type { ErrorListItem } from '~/types/runs'
import { filterActiveRunErrors, type RunErrorSummaryRow } from './runStatus'

type RunScopedErrorLog = RunErrorSummaryRow & {
  id: string
  runId: string | null
  source: ErrorListItem['source']
}

type RunScopedJob = {
  id: string
  runId: string | null
  type: string
  status: string
  lastError: string | null
  updatedAt: unknown
}

type RunScopedOutbox = {
  id: string
  runId: string | null
  topic: string
  status: string
  lastError: string | null
  createdAt: unknown
}

export type CurrentErpDocumentRejection = {
  id: string
  runId: string
  documentId: string
  message: string
  createdAt: unknown
}

export type ErpRequestLineageRow = {
  runId: string
  requestId: string
  sourceRequestId: string | null
  documentId: string | null
}

export type ErpDocumentOutcomeRow = {
  runId: string
  requestId: string
  documentId: string
  status: string
  messages: Array<{ type: string; number: string; text: string }>
}

export type ErpRequestResponseStatusRow = {
  runId: string
  requestId: string
  statusText: string | null
}

export type CurrentRunIssue = ErrorListItem

function isoDateTime(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value ?? ''))
  return Number.isNaN(date.getTime()) ? String(value ?? '') : date.toISOString()
}

function normalizeMessage(value: unknown): string {
  return String(value ?? '').trim()
}

function epoch(value: unknown): number {
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(String(value ?? ''))
  return Number.isFinite(timestamp) ? timestamp : 0
}

export function resolveCurrentErpDocumentRejections(input: {
  requests: ErpRequestLineageRow[]
  outbox: Array<{ requestId: string | null; createdAt: unknown; topic: string }>
  outcomes: ErpDocumentOutcomeRow[]
  responseStatuses?: ErpRequestResponseStatusRow[]
}): CurrentErpDocumentRejection[] {
  const requestById = new Map(input.requests.map(request => [request.requestId, request]))
  const latestOutboxAtByRequest = new Map<string, number>()
  for (const row of input.outbox) {
    if (!row.requestId || !row.topic.startsWith('erp.')) continue
    latestOutboxAtByRequest.set(row.requestId, Math.max(
      latestOutboxAtByRequest.get(row.requestId) ?? 0,
      epoch(row.createdAt),
    ))
  }

  const requestsByDocument = new Map<string, ErpRequestLineageRow[]>()
  for (const request of input.requests) {
    if (!request.documentId) continue
    const rows = requestsByDocument.get(request.documentId) ?? []
    rows.push(request)
    requestsByDocument.set(request.documentId, rows)
  }

  const latestRequestByDocument = new Map<string, string>()
  for (const [documentId, requests] of requestsByDocument) {
    const leafRequests = requests.filter(request => !requests.some(candidate => candidate.sourceRequestId === request.requestId))
    const candidates = leafRequests.length ? leafRequests : requests
    const depth = (requestId: string): number => {
      let value = 0
      let currentId = requestId
      const visited = new Set<string>()
      while (!visited.has(currentId)) {
        visited.add(currentId)
        const parent = requestById.get(currentId)?.sourceRequestId
        if (!parent) break
        currentId = parent
        value += 1
      }
      return value
    }

    const latest = [...candidates].sort((left, right) => (
      depth(left.requestId) - depth(right.requestId)
      || (latestOutboxAtByRequest.get(left.requestId) ?? 0) - (latestOutboxAtByRequest.get(right.requestId) ?? 0)
      || left.requestId.localeCompare(right.requestId)
    )).at(-1)
    if (latest) latestRequestByDocument.set(documentId, latest.requestId)
  }

  const rejectionByDocument = new Map<string, CurrentErpDocumentRejection>()
  for (const outcome of input.outcomes) {
    if (outcome.status !== 'rejected' || latestRequestByDocument.get(outcome.documentId) !== outcome.requestId) continue
    const message = outcome.messages.map(item => item.text.trim()).filter(Boolean).join('\n')
      || `ERP afviste bilag ${outcome.documentId}`
    rejectionByDocument.set(outcome.documentId, {
      id: `erp-document:${outcome.documentId}`,
      runId: outcome.runId,
      documentId: outcome.documentId,
      message,
      createdAt: latestOutboxAtByRequest.get(outcome.requestId) || null,
    })
  }

  const statusByRequest = new Map((input.responseStatuses ?? []).map(row => [row.requestId, row]))
  for (const [documentId, requestId] of latestRequestByDocument) {
    if (rejectionByDocument.has(documentId)) continue
    const response = statusByRequest.get(requestId)
    const statusText = normalizeMessage(response?.statusText)
    if (!response || !statusText || statusText.toUpperCase().startsWith('OK')) continue
    rejectionByDocument.set(documentId, {
      id: `erp-document:${documentId}`,
      runId: response.runId,
      documentId,
      message: statusText,
      createdAt: latestOutboxAtByRequest.get(requestId) || null,
    })
  }

  return [...rejectionByDocument.values()]
}

function issueFromErrorLog(row: RunScopedErrorLog): CurrentRunIssue {
  const message = normalizeMessage(row.errorString) || 'Ukendt fejl'
  return {
    id: `error:${row.id}`,
    runId: row.runId,
    source: row.source,
    errorCode: row.errorCode == null ? null : Number(row.errorCode),
    errorString: message,
    createdAt: isoDateTime(row.createdAt),
    message,
  }
}

function issueFromJob(row: RunScopedJob): CurrentRunIssue {
  const message = normalizeMessage(row.lastError) || `Job fejlede: ${row.type}`
  const source = row.type.startsWith('banking.')
    ? 'banking'
    : row.type.startsWith('erp.')
      ? 'erp'
      : 'application'
  return {
    id: `job:${row.id}`,
    runId: row.runId,
    source,
    errorCode: null,
    errorString: message,
    createdAt: isoDateTime(row.updatedAt),
    message,
  }
}

function issueFromOutbox(row: RunScopedOutbox): CurrentRunIssue {
  const message = normalizeMessage(row.lastError) || 'ERP-afsendelse fejlede'
  const source = row.topic.startsWith('erp.')
    ? 'erp'
    : row.topic.startsWith('banking.')
      ? 'banking'
      : 'application'
  return {
    id: `outbox:${row.id}`,
    runId: row.runId,
    source,
    errorCode: source === 'erp' ? 502 : null,
    errorString: message,
    createdAt: isoDateTime(row.createdAt),
    message,
  }
}

export function collectCurrentRunIssues(input: {
  errorLogs: RunScopedErrorLog[]
  jobs: RunScopedJob[]
  outbox: RunScopedOutbox[]
  rejectedErpDocuments?: CurrentErpDocumentRejection[]
}): CurrentRunIssue[] {
  const erpOutboxRunIds = new Set(
    input.outbox
      .filter(row => row.runId && row.topic.startsWith('erp.'))
      .map(row => row.runId as string),
  )
  const errorLogsByRun = new Map<string, RunScopedErrorLog[]>()
  for (const row of input.errorLogs) {
    if (!row.runId) continue
    const rows = errorLogsByRun.get(row.runId) ?? []
    rows.push(row)
    errorLogsByRun.set(row.runId, rows)
  }

  const issues: CurrentRunIssue[] = []
  for (const rows of errorLogsByRun.values()) {
    for (const row of filterActiveRunErrors(rows)) {
      // ERP 502 rows mirror upload failures. The outbox owns their current state.
      if (row.source === 'erp' && Number(row.errorCode) === 502 && row.runId && erpOutboxRunIds.has(row.runId)) {
        continue
      }
      issues.push(issueFromErrorLog(row))
    }
  }

  for (const row of input.jobs) {
    if (row.status === 'failed' && row.runId) issues.push(issueFromJob(row))
  }

  for (const row of input.outbox) {
    if (row.status === 'failed' && row.runId) {
      issues.push(issueFromOutbox(row))
    }
  }

  for (const rejection of input.rejectedErpDocuments ?? []) {
    issues.push({
      id: `erp-document:${rejection.documentId}`,
      runId: rejection.runId,
      source: 'erp',
      errorCode: 422,
      errorString: rejection.message,
      createdAt: isoDateTime(rejection.createdAt),
      message: rejection.message,
    })
  }

  const deduplicated = new Map<string, CurrentRunIssue>()
  for (const issue of issues) {
    if (!deduplicated.has(issue.id)) deduplicated.set(issue.id, issue)
  }
  return [...deduplicated.values()]
}