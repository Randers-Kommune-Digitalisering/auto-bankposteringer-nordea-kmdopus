import { defineTask } from 'nitropack/runtime'
import { logger } from '~/lib/logger'
import { enqueueJob } from '#engine/queue/handlers/enqueueJob'
import { withPgAdvisoryLock } from '~/lib/db/advisoryLock'
import { allowRoleGatedWork } from '../utils/appRole'

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
      const jobId = await enqueueJob('banking.ingest', {})
      log.info('Batch queued', { jobId, scheduledTime: payload?.scheduledTime })
    })

    if (!locked.acquired) {
      log.info('Batch skipped (lock not acquired)', { scheduledTime: payload?.scheduledTime })
      return { result: { skipped: true } }
    }

    return { result: { skipped: false } }
  },
})
