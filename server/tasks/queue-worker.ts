import { defineTask } from 'nitropack/runtime'
import { runWorker } from '#engine/queue/handlers/worker'
import { logger } from '~/lib/logger'

export default defineTask({
  meta: {
    name: 'queue-worker',
    description: 'Kører worker for jobs + outbox (retry/robusthed)',
  },
  async run({ payload }) {
    const log = logger.child({ scope: 'task.queue-worker' })
    try {
      const result = await runWorker({ maxJobs: 10, maxOutbox: 50 })
      if (result.jobs || result.outbox) {
        log.info('Worker kørte', { ...result, scheduledTime: payload?.scheduledTime })
      }
      return { result }
    } catch (err) {
      log.error('Worker fejlede', { err, scheduledTime: payload?.scheduledTime })
      throw err
    }
  },
})
