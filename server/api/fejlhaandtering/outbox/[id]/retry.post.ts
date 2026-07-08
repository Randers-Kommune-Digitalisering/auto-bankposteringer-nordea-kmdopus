import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { outbox } from '~/lib/db/schema/outbox'
import { requireErrorHandlingWriteAccess } from '~~/server/auth/requireAppRoles'

export default defineEventHandler(async (event) => {
  await requireErrorHandlingWriteAccess(event)

  const id = z.string().uuid().parse(event.context.params?.id)

  const [updated] = await db
    .update(outbox)
    .set({
      status: 'pending',
      lockedAt: null,
      lockedBy: null,
      nextAttemptAt: new Date(),
    })
    .where(eq(outbox.id, id))
    .returning({ id: outbox.id })

  if (!updated?.id) {
    throw createError({ statusCode: 404, statusMessage: 'Outbox item blev ikke fundet' })
  }

  return { success: true, id: updated.id }
})
