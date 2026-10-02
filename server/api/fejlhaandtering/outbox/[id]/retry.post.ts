import { defineEventHandler, createError } from 'h3'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { outbox } from '~/lib/db/schema/outbox'
import { requireErrorHandlingWriteAccess } from '~~/server/auth/requireAppRoles'

export default defineEventHandler(async (event) => {
  await requireErrorHandlingWriteAccess(event)

  const id = z.string().uuid().parse(event.context.params?.id)
  const retryableTopics = ['erp.uploadRequestPayload', 'erp.uploadPostingXml']

  const [updated] = await db
    .update(outbox)
    .set({
      status: 'pending',
      lockedAt: null,
      lockedBy: null,
      nextAttemptAt: new Date(),
    })
    .where(and(
      eq(outbox.id, id),
      eq(outbox.status, 'failed'),
      inArray(outbox.topic, retryableTopics),
    ))
    .returning({ id: outbox.id })

  if (!updated?.id) {
    const [existing] = await db.select({ id: outbox.id }).from(outbox).where(eq(outbox.id, id)).limit(1)
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Outbox item blev ikke fundet' })
    throw createError({ statusCode: 409, statusMessage: 'Afleveringen er ikke længere fejlet eller understøttes ikke til genkørsel' })
  }

  return { success: true, id: updated.id }
})
