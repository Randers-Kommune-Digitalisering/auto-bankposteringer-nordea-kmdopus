import { defineEventHandler, createError } from 'h3'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { job } from '~/lib/db/schema/job'
import { requireErrorHandlingWriteAccess } from '~~/server/auth/requireAppRoles'

export default defineEventHandler(async (event) => {
  await requireErrorHandlingWriteAccess(event)

  const id = z.string().uuid().parse(event.context.params?.id)
  const retryableTypes = ['banking.ingest', 'banking.accountDiscovery', 'erp.ingestResponses']

  const [updated] = await db
    .update(job)
    .set({
      status: 'pending',
      lockedAt: null,
      lockedBy: null,
      runAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(
      eq(job.id, id),
      eq(job.status, 'failed'),
      inArray(job.type, retryableTypes),
    ))
    .returning({ id: job.id })

  if (!updated?.id) {
    const [existing] = await db.select({ id: job.id }).from(job).where(eq(job.id, id)).limit(1)
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Job blev ikke fundet' })
    throw createError({ statusCode: 409, statusMessage: 'Jobbet er ikke længere fejlet eller understøttes ikke til genkørsel' })
  }

  return { success: true, id: updated.id }
})
