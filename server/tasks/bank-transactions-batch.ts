import { defineTask } from 'nitropack/runtime'
import { logger } from '~/lib/logger'
import { enqueueJob } from '#engine/queue/application/enqueueJob'
import { runWorker } from '#engine/queue/application/worker'

export default defineTask({
  meta: {
    name: 'bank-transactions-batch',
    description: 'Enqueue bank ingestion og kør worker (batch)',
  },
  async run({ payload }) {
    const log = logger.child({ scope: 'task.bank-transactions-batch' })

    log.info('Starter bank-transaktion batch', { scheduledTime: payload?.scheduledTime })
    const jobId = await enqueueJob('banking.ingest', {})
    const workerResult = await runWorker({ maxJobs: 5, maxOutbox: 25 })

    log.info('Batch queued', { jobId, worker: workerResult, scheduledTime: payload?.scheduledTime })

    return { result: { jobId, worker: workerResult } }
  },
})
