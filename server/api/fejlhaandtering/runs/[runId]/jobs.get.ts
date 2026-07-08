import { defineEventHandler, createError } from 'h3'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { job } from '~/lib/db/schema/job'
import { requireErrorHandlingReadAccess } from '~~/server/auth/requireAppRoles'

type JobListItem = {
  id: string
  type: string
  status: string
  runId: string
  attempts: number
  runAt: string
  lastError: string | null
  updatedAt: string
}

function toIso(value: unknown): string {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

export default defineEventHandler(async (event) => {
  await requireErrorHandlingReadAccess(event)

  const runId = z.string().uuid().parse(event.context.params?.runId)

  const rows = await db
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
    .limit(100)

  if (!Array.isArray(rows)) {
    throw createError({ statusCode: 500, statusMessage: 'Kunne ikke hente jobs' })
  }

  return {
    runId,
    jobs: rows.map<JobListItem>((r) => ({
      id: String(r.id),
      type: String(r.type),
      status: String(r.status),
      runId: String(r.runId),
      attempts: Number(r.attempts ?? 0),
      runAt: toIso(r.runAt),
      lastError: r.lastError ? String(r.lastError) : null,
      updatedAt: toIso(r.updatedAt),
    })),
  }
})
