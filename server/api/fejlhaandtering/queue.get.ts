import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { requireErrorHandlingReadAccess } from '~~/server/auth/requireAppRoles'

type QueueWorkItem = {
  kind: 'job' | 'outbox'
  id: string
  typeOrTopic: string
  status: string
  runId: string | null
  requestId: string | null
  attempts: number
  nextAt: string
  updatedAt: string
  lastError: string | null
  canRetry: boolean
}

function safeError(value: unknown): string | null {
  if (!value) return null
  return String(value)
    .replace(/\b\d{6}[- ]?\d{4}\b/g, '[REDACTED]')
    .slice(0, 300)
}

export default defineEventHandler(async (event) => {
  await requireErrorHandlingReadAccess(event)

  const query = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  }).parse(getQuery(event))
  const offset = (query.page - 1) * query.pageSize

  const [itemsResult, countResult] = await Promise.all([
    db.execute(sql`
      select * from (
        select
          'job'::text as kind,
          id::text as id,
          type as type_or_topic,
          status::text as status,
          run_id::text as run_id,
          null::text as request_id,
          attempts,
          run_at as next_at,
          updated_at,
          last_error,
          type in ('banking.ingest', 'banking.accountDiscovery', 'erp.ingestResponses') as can_retry
        from job
        where status = 'failed'
        union all
        select
          'outbox'::text as kind,
          id::text as id,
          topic as type_or_topic,
          status::text as status,
          run_id::text as run_id,
          payload ->> 'requestId' as request_id,
          attempts,
          next_attempt_at as next_at,
          created_at as updated_at,
          last_error,
          topic in ('erp.uploadRequestPayload', 'erp.uploadPostingXml') as can_retry
        from outbox
        where status = 'failed'
      ) as failed_work
      order by updated_at desc, kind asc, id asc
      limit ${query.pageSize} offset ${offset}
    `),
    db.execute(sql`
      select
        (select count(*)::int from job where status = 'failed') as job_count,
        (select count(*)::int from outbox where status = 'failed') as outbox_count
    `),
  ])

  const rows = (itemsResult.rows ?? []) as Array<Record<string, unknown>>
  const count = (countResult.rows?.[0] ?? {}) as Record<string, unknown>
  const total = Number(count.job_count ?? 0) + Number(count.outbox_count ?? 0)
  const items = rows.map<QueueWorkItem>(row => ({
    kind: row.kind === 'outbox' ? 'outbox' : 'job',
    id: String(row.id),
    typeOrTopic: String(row.type_or_topic),
    status: String(row.status),
    runId: row.run_id ? String(row.run_id) : null,
    requestId: row.request_id ? String(row.request_id) : null,
    attempts: Number(row.attempts ?? 0),
    nextAt: row.next_at instanceof Date ? row.next_at.toISOString() : String(row.next_at ?? ''),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at ?? ''),
    lastError: safeError(row.last_error),
    canRetry: row.can_retry === true,
  }))

  return { items, total, page: query.page, pageSize: query.pageSize }
})
