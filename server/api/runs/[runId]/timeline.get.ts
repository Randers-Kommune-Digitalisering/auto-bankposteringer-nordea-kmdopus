import { defineEventHandler, createError } from 'h3'
import { desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { createUtcDateString, createUtcDateTimeString } from '~~/utils/function'
import { run } from '~/lib/db/schema/run'
import { job } from '~/lib/db/schema/job'
import { outbox } from '~/lib/db/schema/outbox'
import { erpDocument, erpRequest, erpRequestLine, erpResponse } from '~/lib/db/schema/erp'
import { errorLog } from '~/lib/db/schema/error'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'
import { runTimelineEvent } from '~/lib/db/schema/runTimelineEvent'
import type { RunTimelineResponse } from '~/types/runTimeline'
import { requireAnyAppRole } from '~~/server/auth/requireAppRoles'
import { summarizeRunSamleposter } from '~~/server/utils/runs/runSamlepostSummary'

const MISSING_MAPPING_ERROR_PATTERN = /Mangler konterings-mapping \((artskonto|statuskonto)\) for bankkonto:/i
const RECOVERY_SUCCESS_PATTERN = /^Genkørsel efter (statuskonto-mapping|ignorering af bankkonto) lykkedes\./i

function toEpochMs(value: unknown): number {
  const d = value instanceof Date ? value : new Date(String(value ?? ''))
  const ms = d.getTime()
  return Number.isFinite(ms) ? ms : 0
}

function isMissingMappingError(message: unknown): boolean {
  return MISSING_MAPPING_ERROR_PATTERN.test(String(message ?? ''))
}

function isRecoverySuccessEvent(row: { errorCode: unknown; errorString: unknown }): boolean {
  const code = Number(row.errorCode)
  if (Number.isFinite(code) && code !== 200) return false
  return RECOVERY_SUCCESS_PATTERN.test(String(row.errorString ?? ''))
}

export default defineEventHandler(async (event) => {
  await requireAnyAppRole(event, ['admin', 'bookkeeper', 'dev'])
  const runId = z.string().uuid().parse(event.context.params?.runId)

  const runRow = await db.select().from(run).where(eq(run.id, runId)).limit(1)
  const r = runRow?.[0]
  if (!r) {
    throw createError({ statusCode: 404, statusMessage: 'Run ikke fundet' })
  }

  const [jobRows, outboxRows, requestRows, errorRows, eventRows, samlepostRows] = await Promise.all([
    db
      .select({
        id: job.id,
        type: job.type,
        status: job.status,
        runId: job.runId,
        attempts: job.attempts,
        runAt: job.runAt,
        lastError: job.lastError,
        updatedAt: job.updatedAt,
      })
      .from(job)
      .where(eq(job.runId, runId))
      .orderBy(desc(job.updatedAt))
      .limit(200),

    (async () => {
      const requestIdExpr = sql<string>`${outbox.payload} ->> 'requestId'`

      return await
      // Get outbox items related to the run, along with their request and response IDs and response status text
      db
        .select({
          id: outbox.id,
          topic: outbox.topic,
          status: outbox.status,
          attempts: outbox.attempts,
          nextAttemptAt: outbox.nextAttemptAt,
          lastError: outbox.lastError,
          requestId: requestIdExpr,
          documentId: erpRequest.documentId,
          responseId: erpResponse.id,
          responseStatusText: erpResponse.statusText,
          createdAt: outbox.createdAt,
          processedAt: outbox.processedAt,
        })
        .from(outbox)
        .leftJoin(erpRequest, eq(erpRequest.id, requestIdExpr))
        .leftJoin(erpResponse, eq(erpResponse.requestId, requestIdExpr))
        .where(eq(outbox.runId, runId))
        .orderBy(desc(outbox.createdAt))
        .limit(500)
    })(),

    // Get ERP requests and their responses for the run, along with line counts
    db
      .select({
        requestId: erpRequest.id,
        sourceRequestId: erpRequest.sourceRequestId,
        documentId: erpRequest.documentId,
        documentOrigin: erpDocument.origin,
        responseId: erpResponse.id,
        responseStatusText: erpResponse.statusText,
        lineCount: sql<number>`count(${erpRequestLine.lineNo})`,
      })
      .from(erpRequest)
      .leftJoin(erpDocument, eq(erpDocument.id, erpRequest.documentId))
      .leftJoin(erpResponse, eq(erpResponse.requestId, erpRequest.id))
      .leftJoin(erpRequestLine, eq(erpRequestLine.requestId, erpRequest.id))
      .where(eq(erpRequest.runId, runId))
      .groupBy(erpRequest.id, erpDocument.origin, erpResponse.id, erpResponse.statusText)
      .orderBy(desc(erpRequest.id))
      .limit(200),

    // Get error logs for the run
    db
      .select({
        id: errorLog.id,
        source: errorLog.source,
        errorCode: errorLog.errorCode,
        errorString: errorLog.errorString,
        createdAt: errorLog.createdAt,
      })
      .from(errorLog)
      .where(eq(errorLog.runId, runId))
      .orderBy(desc(errorLog.createdAt))
      .limit(200),

    db
      .select({
        id: runTimelineEvent.id,
        sequence: runTimelineEvent.sequence,
        stage: runTimelineEvent.stage,
        eventType: runTimelineEvent.eventType,
        status: runTimelineEvent.status,
        detail: runTimelineEvent.detail,
        requestId: runTimelineEvent.requestId,
        outboxId: runTimelineEvent.outboxId,
        attempt: runTimelineEvent.attempt,
        createdAt: runTimelineEvent.createdAt,
      })
      .from(runTimelineEvent)
      .where(eq(runTimelineEvent.runId, runId))
      .orderBy(desc(runTimelineEvent.createdAt), desc(runTimelineEvent.sequence))
      .limit(500),

    // Load full run membership before deriving samlepost identity and status.
    db
      .select({
        id: transaction.id,
        accountId: transaction.accountId,
        statementId: transaction.statementId,
        entryIndex: transaction.entryIndex,
        bookingDate: transaction.bookingDate,
        creditDebitIndicator: transaction.creditDebitIndicator,
        ntryRef: transaction.ntryRef,
        entryAdditionalInfo: transaction.entryAdditionalInfo,
        ntryAcctSvcrRef: transaction.ntryAcctSvcrRef,
        processingStatus: transactionProcessing.status,
        processingSource: transactionProcessing.source,
      })
      .from(transaction)
      .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
      .where(eq(transaction.runId, runId))
  ])

  const matching = summarizeRunSamleposter((samlepostRows ?? []).map(row => ({
    id: String(row.id),
    accountId: row.accountId ? String(row.accountId) : null,
    statementId: row.statementId ? String(row.statementId) : null,
    entryIndex: row.entryIndex == null ? null : Number(row.entryIndex),
    entryGroupSize: 0,
    bookingDate: row.bookingDate,
    creditDebitIndicator: row.creditDebitIndicator ? String(row.creditDebitIndicator) : null,
    ntryRef: row.ntryRef ? String(row.ntryRef) : null,
    entryAdditionalInfo: row.entryAdditionalInfo ? String(row.entryAdditionalInfo) : null,
    ntryAcctSvcrRef: row.ntryAcctSvcrRef ? String(row.ntryAcctSvcrRef) : null,
    processingStatus: row.processingStatus ? String(row.processingStatus) : null,
    processingSource: row.processingSource ? String(row.processingSource) : null,
  })))

  const filteredErrors = (errorRows ?? []).filter((e) => {
    if (!isMissingMappingError(e.errorString)) return true
    const errorMs = toEpochMs(e.createdAt)
    return !(errorRows ?? []).some((candidate) => (
      isRecoverySuccessEvent(candidate)
      && toEpochMs(candidate.createdAt) >= errorMs
    ))
  })

  return {
    run: {
      id: String(r.id),
      bookingDate: createUtcDateString(r.bookingDate),
      status: r.status ? String(r.status) : null,
    },
    jobs: (jobRows ?? []).map<RunTimelineResponse['jobs'][number]>((j) => ({
      id: String(j.id),
      type: String(j.type),
      status: String(j.status),
      runId: j.runId ? String(j.runId) : null,
      attempts: Number(j.attempts ?? 0),
      runAt: createUtcDateTimeString(j.runAt),
      lastError: j.lastError ? String(j.lastError) : null,
      updatedAt: createUtcDateTimeString(j.updatedAt),
    })),
    outbox: (outboxRows ?? []).map<RunTimelineResponse['outbox'][number]>((o) => ({
      id: String(o.id),
      topic: String(o.topic),
      status: String(o.status),
      attempts: Number(o.attempts ?? 0),
      nextAttemptAt: o.nextAttemptAt ? createUtcDateTimeString(o.nextAttemptAt) : null,
      lastError: o.lastError ? String(o.lastError) : null,
      requestId: o.requestId ? String(o.requestId) : null,
      documentId: o.documentId ? String(o.documentId) : null,
      responseId: o.responseId ? String(o.responseId) : null,
      responseStatusText: o.responseStatusText ? String(o.responseStatusText) : null,
      createdAt: createUtcDateTimeString(o.createdAt),
      processedAt: o.processedAt ? createUtcDateTimeString(o.processedAt) : null,
    })),
    erpRequests: (requestRows ?? []).map<RunTimelineResponse['erpRequests'][number]>((req) => ({
      requestId: String(req.requestId),
      sourceRequestId: req.sourceRequestId ? String(req.sourceRequestId) : null,
      documentId: req.documentId ? String(req.documentId) : null,
      documentOrigin: req.documentOrigin ?? null,
      responseId: req.responseId ? String(req.responseId) : null,
      responseStatusText: req.responseStatusText ? String(req.responseStatusText) : null,
      lineCount: Number(req.lineCount ?? 0),
    })),
    errors: filteredErrors.map<RunTimelineResponse['errors'][number]>((e) => ({
      id: String(e.id),
      source: e.source ? String(e.source) : null,
      errorCode: e.errorCode != null ? Number(e.errorCode) : null,
      errorString: e.errorString ? String(e.errorString) : null,
      createdAt: createUtcDateTimeString(e.createdAt),
    })),
    events: eventRows.map<RunTimelineResponse['events'][number]>(row => ({
      id: String(row.id),
      sequence: Number(row.sequence),
      stage: row.stage as RunTimelineResponse['events'][number]['stage'],
      eventType: String(row.eventType),
      status: row.status ? String(row.status) : null,
      detail: row.detail ? String(row.detail) : null,
      requestId: row.requestId ? String(row.requestId) : null,
      outboxId: row.outboxId ? String(row.outboxId) : null,
      attempt: row.attempt == null ? null : Number(row.attempt),
      createdAt: createUtcDateTimeString(row.createdAt),
    })).reverse(),
    matching,
  } satisfies RunTimelineResponse
})
