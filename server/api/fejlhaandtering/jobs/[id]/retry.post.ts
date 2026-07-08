import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { job } from '~/lib/db/schema/job'
import { requireErrorHandlingWriteAccess } from '~~/server/auth/requireAppRoles'

export default defineEventHandler(async (event) => {
  await requireErrorHandlingWriteAccess(event)

  const id = z.string().uuid().parse(event.context.params?.id)

  const [updated] = await db
    .update(job)
    .set({
      status: 'pending',
      lockedAt: null,
      lockedBy: null,
      runAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(job.id, id))
    .returning({ id: job.id })

  if (!updated?.id) {
    throw createError({ statusCode: 404, statusMessage: 'Job blev ikke fundet' })
  }

  return { success: true, id: updated.id }
})
