import crypto from 'node:crypto'
import { sql } from 'drizzle-orm'
import db from '~/lib/db'
import { logger } from '~/lib/logger'

/**
 * Queue/outbox worker.
 *
 * Key properties:
 * - deterministic behavior based on DB state
 * - safe concurrency via `FOR UPDATE SKIP LOCKED`
 * - sequential processing (one item at a time) with per-iteration limits
 * - optional job type filtering so IO-heavy and CPU-heavy workloads can be isolated
 */

export type WorkerRunOptions = {
  maxJobs?: number
  maxOutbox?: number
  jobTypes?: string[]
  processJobs?: boolean
  processOutbox?: boolean
}

// For validating job types
const knownJobTypes = ['banking.ingest', 'erp.ingestResponses', 'ops.dbCleanup'] as const
type KnownJobType = (typeof knownJobTypes)[number]

const workerId = `${process.env.WORKER_ID ?? ''}`.trim() || `${process.pid}-${crypto.randomUUID()}`

// For validating job types in input against known types, returning undefined if no valid types are found.
function sanitizeAllowedJobTypes(input?: string[]): KnownJobType[] | undefined {
  if (!input?.length) return undefined
  const allowed = input.filter((t): t is KnownJobType => (knownJobTypes as readonly string[]).includes(t))
  return allowed.length ? allowed : undefined
}

// For converting an array of strings to a PostgreSQL text array literal.
function pgTextArrayLiteral(values: string[]): string {
  const items = values.map((v) => `'${v.replaceAll("'", "''")}'`).join(',')
  return `array[${items}]::text[]`
}

// Main function
export async function runWorker(options: WorkerRunOptions = {}): Promise<{ jobs: number; outbox: number }> {
  const maxJobs = options.maxJobs ?? 10
  const maxOutbox = options.maxOutbox ?? 25

  const shouldProcessJobs = options.processJobs ?? true
  const shouldProcessOutbox = options.processOutbox ?? true

  const allowedJobTypes = sanitizeAllowedJobTypes(options.jobTypes)
  const jobTypeFilter = allowedJobTypes ? allowedJobTypes : undefined

  const processedJobs = shouldProcessJobs ? await processJobs(maxJobs, jobTypeFilter) : 0
  const processedOutbox = shouldProcessOutbox ? await processOutbox(maxOutbox) : 0

  return { jobs: processedJobs, outbox: processedOutbox }
}

async function processJobs(limit: number, allowedTypes?: string[]): Promise<number> {
  let processed = 0
  for (let i = 0; i < limit; i += 1) {
    const claimed = await claimJob(allowedTypes)
    if (!claimed) return processed

    const log = logger.child({ scope: 'worker.job', jobId: claimed.id, jobType: claimed.type, runId: claimed.runId ?? undefined })
    try {
      log.info('worker.job.start')
      await handleJob(claimed.type, claimed.payload, { runId: claimed.runId ?? undefined })
      await db.execute(sql`
        update job
        set status = 'succeeded', locked_at = null, locked_by = null, updated_at = now(), last_error = null
        where id = ${claimed.id}
      `)
      log.info('worker.job.succeeded')
      processed += 1
    } catch (err) {
      log.error('worker.job.failed', { err })
      await db.execute(sql`
        update job
        set
          status = case when attempts + 1 >= max_attempts then 'failed' else 'pending' end,
          attempts = attempts + 1,
          locked_at = null,
          locked_by = null,
          updated_at = now(),
          last_error = ${String(err instanceof Error ? err.message : err)},
          run_at = case when attempts + 1 >= max_attempts then run_at else now() + interval '5 minutes' end
        where id = ${claimed.id}
      `)
      processed += 1
    }
  }
  return processed
}

// Claim item from job queue, marking it as in_progress and locking it to this worker.
async function claimJob(allowedTypes?: string[]): Promise<{ id: string; type: string; payload: any; runId: string | null } | null> {
  const allowed = sanitizeAllowedJobTypes(allowedTypes)
  const typeFilter = allowed ? sql.raw(`and type = any(${pgTextArrayLiteral(allowed)})`) : sql.raw('')

  const result = await db.execute(sql`
    with next_job as (
      select id
      from job
      where status = 'pending' and run_at <= now()
      ${typeFilter}
      order by run_at asc
      for update skip locked
      limit 1
    )
    update job
    set status = 'in_progress', locked_at = now(), locked_by = ${workerId}, updated_at = now()
    from next_job
    where job.id = next_job.id
    returning job.id, job.type, job.payload, job.run_id
  `)

  const row = (result.rows?.[0] ?? null) as any
  if (!row?.id) return null
  return { id: String(row.id), type: String(row.type), payload: row.payload, runId: row.run_id ? String(row.run_id) : null }
}

// Start processing outbox items
async function processOutbox(limit: number): Promise<number> {
  let processed = 0
  for (let i = 0; i < limit; i += 1) {
    const claimed = await claimOutbox()
    if (!claimed) return processed

    const log = logger.child({ scope: 'worker.outbox', outboxId: claimed.id, topic: claimed.topic })
    try {
      log.info('worker.outbox.start')
      const result = await handleOutbox(claimed.topic, claimed.payload)
      await db.execute(sql`
        update outbox
        set status = 'sent', locked_at = null, locked_by = null, processed_at = now(), last_error = null,
            payload = ${JSON.stringify({ ...claimed.payload, result })}::jsonb
        where id = ${claimed.id}
      `)
      log.info('worker.outbox.sent')
      processed += 1
    } catch (err) {
      log.error('worker.outbox.failed', { err })
      await db.execute(sql`
        update outbox
        set
          status = 'failed',
          attempts = attempts + 1,
          locked_at = null,
          locked_by = null,
          last_error = ${String(err instanceof Error ? err.message : err)},
          next_attempt_at = now() + interval '5 minutes'
        where id = ${claimed.id}
      `)
      processed += 1
    }
  }
  return processed
}

// Claim item from outbox table, marking it as processing and locking it to this worker.
async function claimOutbox(): Promise<{ id: string; topic: string; payload: any } | null> {
  const result = await db.execute(sql`
    with next_item as (
      select id
      from outbox
      where status in ('pending', 'failed') and next_attempt_at <= now()
      order by next_attempt_at asc
      for update skip locked
      limit 1
    )
    update outbox
    set status = 'processing', locked_at = now(), locked_by = ${workerId}
    from next_item
    where outbox.id = next_item.id
    returning outbox.id, outbox.topic, outbox.payload
  `)

  const row = (result.rows?.[0] ?? null) as any
  if (!row?.id) return null
  return { id: String(row.id), topic: String(row.topic), payload: row.payload }
}

// 
async function handleJob(type: string, payload: any, context: { runId?: string } = {}): Promise<void> {
  if (type === 'banking.ingest') {
    const { runBankIngestionAndPosting } = await import('../../banking-ingestion/handlers/runBankIngestionAndPosting')
    await runBankIngestionAndPosting({ runId: context.runId ?? (payload?.runId ? String(payload.runId) : undefined) })
    return
  }

  if (type === 'erp.ingestResponses') {
    const { ingestErpResponses } = await import('../../erp-integration/handlers/ingestErpResponses')
    await ingestErpResponses({
      limit: payload?.limit,
      deleteAfterPickup: payload?.deleteAfterPickup,
      erpSupplier: payload?.erpSupplier,
    })
    return
  }

  if (type === 'ops.dbCleanup') {
    const { runDbCleanup } = await import('../../ops/handlers/dbCleanup')
    await runDbCleanup()
    return
  }

  throw new Error(`Ukendt job-type: ${type}`)
}

async function handleOutbox(topic: string, payload: any): Promise<any> {
  if (topic === 'erp.uploadRequestPayload' || topic === 'erp.uploadPostingXml') {
    const requestId = payload?.requestId
    if (!requestId || typeof requestId !== 'string') {
      throw new Error('Outbox payload mangler requestId')
    }

    const { uploadErpRequestPayload } = await import('../../erp-integration/infrastructure/erpOutbox')
    return await uploadErpRequestPayload({ requestId, erpSupplier: payload?.erpSupplier })
  }

  throw new Error(`Ukendt outbox-topic: ${topic}`)
}
