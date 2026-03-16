import { defineEventHandler, createError, getQuery } from 'h3'
import { desc, inArray } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { job } from '~/lib/db/schema/job'

type JobListItem = {
  id: string
  runId: string
  type: string
  status: string
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

function parseRunIds(query: Record<string, any>): string[] {
  const raw = query.runIds
  if (Array.isArray(raw)) return raw.flatMap((v) => String(v).split(',').map((s) => s.trim()).filter(Boolean))
  if (typeof raw === 'string') return raw.split(',').map((s) => s.trim()).filter(Boolean)
  return []
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const runIds = parseRunIds(query)
  if (!runIds.length) {
    throw createError({ statusCode: 400, statusMessage: 'Mangler runIds' })
  }

  const parsedRunIds = z.array(z.string().uuid()).parse(runIds)

  const rows = await db
    .select({
      id: job.id,
      runId: job.runId,
      type: job.type,
      status: job.status,
      attempts: job.attempts,
      runAt: job.runAt,
      lastError: job.lastError,
      updatedAt: job.updatedAt,
    })
    .from(job)
    .where(inArray(job.runId, parsedRunIds as any))
    .orderBy(desc(job.updatedAt))
    .limit(500)

  return {
    runIds: parsedRunIds,
    jobs: (rows ?? []).map<JobListItem>((r) => ({
      id: String(r.id),
      runId: String(r.runId),
      type: String(r.type),
      status: String(r.status),
      attempts: Number(r.attempts ?? 0),
      runAt: toIso(r.runAt),
      lastError: r.lastError ? String(r.lastError) : null,
      updatedAt: toIso(r.updatedAt),
    })),
  }
})
