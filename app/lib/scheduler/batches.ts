import crypto from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import db from '~/lib/db'
import { withPgAdvisoryLock } from '~/lib/db/advisoryLock'
import { run } from '~/lib/db/schema/run'
import { job } from '~/lib/db/schema/job'
import { bankingAgreement } from '~/lib/db/schema/bankingAgreement'
import { enqueueJob } from '#engine/queue/handlers/enqueueJob'

export type SchedulerBatchResult = {
  skipped: boolean
  reason?: 'lock_not_acquired' | 'run_exists' | 'no_active_agreement'
  runId?: string
  jobId?: string
  bookingDate?: string
}

export async function enqueueBankTransactionsBatch(input?: {
  scheduledTimeIso?: string
}): Promise<SchedulerBatchResult> {
  const scheduledTimeIso = input?.scheduledTimeIso ?? new Date().toISOString()
  const bookingDate = new Date(scheduledTimeIso)
  const bookingDateIso = bookingDate.toISOString().slice(0, 10)

  const locked = await withPgAdvisoryLock(`run:start:${bookingDateIso}`, async () => {
    const existing = await db
      .select({ id: run.id })
      .from(run)
      .where(sql`${run.bookingDate} = ${bookingDateIso}::date`)
      .limit(1)

    if (existing?.[0]?.id) {
      return {
        skipped: true,
        reason: 'run_exists' as const,
        runId: existing[0].id,
        bookingDate: bookingDateIso,
      }
    }

    const runId = crypto.randomUUID()
    const jobId = crypto.randomUUID()
    const enqueueResult = await db.transaction(async (trx) => {
      const enabledAgreements = await trx
        .select({ provider: bankingAgreement.provider })
        .from(bankingAgreement)
        .where(eq(bankingAgreement.enabled, true))
        .limit(1)
        .for('share')

      if (!enabledAgreements.length) {
        return { skipped: true as const, reason: 'no_active_agreement' as const }
      }

      await trx.insert(run).values({ id: runId, bookingDate, status: 'afventer' })
      await trx.insert(job).values({
        id: jobId,
        type: 'banking.ingest',
        status: 'pending',
        runId,
        payload: {},
      })

      return { skipped: false as const }
    })
    if (enqueueResult.skipped) return enqueueResult

    return {
      skipped: false,
      runId,
      jobId,
      bookingDate: bookingDateIso,
    }
  })

  if (!locked.acquired) {
    return { skipped: true, reason: 'lock_not_acquired' }
  }

  return locked.result
}

export async function enqueueDbCleanupBatch(): Promise<SchedulerBatchResult> {
  const locked = await withPgAdvisoryLock('task:db-cleanup-batch', async () => {
    const jobId = await enqueueJob('ops.dbCleanup', {}, {})
    return {
      skipped: false,
      jobId,
    }
  })

  if (!locked.acquired) {
    return { skipped: true, reason: 'lock_not_acquired' }
  }

  return locked.result
}

export type ScheduledErpPollResult = {
  skipped: boolean
  reason?: 'lock_not_acquired' | 'slot_already_enqueued'
  jobId?: string
}

export async function enqueueScheduledErpPoll(slot: string): Promise<ScheduledErpPollResult> {
  const locked = await withPgAdvisoryLock('task:erp-response-poll', async () => {
    const existing = await db
      .select({ id: job.id })
      .from(job)
      .where(sql`${job.type} = 'erp.ingestResponses' and ${job.payload}->>'scheduledSlot' = ${slot}`)
      .limit(1)

    if (existing[0]?.id) {
      return { skipped: true, reason: 'slot_already_enqueued' as const, jobId: String(existing[0].id) }
    }

    const jobId = await enqueueJob('erp.ingestResponses', {
      scheduledSlot: slot,
      scheduledBy: 'scheduler',
    })
    return { skipped: false, jobId }
  })

  if (!locked.acquired) return { skipped: true, reason: 'lock_not_acquired' }
  return locked.result
}
