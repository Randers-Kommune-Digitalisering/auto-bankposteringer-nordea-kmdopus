import env from '../../app/lib/env/env'
import { logger } from '../../app/lib/logger'
import { allowRoleGatedWork } from '../../server/utils/appRole'
import { enqueueBankTransactionsBatch, enqueueDbCleanupBatch, enqueueScheduledErpPoll } from '../../app/lib/scheduler/batches'
import { getCopenhagenErpPollSlot } from './erpPollSchedule'

// terminationGracePeriodSeconds needs to be set higher than the pollMs to ensure that the scheduler has time to finish its current work before being terminated by Kubernetes.

type ScheduleEntry = {
  name: string
  timeZone: string
  getSlot: (now: Date) => string | null
  run: (now: Date, slot: string) => Promise<unknown>
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

async function runScheduledErpPoll(slot: string) {
  const result = await enqueueScheduledErpPoll(slot)
  if (result.skipped) {
    logger.info('scheduler.runtime.erpPoll.skipped', { reason: result.reason, slot, jobId: result.jobId })
    return
  }

  logger.info('scheduler.runtime.erpPoll.queued', { jobId: result.jobId, slot })
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
      timeZone: 'UTC',
      getSlot: (now) => now.getUTCHours() === 3 && now.getUTCMinutes() === 0
        ? `${now.toISOString().slice(0, 10)}T03:00:00Z`
        : null,
      run: async (now) => {
        await runBankTransactionsBatch(now.toISOString())
      },
    },
    {
      name: 'db-cleanup-batch',
      timeZone: 'UTC',
      getSlot: (now) => now.getUTCHours() === 3 && now.getUTCMinutes() === 30
        ? `${now.toISOString().slice(0, 10)}T03:30:00Z`
        : null,
      run: async () => {
        await runDbCleanupBatch()
      },
    },
    {
      name: 'erp-response-poll',
      timeZone: 'Europe/Copenhagen',
      getSlot: getCopenhagenErpPollSlot,
      run: async (_now, slot) => {
        await runScheduledErpPoll(slot)
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
    schedule: schedule.map((s) => ({ name: s.name, timeZone: s.timeZone })),
  })

  while (!stopped) {
    const now = new Date()
    const currentMinuteKey = minuteKey(now)
    for (const entry of schedule) {
      const slot = entry.getSlot(now)
      if (!slot) continue

      const key = `${entry.name}:${currentMinuteKey}`
      if (alreadyRunInMinute.has(key)) continue

      alreadyRunInMinute.add(key)
      try {
        await entry.run(now, slot)
        log.info('scheduler.runtime.taskExecuted', { task: entry.name, slot, atUtc: now.toISOString() })
      } catch (err) {
        log.error('scheduler.runtime.taskFailed', { task: entry.name, slot, err, atUtc: now.toISOString() })
      }
    }

    // Retain only the current minute to keep memory bounded.
    for (const key of Array.from(alreadyRunInMinute)) {
      if (!key.endsWith(`:${currentMinuteKey}`)) alreadyRunInMinute.delete(key)
    }

    await sleep(pollMs)
  }

  log.info('scheduler.runtime.stopped')
}

main().catch((err) => {
  logger.error('scheduler.runtime.crashed', { err })
  process.exitCode = 1
})