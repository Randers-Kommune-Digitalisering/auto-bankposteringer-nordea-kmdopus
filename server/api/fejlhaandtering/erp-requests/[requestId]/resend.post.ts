import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { outbox } from '~/lib/db/schema/outbox'

export default defineEventHandler(async (event) => {
  const requestId = z.string().min(1).parse(event.context.params?.requestId)

  const existing = await db.query.erpRequest.findFirst({
    where: (fields, { eq }) => eq(fields.id, requestId),
    columns: { id: true, runId: true },
  })

  if (!existing?.id) {
    throw createError({ statusCode: 404, statusMessage: 'ERP request blev ikke fundet' })
  }

  const dedupeKey = `erp.upload:${requestId}`

  const [updated] = await db
    .update(outbox)
    .set({
      status: 'pending',
      lockedAt: null,
      lockedBy: null,
      nextAttemptAt: new Date(),
      payload: { requestId },
    })
    .where(eq(outbox.dedupeKey, dedupeKey))
    .returning({ id: outbox.id })

  if (!updated?.id) {
    await db
      .insert(outbox)
      .values({
        topic: 'erp.uploadRequestPayload',
        runId: existing.runId,
        dedupeKey,
        payload: { requestId },
        status: 'pending',
        nextAttemptAt: new Date(),
      })
      .onConflictDoNothing()
  }

  return { success: true, requestId }
})
