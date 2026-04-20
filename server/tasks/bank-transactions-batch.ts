import { defineTask } from 'nitropack/runtime'
import crypto from 'node:crypto'
import { logger } from '~/lib/logger'
import { enqueueJob } from '#engine/queue/handlers/enqueueJob'
import { withPgAdvisoryLock } from '~/lib/db/advisoryLock'
import { allowRoleGatedWork } from '../utils/appRole'
import db from '~/lib/db'
import { run } from '~/lib/db/schema/run'
import { sql } from 'drizzle-orm'

export default defineTask({
  meta: {
    name: 'bank-transactions-batch',
    description: 'Enqueue bank ingestion (batch)',
  },
  async run({ payload }) {
    if (!allowRoleGatedWork('scheduler')) return { result: { skipped: true } }

    const log = logger.child({ scope: 'task.bank-transactions-batch' })

    const locked = await withPgAdvisoryLock('task:bank-transactions-batch', async () => {
      log.info('Starter bank-transaktion batch', { scheduledTime: payload?.scheduledTime })

      const bookingDate = payload?.scheduledTime ? new Date(payload.scheduledTime) : new Date()
      const bookingDateIso = bookingDate.toISOString().slice(0, 10)

      const existing = await db
        .select({ id: run.id })
        .from(run)
        .where(sql`${run.bookingDate} = ${bookingDateIso}::date`)
        .limit(1)

      if (existing?.[0]?.id) {
        log.info('Batch skipped (run already exists for bookingDate)', {
          runId: existing[0].id,
          bookingDate: bookingDate.toISOString().slice(0, 10),
          scheduledTime: payload?.scheduledTime,
        })
        return
      }

      const runId = crypto.randomUUID()

      await db.insert(run).values({ id: runId, bookingDate, status: 'afventer' })

      const jobId = await enqueueJob('banking.ingest', {}, { runId })
      log.info('Batch queued', { jobId, runId, scheduledTime: payload?.scheduledTime })
    })

    if (!locked.acquired) {
      log.info('Batch skipped (lock not acquired)', { scheduledTime: payload?.scheduledTime })
      return { result: { skipped: true } }
    }

    return { result: { skipped: false } }
  },
})
