import env from '~/lib/env/env'
import { logger } from '~/lib/logger'
import { runWorker } from '#engine/queue/handlers/worker'

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

async function main() {
  if (env.APP_ROLE !== 'worker') {
    logger.info('worker.runtime.skipped', { appRole: env.APP_ROLE })
    return
  }

  const log = logger.child({ scope: 'worker.runtime' })
  let stopped = false

  const profile = `${process.env.WORKER_PROFILE ?? 'all'}`.trim()
  const idleSleepMs = parseNonNegativeInt(process.env.WORKER_IDLE_SLEEP_MS) ?? 1000
  const errorSleepMs = parseNonNegativeInt(process.env.WORKER_ERROR_SLEEP_MS) ?? 5000

  const maxJobsOverride = parsePositiveInt(process.env.WORKER_MAX_JOBS)
  const maxOutboxOverride = parseNonNegativeInt(process.env.WORKER_MAX_OUTBOX)

  const workerOptionsBase =
    profile === 'cpu'
      ? { maxJobs: 25, maxOutbox: 0, processOutbox: false, jobTypes: ['banking.ingest', 'banking.accountDiscovery', 'ops.dbCleanup'] }
      : profile === 'io'
        ? { maxJobs: 10, maxOutbox: 100, processJobs: true, processOutbox: true, jobTypes: ['erp.ingestResponses'] }
        : { maxJobs: 25, maxOutbox: 100, processJobs: true, processOutbox: true }

  const workerOptions = {
    ...workerOptionsBase,
    maxJobs: maxJobsOverride ?? workerOptionsBase.maxJobs,
    maxOutbox: maxOutboxOverride ?? workerOptionsBase.maxOutbox,
  }

  const stop = () => {
    stopped = true
  }

  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)

  log.info('worker.runtime.started', { profile, idleSleepMs, errorSleepMs, workerOptions })

  while (!stopped) {
    try {
      const result = await runWorker(workerOptions)
      const didWork = Boolean(result.jobs || result.outbox)
      if (!didWork) await sleep(idleSleepMs)
    } catch (err) {
      log.error('worker.runtime.iterationFailed', { err })
      await sleep(errorSleepMs)
    }
  }

  log.info('worker.runtime.stopped')
}

main().catch((err) => {
  logger.error('worker.runtime.crashed', { err })
  process.exitCode = 1
})