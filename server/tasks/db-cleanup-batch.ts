import { defineTask } from 'nitropack/runtime'
import { logger } from '~/lib/logger'
import { enqueueJob } from '#engine/queue/handlers/enqueueJob'
import { withPgAdvisoryLock } from '~/lib/db/advisoryLock'
import { allowRoleGatedWork } from '../utils/appRole'

export default defineTask({
  meta: {
    name: 'db-cleanup-batch',
    description: 'Enqueue database cleanup (sensitive/history retention)',
  },
  async run({ payload }) {
    if (!allowRoleGatedWork('scheduler')) return { result: { skipped: true } }

    const log = logger.child({ scope: 'task.db-cleanup-batch' })

    const locked = await withPgAdvisoryLock('task:db-cleanup-batch', async () => {
      log.info('Starter db cleanup batch', { scheduledTime: payload?.scheduledTime })
      const jobId = await enqueueJob('ops.dbCleanup', {}, {})
      log.info('DB cleanup queued', { jobId, scheduledTime: payload?.scheduledTime })
    })

    if (!locked.acquired) {
      log.info('DB cleanup skipped (lock not acquired)', { scheduledTime: payload?.scheduledTime })
      return { result: { skipped: true } }
    }

    return { result: { skipped: false } }
  },
})
