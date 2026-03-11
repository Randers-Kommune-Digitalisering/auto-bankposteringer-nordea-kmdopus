import crypto from 'node:crypto'
import { defineEventHandler, createError, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { erpRequest, erpRequestLine } from '~/lib/db/schema/erp'
import { outbox } from '~/lib/db/schema/outbox'

export default defineEventHandler(async (event) => {
  const requestId = z.string().min(1).parse(event.context.params?.requestId)

  const bodySchema = z
    .object({ payload: z.string().min(1).optional() })
    .optional()
    .default({})
  const body = bodySchema.parse(await readBody(event).catch(() => ({})))

  const existing = await db.query.erpRequest.findFirst({
    where: (fields, { eq }) => eq(fields.id, requestId),
    columns: { id: true, runId: true, payload: true },
  })

  if (!existing?.id) {
    throw createError({ statusCode: 404, statusMessage: 'ERP request blev ikke fundet' })
  }

  const payload = (body.payload ?? existing.payload ?? '').trim()
  if (!payload) {
    throw createError({ statusCode: 422, statusMessage: 'ERP request payload mangler (kan ikke genfremsende)' })
  }

  const newRequestId = `${requestId}__retry__${crypto.randomUUID()}`
  const newDedupeKey = `erp.upload:${newRequestId}`

  await db.transaction(async (tx) => {
    await tx.insert(erpRequest).values({
      id: newRequestId,
      runId: existing.runId,
      payload,
    })

    const lines = await tx
      .select({
        lineNo: erpRequestLine.lineNo,
        transactionId: erpRequestLine.transactionId,
      })
      .from(erpRequestLine)
      .where(eq(erpRequestLine.requestId, requestId))

    if (lines.length) {
      await tx.insert(erpRequestLine).values(
        lines.map((line) => ({
          requestId: newRequestId,
          lineNo: line.lineNo,
          transactionId: line.transactionId,
        })),
      )
    }

    await tx
      .insert(outbox)
      .values({
        topic: 'erp.uploadRequestPayload',
        runId: existing.runId,
        dedupeKey: newDedupeKey,
        payload: { requestId: newRequestId, sourceRequestId: requestId },
        status: 'pending',
        nextAttemptAt: new Date(),
      })
      .onConflictDoNothing({ target: outbox.dedupeKey })
  })

  return { success: true, requestId: newRequestId, sourceRequestId: requestId }
})
