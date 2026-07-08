import env from '~/lib/env/env'
import { logger } from '~/lib/logger'
import { allowRoleGatedWork } from '../../server/utils/appRole'
import { enqueueBankTransactionsBatch, enqueueDbCleanupBatch } from '~/lib/scheduler/batches'

type ScheduleEntry = {
  name: string
  hourUtc: number
  minuteUtc: number
  run: () => Promise<unknown>
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function minuteKey(now: Date): string {
  return now.toISOString().slice(0, 16)
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return fallback
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return n
}

async function runBankTransactionsBatch(scheduledTimeIso: string) {
  const result = await enqueueBankTransactionsBatch({ scheduledTimeIso })
  if (result.skipped) {
    logger.info('scheduler.runtime.bankBatch.skipped', {
      reason: result.reason,
      runId: result.runId,
      bookingDate: result.bookingDate,
      scheduledTimeIso,
    })
    return
  }

  logger.info('scheduler.runtime.bankBatch.queued', {
    runId: result.runId,
    jobId: result.jobId,
    bookingDate: result.bookingDate,
    scheduledTimeIso,
  })
}

async function runDbCleanupBatch() {
  const result = await enqueueDbCleanupBatch()
  if (result.skipped) {
    logger.info('scheduler.runtime.dbCleanup.skipped', { reason: result.reason })
    return
  }

  logger.info('scheduler.runtime.dbCleanup.queued', { jobId: result.jobId })
}

async function main() {
  if (env.APP_ROLE !== 'scheduler' || !allowRoleGatedWork('scheduler')) {
    logger.info('scheduler.runtime.skipped', { appRole: env.APP_ROLE })
    return
  }

  const log = logger.child({ scope: 'scheduler.runtime' })
  let stopped = false
  const pollMs = parsePositiveInt(process.env.SCHEDULER_POLL_MS, 15000)

  const schedule: ScheduleEntry[] = [
    {
      name: 'bank-transactions-batch',
      hourUtc: 3,
      minuteUtc: 0,
      run: async () => {
        await runBankTransactionsBatch(new Date().toISOString())
      },
    },
    {
      name: 'db-cleanup-batch',
      hourUtc: 3,
      minuteUtc: 30,
      run: async () => {
        await runDbCleanupBatch()
      },
    },
  ]

  const alreadyRunInMinute = new Set<string>()

  const stop = () => {
    stopped = true
  }

  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)

  log.info('scheduler.runtime.started', {
    pollMs,
    schedule: schedule.map((s) => ({ name: s.name, hourUtc: s.hourUtc, minuteUtc: s.minuteUtc })),
  })

  while (!stopped) {
    const now = new Date()
    const currentMinuteKey = minuteKey(now)
    const utcHour = now.getUTCHours()
    const utcMinute = now.getUTCMinutes()

    for (const entry of schedule) {
      if (utcHour !== entry.hourUtc || utcMinute !== entry.minuteUtc) continue

      const key = `${entry.name}:${currentMinuteKey}`
      if (alreadyRunInMinute.has(key)) continue

      alreadyRunInMinute.add(key)
      try {
        await entry.run()
        log.info('scheduler.runtime.taskExecuted', { task: entry.name, atUtc: now.toISOString() })
      } catch (err) {
        log.error('scheduler.runtime.taskFailed', { task: entry.name, err, atUtc: now.toISOString() })
      }
    }

    // Retain only the current minute to keep memory bounded.
    for (const key of Array.from(alreadyRunInMinute)) {
      if (!key.endsWith(currentMinuteKey)) alreadyRunInMinute.delete(key)
    }

    await sleep(pollMs)
  }

  log.info('scheduler.runtime.stopped')
}

main().catch((err) => {
  logger.error('scheduler.runtime.crashed', { err })
  process.exitCode = 1
})