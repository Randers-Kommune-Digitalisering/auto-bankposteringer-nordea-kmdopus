import crypto from 'node:crypto'
import { sql } from 'drizzle-orm'
import db from '~/lib/db'
import { runTimelineEvent } from '~/lib/db/schema/runTimelineEvent'
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
const knownJobTypes = ['banking.ingest', 'banking.accountDiscovery', 'erp.ingestResponses', 'ops.dbCleanup'] as const
type KnownJobType = (typeof knownJobTypes)[number]

const workerId = `${process.env.WORKER_ID ?? ''}`.trim() || `${process.pid}-${crypto.randomUUID()}`
const LOCK_LEASE_MS = 10 * 60 * 1000
const LOCK_HEARTBEAT_MS = 60 * 1000

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
  await recoverExpiredJobLeases(allowedTypes)
  let processed = 0
  for (let i = 0; i < limit; i += 1) {
    const claimed = await claimJob(allowedTypes)
    if (!claimed) return processed

    const log = logger.child({ scope: 'worker.job', jobId: claimed.id, jobType: claimed.type, runId: claimed.runId ?? undefined })
    const stopHeartbeat = startJobHeartbeat(claimed.id, claimed.lockToken, log)
    try {
      log.info('worker.job.start')
      await handleJob(claimed.type, claimed.payload, { runId: claimed.runId ?? undefined })
      const result = await db.execute(sql`
        update job
        set status = 'succeeded', locked_at = null, locked_by = null, updated_at = now(), last_error = null
        where id = ${claimed.id} and status = 'in_progress' and locked_by = ${claimed.lockToken}
        returning id
      `)
      if (result.rows?.length) log.info('worker.job.succeeded')
      else log.warn('worker.job.leaseLostBeforeCompletion')
      processed += 1
    } catch (err) {
      log.error('worker.job.failed', { err })
      const result = await db.execute(sql`
        update job
        set
          status = case
            when attempts + 1 >= max_attempts then 'failed'::job_status
            else 'pending'::job_status
          end,
          attempts = attempts + 1,
          locked_at = null,
          locked_by = null,
          updated_at = now(),
          last_error = ${String(err instanceof Error ? err.message : err)},
          run_at = case when attempts + 1 >= max_attempts then run_at else now() + interval '5 minutes' end
        where id = ${claimed.id} and status = 'in_progress' and locked_by = ${claimed.lockToken}
        returning id
      `)
      if (!result.rows?.length) log.warn('worker.job.leaseLostBeforeFailureRecorded')
      processed += 1
    } finally {
      stopHeartbeat()
    }
  }
  return processed
}

async function recoverExpiredJobLeases(allowedTypes?: string[]): Promise<void> {
  const allowed = sanitizeAllowedJobTypes(allowedTypes)
  const typeFilter = allowed ? sql.raw(`and type = any(${pgTextArrayLiteral(allowed)})`) : sql.raw('')
  const result = await db.execute(sql`
    update job
    set
      status = case
        when attempts + 1 >= max_attempts then 'failed'::job_status
        else 'pending'::job_status
      end,
      attempts = attempts + 1,
      locked_at = null,
      locked_by = null,
      updated_at = now(),
      last_error = 'Worker lease expired before job completion',
      run_at = case
        when attempts + 1 >= max_attempts then run_at
        else now()
      end
    where status = 'in_progress'
      and (locked_at is null or locked_at < now() - (${LOCK_LEASE_MS} * interval '1 millisecond'))
      ${typeFilter}
    returning id, type, run_id, status, attempts
  `)

  for (const row of result.rows ?? []) {
    logger.warn('worker.job.leaseExpired', {
      jobId: String(row.id),
      jobType: String(row.type),
      runId: row.run_id ? String(row.run_id) : undefined,
      status: row.status,
      attempts: Number(row.attempts),
    })
  }
}

// Claim item from job queue, marking it as in_progress and locking it to this worker.
async function claimJob(allowedTypes?: string[]): Promise<{ id: string; type: string; payload: any; runId: string | null; lockToken: string } | null> {
  const allowed = sanitizeAllowedJobTypes(allowedTypes)
  const typeFilter = allowed ? sql.raw(`and type = any(${pgTextArrayLiteral(allowed)})`) : sql.raw('')
  const lockToken = `${workerId}:${crypto.randomUUID()}`

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
    set status = 'in_progress', locked_at = now(), locked_by = ${lockToken}, updated_at = now()
    from next_job
    where job.id = next_job.id
    returning job.id, job.type, job.payload, job.run_id, job.locked_by
  `)

  const row = (result.rows?.[0] ?? null) as any
  if (!row?.id) return null
  return {
    id: String(row.id),
    type: String(row.type),
    payload: row.payload,
    runId: row.run_id ? String(row.run_id) : null,
    lockToken: String(row.locked_by),
  }
}

// Start processing outbox items
async function processOutbox(limit: number): Promise<number> {
  await recoverExpiredOutboxLeases()
  let processed = 0
  for (let i = 0; i < limit; i += 1) {
    const claimed = await claimOutbox()
    if (!claimed) return processed

    const log = logger.child({ scope: 'worker.outbox', outboxId: claimed.id, topic: claimed.topic })
    const stopHeartbeat = startOutboxHeartbeat(claimed.id, claimed.lockToken, log)
    const requestId = typeof claimed.payload?.requestId === 'string' ? claimed.payload.requestId : null
    if (claimed.runId && claimed.topic.startsWith('erp.')) {
      await db.insert(runTimelineEvent).values({
        runId: claimed.runId,
        stage: 'erp',
        eventType: 'upload_attempt_started',
        status: 'processing',
        detail: 'Automatisk ERP-afsendelsesforsøg startet.',
        requestId,
        outboxId: claimed.id,
        attempt: claimed.attempts + 1,
      }).catch(() => {})
    }

    try {
      log.info('worker.outbox.start')
      const result = await handleOutbox(claimed.topic, claimed.payload)
      const updateResult = await db.execute(sql`
        update outbox
        set status = 'sent', locked_at = null, locked_by = null, processed_at = now(), last_error = null,
            payload = ${JSON.stringify({ ...claimed.payload, result })}::jsonb
        where id = ${claimed.id} and status = 'processing' and locked_by = ${claimed.lockToken}
        returning id
      `)
      if (!updateResult.rows?.length) {
        log.warn('worker.outbox.leaseLostBeforeCompletion')
      } else if (claimed.runId && claimed.topic.startsWith('erp.')) {
        await db.insert(runTimelineEvent).values({
          runId: claimed.runId,
          stage: 'erp',
          eventType: 'upload_succeeded',
          status: 'sent',
          detail: 'ERP-request afsendt; afventer ERP-svar.',
          requestId,
          outboxId: claimed.id,
          attempt: claimed.attempts + 1,
        }).catch(() => {})
      }
      if (updateResult.rows?.length) log.info('worker.outbox.sent')
      processed += 1
    } catch (err) {
      log.error('worker.outbox.failed', { err })
      const updateResult = await db.execute(sql`
        update outbox
        set
          status = 'failed',
          attempts = attempts + 1,
          locked_at = null,
          locked_by = null,
          last_error = ${String(err instanceof Error ? err.message : err)},
          next_attempt_at = now() + interval '5 minutes'
        where id = ${claimed.id} and status = 'processing' and locked_by = ${claimed.lockToken}
        returning id
      `)
      if (!updateResult.rows?.length) {
        log.warn('worker.outbox.leaseLostBeforeFailureRecorded')
      } else if (claimed.runId && claimed.topic.startsWith('erp.')) {
        await db.insert(runTimelineEvent).values({
          runId: claimed.runId,
          stage: 'erp',
          eventType: 'upload_failed',
          status: 'failed',
          detail: 'Automatisk afsendelse til ERP fejlede.',
          requestId,
          outboxId: claimed.id,
          attempt: claimed.attempts + 1,
        }).catch(() => {})
      }
      processed += 1
    } finally {
      stopHeartbeat()
    }
  }
  return processed
}

async function recoverExpiredOutboxLeases(): Promise<void> {
  const result = await db.execute(sql`
    update outbox
    set
      status = 'failed',
      attempts = attempts + 1,
      locked_at = null,
      locked_by = null,
      last_error = 'Worker lease expired before outbox processing completed',
      next_attempt_at = now() + interval '5 minutes'
    where status = 'processing'
      and (locked_at is null or locked_at < now() - (${LOCK_LEASE_MS} * interval '1 millisecond'))
    returning id, topic, run_id, attempts
  `)

  for (const row of result.rows ?? []) {
    logger.warn('worker.outbox.leaseExpired', {
      outboxId: String(row.id),
      topic: String(row.topic),
      runId: row.run_id ? String(row.run_id) : undefined,
      attempts: Number(row.attempts),
    })
  }
}

// Claim item from outbox table, marking it as processing and locking it to this worker.
async function claimOutbox(): Promise<{ id: string; topic: string; payload: any; runId: string | null; attempts: number; lockToken: string } | null> {
  const lockToken = `${workerId}:${crypto.randomUUID()}`
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
    set status = 'processing', locked_at = now(), locked_by = ${lockToken}
    from next_item
    where outbox.id = next_item.id
    returning outbox.id, outbox.topic, outbox.payload, outbox.run_id, outbox.attempts, outbox.locked_by
  `)

  const row = (result.rows?.[0] ?? null) as any
  if (!row?.id) return null
  return {
    id: String(row.id),
    topic: String(row.topic),
    payload: row.payload,
    runId: row.run_id ? String(row.run_id) : null,
    attempts: Number(row.attempts ?? 0),
    lockToken: String(row.locked_by),
  }
}

function startJobHeartbeat(jobId: string, lockToken: string, log: ReturnType<typeof logger.child>): () => void {
  const timer = setInterval(() => {
    void db.execute(sql`
      update job
      set locked_at = now()
      where id = ${jobId} and status = 'in_progress' and locked_by = ${lockToken}
      returning id
    `).then((result) => {
      if (!result.rows?.length) log.warn('worker.job.heartbeatLeaseLost')
    }).catch((err) => {
      log.error('worker.job.heartbeatFailed', { err })
    })
  }, LOCK_HEARTBEAT_MS)
  timer.unref()
  return () => clearInterval(timer)
}

function startOutboxHeartbeat(outboxId: string, lockToken: string, log: ReturnType<typeof logger.child>): () => void {
  const timer = setInterval(() => {
    void db.execute(sql`
      update outbox
      set locked_at = now()
      where id = ${outboxId} and status = 'processing' and locked_by = ${lockToken}
      returning id
    `).then((result) => {
      if (!result.rows?.length) log.warn('worker.outbox.heartbeatLeaseLost')
    }).catch((err) => {
      log.error('worker.outbox.heartbeatFailed', { err })
    })
  }, LOCK_HEARTBEAT_MS)
  timer.unref()
  return () => clearInterval(timer)
}

// 
async function handleJob(type: string, payload: any, context: { runId?: string } = {}): Promise<void> {
  if (type === 'banking.ingest') {
    const { runBankIngestionAndPosting } = await import('../../banking-ingestion/handlers/runBankIngestionAndPosting')
    await runBankIngestionAndPosting({
      runId: context.runId ?? (payload?.runId ? String(payload.runId) : undefined),
      recoveryReason: payload?.recoveryReason,
    })
    return
  }

  if (type === 'banking.accountDiscovery') {
    const discoveryRunId = String(payload?.discoveryRunId ?? '')
    if (!discoveryRunId) {
      throw new Error('banking.accountDiscovery payload mangler discoveryRunId')
    }

    const { runAgreementAccountDiscovery } = await import('../../banking-ingestion/handlers/runAgreementAccountDiscovery')
    await runAgreementAccountDiscovery({ discoveryRunId })
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

    const payloadFilename = typeof payload?.filename === 'string' ? payload.filename.trim() : ''
    if (!payloadFilename) {
      logger.warn('worker.outbox.erpUpload.filenameMissing', { requestId, topic })
    }

    const { uploadErpRequestPayload } = await import('../../erp-integration/infrastructure/erpOutbox')
    return await uploadErpRequestPayload({
      requestId,
      filename: payloadFilename || undefined,
      erpSupplier: payload?.erpSupplier,
    })
  }

  throw new Error(`Ukendt outbox-topic: ${topic}`)
}
