import { defineEventHandler } from 'h3'
import { desc, eq } from 'drizzle-orm'
import db from '~/lib/db'
import { job } from '~/lib/db/schema/job'
import { outbox } from '~/lib/db/schema/outbox'

type QueueListItem = {
  id: string
  typeOrTopic: string
  status: string
  runId: string | null
  attempts: number
  nextAt: string
  lastError: string | null
}

function toIso(value: unknown): string {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

export default defineEventHandler(async () => {
  const [failedJobs, failedOutbox] = await Promise.all([
    db
      .select({
        id: job.id,
        typeOrTopic: job.type,
        status: job.status,
        runId: job.runId,
        attempts: job.attempts,
        nextAt: job.runAt,
        lastError: job.lastError,
      })
      .from(job)
      .where(eq(job.status, 'failed'))
      .orderBy(desc(job.updatedAt))
      .limit(50),
    db
      .select({
        id: outbox.id,
        typeOrTopic: outbox.topic,
        status: outbox.status,
        runId: outbox.runId,
        attempts: outbox.attempts,
        nextAt: outbox.nextAttemptAt,
        lastError: outbox.lastError,
      })
      .from(outbox)
      .where(eq(outbox.status, 'failed'))
      .orderBy(desc(outbox.createdAt))
      .limit(50),
  ])

  return {
    failedJobs: failedJobs.map<QueueListItem>((row) => ({
      id: String(row.id),
      typeOrTopic: String(row.typeOrTopic),
      status: String(row.status),
      runId: row.runId ? String(row.runId) : null,
      attempts: Number(row.attempts ?? 0),
      nextAt: toIso(row.nextAt),
      lastError: row.lastError ? String(row.lastError) : null,
    })),
    failedOutbox: failedOutbox.map<QueueListItem>((row) => ({
      id: String(row.id),
      typeOrTopic: String(row.typeOrTopic),
      status: String(row.status),
      runId: row.runId ? String(row.runId) : null,
      attempts: Number(row.attempts ?? 0),
      nextAt: toIso(row.nextAt),
      lastError: row.lastError ? String(row.lastError) : null,
    })),
  }
})
