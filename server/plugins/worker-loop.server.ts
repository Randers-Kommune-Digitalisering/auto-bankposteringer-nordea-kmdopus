import { defineNitroPlugin } from 'nitropack/runtime'
import env from '~/lib/env/env'
import { logger } from '~/lib/logger'
import { runWorker } from '#engine/queue/handlers/worker'

/**
 * Always-on worker loop.
 *
 * Enabled only when `APP_ROLE=worker`. It continuously drains the job/outbox tables.
 *
 * Why this exists:
 * - web pods must be safe to scale (no accidental background work)
 * - scheduler pods should enqueue only
 * - worker pods do the actual processing and can scale independently
 */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function parsePositiveInt(value: unknown): number | undefined {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return undefined
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return n
}

function parseNonNegativeInt(value: unknown): number | undefined {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return undefined
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 0) return undefined
  return n
}

export default defineNitroPlugin((nitroApp) => {
  if (env.APP_ROLE !== 'worker') return

  const log = logger.child({ scope: 'worker.loop' })
  let stopped = false

  const profile = `${process.env.WORKER_PROFILE ?? 'all'}`.trim()

  // Optional env overrides (defaults are stable and documented in ARCHITECTURE.md).

  const idleSleepMs = parseNonNegativeInt(process.env.WORKER_IDLE_SLEEP_MS) ?? 1000
  const errorSleepMs = parseNonNegativeInt(process.env.WORKER_ERROR_SLEEP_MS) ?? 5000

  const maxJobsOverride = parsePositiveInt(process.env.WORKER_MAX_JOBS)
  const maxOutboxOverride = parseNonNegativeInt(process.env.WORKER_MAX_OUTBOX)

  const workerOptionsBase =
    profile === 'cpu'
      ? { maxJobs: 25, maxOutbox: 0, processOutbox: false, jobTypes: ['banking.ingest', 'ops.dbCleanup'] }
      : profile === 'io'
        ? { maxJobs: 10, maxOutbox: 100, processJobs: true, processOutbox: true, jobTypes: ['erp.ingestResponses'] }
        : { maxJobs: 25, maxOutbox: 100, processJobs: true, processOutbox: true }

  const workerOptions = {
    ...workerOptionsBase,
    maxJobs: maxJobsOverride ?? workerOptionsBase.maxJobs,
    maxOutbox: maxOutboxOverride ?? workerOptionsBase.maxOutbox,
  }

  nitroApp.hooks.hook('close', async () => {
    stopped = true
  })

  ;(async () => {
    log.info('Worker loop started', { profile, idleSleepMs, errorSleepMs, workerOptions })

    while (!stopped) {
      try {
        const result = await runWorker(workerOptions)

        const didWork = Boolean(result.jobs || result.outbox)
        if (!didWork) {
          await sleep(idleSleepMs)
        }
      } catch (err) {
        log.error('Worker loop iteration failed', { err })
        await sleep(errorSleepMs)
      }
    }

    log.info('Worker loop stopped')
  })().catch((err) => {
    log.error('Worker loop crashed', { err })
  })
})
