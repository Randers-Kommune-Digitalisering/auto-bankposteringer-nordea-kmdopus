import { defineEventHandler, createError } from 'h3'
import { desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { createUtcIsoString } from '~~/utils/function'
import { run } from '~/lib/db/schema/run'
import { job } from '~/lib/db/schema/job'
import { outbox } from '~/lib/db/schema/outbox'
import { erpRequest, erpRequestLine, erpResponse } from '~/lib/db/schema/erp'
import { errorLog } from '~/lib/db/schema/error'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'
import type { RunTimelineResponse } from '~/types/runTimeline'

export default defineEventHandler(async (event) => {
  const runId = z.uuid().parse(event.context.params?.runId)

  const runRow = await db.select().from(run).where(eq(run.id, runId)).limit(1)
  const r = runRow?.[0]
  if (!r) {
    throw createError({ statusCode: 404, statusMessage: 'Run ikke fundet' })
  }

  const [jobRows, outboxRows, requestRows, errorRows, totalTxRows, processingRows] = await Promise.all([
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
          responseId: erpResponse.id,
          responseStatusText: erpResponse.statusText,
          createdAt: outbox.createdAt,
          processedAt: outbox.processedAt,
        })
        .from(outbox)
        .leftJoin(erpResponse, eq(erpResponse.requestId, requestIdExpr))
        .where(eq(outbox.runId, runId))
        .orderBy(desc(outbox.createdAt))
        .limit(500)
    })(),

    // Get ERP requests and their responses for the run, along with line counts
    db
      .select({
        requestId: erpRequest.id,
        responseId: erpResponse.id,
        responseStatusText: erpResponse.statusText,
        lineCount: sql<number>`count(${erpRequestLine.lineNo})`,
      })
      .from(erpRequest)
      .leftJoin(erpResponse, eq(erpResponse.requestId, erpRequest.id))
      .leftJoin(erpRequestLine, eq(erpRequestLine.requestId, erpRequest.id))
      .where(eq(erpRequest.runId, runId))
      .groupBy(erpRequest.id, erpResponse.id, erpResponse.statusText)
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

    // Get total transaction count and processing status counts for the run
    db
      .select({ count: sql<number>`count(*)` })
      .from(transaction)
      .where(eq(transaction.runId, runId))
      .limit(1),

    // Get processing status for transactions in the run, grouped by status
    db
      .select({
        status: transactionProcessing.status,
        count: sql<number>`count(*)`,
      })
      .from(transactionProcessing)
      .innerJoin(transaction, eq(transaction.id, transactionProcessing.transactionId))
      .where(eq(transaction.runId, runId))
      .groupBy(transactionProcessing.status),
  ])

  const totalTransactions = Number(totalTxRows?.[0]?.count ?? 0)

  const byStatus = new Map<string, number>()
  let processedTransactions = 0
  for (const row of processingRows ?? []) {
    const status = String(row.status ?? '')
    const count = Number(row.count ?? 0)
    if (!status) continue
    byStatus.set(status, count)
    processedTransactions += count
  }

  const matching: RunTimelineResponse['matching'] = {
    totalTransactions,
    processedTransactions,
    matched: byStatus.get('bogført') ?? 0,
    exception: byStatus.get('undtaget') ?? 0,
    open: byStatus.get('åben') ?? 0,
  }

  return {
    run: {
      id: String(r.id),
      bookingDate: createUtcIsoString(r.bookingDate),
      status: r.status ? String(r.status) : null,
    },
    jobs: (jobRows ?? []).map<RunTimelineResponse['jobs'][number]>((j) => ({
      id: String(j.id),
      type: String(j.type),
      status: String(j.status),
      runId: j.runId ? String(j.runId) : null,
      attempts: Number(j.attempts ?? 0),
      runAt: createUtcIsoString(j.runAt),
      lastError: j.lastError ? String(j.lastError) : null,
      updatedAt: createUtcIsoString(j.updatedAt),
    })),
    outbox: (outboxRows ?? []).map<RunTimelineResponse['outbox'][number]>((o) => ({
      id: String(o.id),
      topic: String(o.topic),
      status: String(o.status),
      attempts: Number(o.attempts ?? 0),
      nextAttemptAt: o.nextAttemptAt ? createUtcIsoString(o.nextAttemptAt) : null,
      lastError: o.lastError ? String(o.lastError) : null,
      requestId: o.requestId ? String(o.requestId) : null,
      responseId: o.responseId ? String(o.responseId) : null,
      responseStatusText: o.responseStatusText ? String(o.responseStatusText) : null,
      createdAt: createUtcIsoString(o.createdAt),
      processedAt: o.processedAt ? createUtcIsoString(o.processedAt) : null,
    })),
    erpRequests: (requestRows ?? []).map<RunTimelineResponse['erpRequests'][number]>((req) => ({
      requestId: String(req.requestId),
      responseId: req.responseId ? String(req.responseId) : null,
      responseStatusText: req.responseStatusText ? String(req.responseStatusText) : null,
      lineCount: Number(req.lineCount ?? 0),
    })),
    errors: (errorRows ?? []).map<RunTimelineResponse['errors'][number]>((e) => ({
      id: String(e.id),
      source: e.source ? String(e.source) : null,
      errorCode: e.errorCode != null ? Number(e.errorCode) : null,
      errorString: e.errorString ? String(e.errorString) : null,
      createdAt: createUtcIsoString(e.createdAt),
    })),
    matching,
  } satisfies RunTimelineResponse
})
