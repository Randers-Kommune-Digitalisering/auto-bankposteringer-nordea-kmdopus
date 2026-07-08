import crypto from 'node:crypto'
import { sql } from 'drizzle-orm'
import db from '~/lib/db'
import { withPgAdvisoryLock } from '~/lib/db/advisoryLock'
import { run } from '~/lib/db/schema/run'
import { enqueueJob } from '#engine/queue/handlers/enqueueJob'

export type SchedulerBatchResult = {
  skipped: boolean
  reason?: 'lock_not_acquired' | 'run_exists'
  runId?: string
  jobId?: string
  bookingDate?: string
}

export async function enqueueBankTransactionsBatch(input?: {
  scheduledTimeIso?: string
}): Promise<SchedulerBatchResult> {
  const scheduledTimeIso = input?.scheduledTimeIso ?? new Date().toISOString()

  const locked = await withPgAdvisoryLock('task:bank-transactions-batch', async () => {
    const bookingDate = new Date(scheduledTimeIso)
    const bookingDateIso = bookingDate.toISOString().slice(0, 10)

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
    await db.insert(run).values({ id: runId, bookingDate, status: 'afventer' })

    const jobId = await enqueueJob('banking.ingest', {}, { runId })
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
