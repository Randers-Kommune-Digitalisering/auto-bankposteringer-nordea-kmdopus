import { afterEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'

describe('retry runs after account change (integration)', () => {
  let cleanup: (() => Promise<void>) | undefined

  afterEach(async () => {
    await cleanup?.()
    cleanup = undefined
  })

  it('retries a paused run from its saved mapping error after transaction rows are gone', async () => {
    const { default: db } = await import('../../app/lib/db')
    const { errorLog } = await import('../../app/lib/db/schema/error')
    const { job } = await import('../../app/lib/db/schema/job')
    const { run } = await import('../../app/lib/db/schema/run')
    const { retryRunsAfterAccountChange } = await import('../../server/utils/recovery/retryRunsAfterAccountChange')

    let runId: string | undefined
    try {
      const bookingDate = new Date(Date.UTC(2095, 0, 1 + Math.floor(Math.random() * 30000)))
      const [createdRun] = await db
        .insert(run)
        .values({ bookingDate, status: 'afventer' })
        .returning({ id: run.id })
      runId = createdRun!.id

      const iban = `DK${Date.now()}${Math.floor(Math.random() * 1_000_000_000)}`
      await db.insert(errorLog).values({
        runId,
        source: 'application',
        errorCode: 409,
        errorString: `Mangler konterings-mapping (statuskonto) for bankkonto: nordea:${iban}`,
      })

      cleanup = async () => {
        await db.delete(job).where(eq(job.runId, runId!))
        await db.delete(errorLog).where(eq(errorLog.runId, runId!))
        await db.delete(run).where(eq(run.id, runId!))
      }

      const result = await retryRunsAfterAccountChange({
        provider: 'nordea',
        iban,
        reason: 'account-ignored',
      })

      expect(result.candidates).toEqual([runId])
      expect(result.enqueuedRunIds).toEqual([runId])

      const [queuedJob] = await db
        .select({ type: job.type, payload: job.payload, status: job.status })
        .from(job)
        .where(eq(job.runId, runId))

      expect(queuedJob).toMatchObject({
        type: 'banking.ingest',
        status: 'pending',
        payload: { source: 'auto-recovery', recoveryReason: 'account-ignored' },
      })

      const repeated = await retryRunsAfterAccountChange({
        provider: 'nordea',
        iban,
        reason: 'account-ignored',
      })
      expect(repeated.skippedExistingInFlight).toEqual([runId])
      expect(repeated.enqueuedRunIds).toEqual([])

      const activeJobs = await db
        .select({ id: job.id })
        .from(job)
        .where(eq(job.runId, runId))
      expect(activeJobs).toHaveLength(1)

      const recoveryAudit = await db
        .select({ errorString: errorLog.errorString })
        .from(errorLog)
        .where(eq(errorLog.runId, runId))
      expect(recoveryAudit.some(row => row.errorString?.includes('markeret til ignorering'))).toBe(true)
    } catch (error) {
      if (runId && !cleanup) {
        await db.delete(errorLog).where(eq(errorLog.runId, runId))
        await db.delete(run).where(eq(run.id, runId))
      }
      const message = String((error as any)?.message ?? error)
      if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
        throw new Error(`Postgres not reachable for integration test. Start it with: docker compose up -d db\n${message}`)
      }
      throw error
    }
  })
})