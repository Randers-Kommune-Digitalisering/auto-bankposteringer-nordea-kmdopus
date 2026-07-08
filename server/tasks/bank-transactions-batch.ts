import { defineTask } from 'nitropack/runtime'
import { logger } from '~/lib/logger'
import { allowRoleGatedWork } from '../utils/appRole'
import { enqueueBankTransactionsBatch } from '~/lib/scheduler/batches'

export default defineTask({
  meta: {
    name: 'bank-transactions-batch',
    description: 'Enqueue bank ingestion (batch)',
  },
  async run({ payload }) {
    if (!allowRoleGatedWork('scheduler')) return { result: { skipped: true } }

    const log = logger.child({ scope: 'task.bank-transactions-batch' })
    const scheduledTimeIso =
      typeof payload?.scheduledTime === 'string' ? payload.scheduledTime : new Date().toISOString()

    log.info('Starter bank-transaktion batch', { scheduledTime: scheduledTimeIso })
    const result = await enqueueBankTransactionsBatch({ scheduledTimeIso })

    if (result.skipped) {
      if (result.reason === 'run_exists') {
        log.info('Batch skipped (run already exists for bookingDate)', {
          runId: result.runId,
          bookingDate: result.bookingDate,
          scheduledTime: scheduledTimeIso,
        })
      }
      if (result.reason === 'lock_not_acquired') {
        log.info('Batch skipped (lock not acquired)', { scheduledTime: scheduledTimeIso })
      }
      return { result: { skipped: true } }
    }

    log.info('Batch queued', {
      jobId: result.jobId,
      runId: result.runId,
      bookingDate: result.bookingDate,
      scheduledTime: scheduledTimeIso,
    })

    return { result: { skipped: false } }
  },
})
