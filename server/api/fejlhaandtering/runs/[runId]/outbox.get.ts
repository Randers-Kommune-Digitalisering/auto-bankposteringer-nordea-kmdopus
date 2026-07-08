import { defineEventHandler, createError } from 'h3'
import { desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { outbox } from '~/lib/db/schema/outbox'
import { erpResponse } from '~/lib/db/schema/erp'
import { requireErrorHandlingReadAccess } from '~~/server/auth/requireAppRoles'

type OutboxListItem = {
  id: string
  topic: string
  status: string
  attempts: number
  nextAttemptAt: string
  lastError: string | null
  requestId: string | null
  responseId: string | null
  responseStatusText: string | null
  payload: unknown
  createdAt: string
  processedAt: string | null
}

function toIso(value: unknown): string {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

export default defineEventHandler(async (event) => {
  await requireErrorHandlingReadAccess(event)

  const runId = z.string().uuid().parse(event.context.params?.runId)

  const requestIdExpr = sql<string>`${outbox.payload} ->> 'requestId'`

  const rows = await db
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
      payload: outbox.payload,
      createdAt: outbox.createdAt,
      processedAt: outbox.processedAt,
    })
    .from(outbox)
    .leftJoin(erpResponse, eq(erpResponse.requestId, requestIdExpr))
    .where(eq(outbox.runId, runId))
    .orderBy(desc(outbox.createdAt))
    .limit(200)

  if (!Array.isArray(rows)) {
    throw createError({ statusCode: 500, statusMessage: 'Kunne ikke hente outbox' })
  }

  return {
    runId,
    outbox: rows.map<OutboxListItem>((r) => ({
      id: String(r.id),
      topic: String(r.topic),
      status: String(r.status),
      attempts: Number(r.attempts ?? 0),
      nextAttemptAt: toIso(r.nextAttemptAt),
      lastError: r.lastError ? String(r.lastError) : null,
      requestId: r.requestId ? String(r.requestId) : null,
      responseId: r.responseId ? String(r.responseId) : null,
      responseStatusText: r.responseStatusText ? String(r.responseStatusText) : null,
      payload: r.payload,
      createdAt: toIso(r.createdAt),
      processedAt: r.processedAt ? toIso(r.processedAt) : null,
    })),
  }
})
