import { afterEach, describe, expect, it, vi } from 'vitest'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { eq, sql } from 'drizzle-orm'
import { createApp, createRouter, defineEventHandler, toNodeListener } from 'h3'

describe('bank run requires an active agreement', () => {
  let cleanup: (() => Promise<void>) | undefined

  afterEach(async () => {
    await cleanup?.()
    cleanup = undefined
    vi.unstubAllGlobals()
  })

  it('does not persist manual or scheduled runs when every agreement is inactive', async () => {
    const { default: db } = await import('../../app/lib/db')
    const { bankingAgreement } = await import('../../app/lib/db/schema/bankingAgreement')
    const { job } = await import('../../app/lib/db/schema/job')
    const { run } = await import('../../app/lib/db/schema/run')
    const { enqueueBankTransactionsBatch } = await import('../../app/lib/scheduler/batches')

    const previousAgreementStates = await db
      .select({ provider: bankingAgreement.provider, enabled: bankingAgreement.enabled })
      .from(bankingAgreement)

    const bookingDate = new Date(Date.UTC(2099, 0, 1 + Math.floor(Math.random() * 300)))
    const bookingDateIso = bookingDate.toISOString().slice(0, 10)
    let server: ReturnType<typeof createServer> | undefined

    cleanup = async () => {
      const runs = await db
        .select({ id: run.id })
        .from(run)
        .where(sql`${run.bookingDate} = ${bookingDateIso}::date`)
      for (const existingRun of runs) {
        await db.delete(job).where(eq(job.runId, existingRun.id))
        await db.delete(run).where(eq(run.id, existingRun.id))
      }
      for (const agreement of previousAgreementStates) {
        await db
          .update(bankingAgreement)
          .set({ enabled: agreement.enabled })
          .where(eq(bankingAgreement.provider, agreement.provider))
      }
      if (server?.listening) {
        await new Promise<void>((resolve, reject) => {
          server!.close(error => error ? reject(error) : resolve())
        })
      }
    }

    try {
      await db.update(bankingAgreement).set({ enabled: false })

      const scheduled = await enqueueBankTransactionsBatch({
        scheduledTimeIso: `${bookingDateIso}T12:00:00.000Z`,
      })
      expect(scheduled).toMatchObject({ skipped: true, reason: 'no_active_agreement' })

      vi.stubGlobal('defineEventHandler', defineEventHandler)
      const { default: startRunHandler } = await import('../../server/api/runs/start.post')
      const app = createApp()
      const router = createRouter()
      router.post('/api/runs/start', startRunHandler)
      app.use(router)

      server = createServer(toNodeListener(app))
      server.listen(0, '127.0.0.1')
      await once(server, 'listening')

      const address = server.address()
      if (!address || typeof address === 'string') throw new Error('Test server did not bind a TCP port')

      const response = await fetch(`http://127.0.0.1:${address.port}/api/runs/start`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bookingDate: bookingDateIso }),
      })
      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({
        statusMessage: 'Ingen aktive bankaftaler. Aktivér mindst én bankaftale før du starter en kørsel.',
      })

      const persistedRuns = await db
        .select({ id: run.id })
        .from(run)
        .where(sql`${run.bookingDate} = ${bookingDateIso}::date`)
      expect(persistedRuns).toEqual([])
    } catch (error) {
      const message = String((error as any)?.message ?? error)
      if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
        throw new Error(`Postgres not reachable for integration test. Start it with: docker compose up -d db\n${message}`)
      }
      throw error
    }
  })
})
