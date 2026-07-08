import { defineTask } from 'nitropack/runtime'
import { logger } from '~/lib/logger'
import { allowRoleGatedWork } from '../utils/appRole'
import { enqueueDbCleanupBatch } from '~/lib/scheduler/batches'

export default defineTask({
  meta: {
    name: 'db-cleanup-batch',
    description: 'Enqueue database cleanup (sensitive/history retention)',
  },
  async run({ payload }) {
    if (!allowRoleGatedWork('scheduler')) return { result: { skipped: true } }

    const log = logger.child({ scope: 'task.db-cleanup-batch' })
    const scheduledTimeIso =
      typeof payload?.scheduledTime === 'string' ? payload.scheduledTime : new Date().toISOString()

    log.info('Starter db cleanup batch', { scheduledTime: scheduledTimeIso })
    const result = await enqueueDbCleanupBatch()

    if (result.skipped) {
      log.info('DB cleanup skipped (lock not acquired)', { scheduledTime: scheduledTimeIso })
      return { result: { skipped: true } }
    }

    log.info('DB cleanup queued', { jobId: result.jobId, scheduledTime: scheduledTimeIso })

    return { result: { skipped: false } }
  },
})
