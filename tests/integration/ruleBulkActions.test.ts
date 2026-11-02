import { afterEach, describe, expect, it, vi } from 'vitest'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { createApp, createRouter, toNodeListener } from 'h3'
import { eq, inArray } from 'drizzle-orm'

vi.mock('~~/server/auth/requireAppRoles', () => ({
  requireWriteAccessWithIdentity: vi.fn(async () => ({
    id: 'test:rule-bulk-actions',
    displayName: 'Rule bulk action test',
  })),
}))

describe('rule bulk actions (integration)', () => {
  let cleanup: (() => Promise<void>) | undefined

  afterEach(async () => {
    await cleanup?.()
    cleanup = undefined
    vi.unstubAllGlobals()
  })

  it('deletes eligible rules and reports locked or transaction-referenced rules', async () => {
    const { default: db } = await import('../../app/lib/db')
    const { rule } = await import('../../app/lib/db/schema/rule')
    const { account } = await import('../../app/lib/db/schema/account')
    const { run } = await import('../../app/lib/db/schema/run')
    const { transaction, transactionProcessing } = await import('../../app/lib/db/schema/transaction')
    const { acquireRuleEditLock } = await import('../../server/utils/ruleEditLock')
    const ruleIds: number[] = []
    let accountId: string | undefined
    let runId: string | undefined
    let transactionId: string | undefined

    cleanup = async () => {
      if (transactionId) {
        await db.delete(transactionProcessing).where(eq(transactionProcessing.transactionId, transactionId))
        await db.delete(transaction).where(eq(transaction.id, transactionId))
      }
      if (runId) await db.delete(run).where(eq(run.id, runId))
      if (accountId) await db.delete(account).where(eq(account.id, accountId))
      if (ruleIds.length) await db.delete(rule).where(inArray(rule.id, ruleIds))
    }

    try {
      for (let index = 0; index < 3; index += 1) {
        const [created] = await db.insert(rule).values({
          currentVersionId: 1,
          erpSupplier: 'kmd',
          type: 'standard',
          status: 'aktiv',
        }).returning({ id: rule.id })
        ruleIds.push(created!.id)
      }

      await acquireRuleEditLock(ruleIds[1]!, {
        id: 'test:another-editor',
        displayName: 'Other editor',
      })

      const uniqueSuffix = crypto.randomUUID()
      accountId = `bulk-test-${uniqueSuffix}`
      const bookingDate = new Date(Date.UTC(2050, 0, 1 + Math.floor(Math.random() * 18_000)))
      await db.insert(account).values({
        id: accountId,
        name: 'Bulk action test',
        provider: 'nordea',
        iban: `TEST${uniqueSuffix.replaceAll('-', '').slice(0, 20)}`,
        currency: 'DKK',
      })
      const [createdRun] = await db.insert(run).values({ bookingDate }).returning({ id: run.id })
      runId = createdRun!.id
      const [createdTransaction] = await db.insert(transaction).values({
        runId,
        accountId,
        amount: '1.00',
        bookingDate,
      }).returning({ id: transaction.id })
      transactionId = createdTransaction!.id
      await db.insert(transactionProcessing).values({
        transactionId,
        ruleApplied: ruleIds[2]!,
      })

      const storageItems = new Set<string>()
      vi.stubGlobal('useStorage', () => ({
        removeItem: async (key: string) => { storageItems.delete(key) },
      }))
      const { default: bulkDeleteHandler } = await import('../../server/api/rules/bulk-delete.post')
      const app = createApp()
      const router = createRouter()
      router.post('/api/rules/bulk-delete', bulkDeleteHandler)
      app.use(router)

      const server = createServer(toNodeListener(app))
      server.listen(0, '127.0.0.1')
      await once(server, 'listening')

      try {
        const address = server.address()
        if (!address || typeof address === 'string') throw new Error('Test server did not bind a TCP port')
        const response = await fetch(`http://127.0.0.1:${address.port}/api/rules/bulk-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ruleIds }),
        })

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
          success: true,
          deletedIds: [ruleIds[0]],
          skipped: [
            { ruleId: ruleIds[1], reason: 'Reglen redigeres af Other editor.' },
            { ruleId: ruleIds[2], reason: 'Reglen er anvendt på transaktioner og kan ikke slettes.' },
          ],
        })

        const remaining = await db.select({ id: rule.id }).from(rule).where(inArray(rule.id, ruleIds))
        expect(remaining.map(row => row.id).sort()).toEqual([ruleIds[1], ruleIds[2]].sort())
      } finally {
        await new Promise<void>((resolve, reject) => {
          server.close(error => error ? reject(error) : resolve())
        })
      }
    } catch (error) {
      const message = String((error as { message?: unknown })?.message ?? error)
      if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
        throw new Error(`Postgres not reachable for integration test. Start it with: docker compose up -d db\n${message}`)
      }
      throw error
    }
  }, 15_000)

  it('exports only the selected rules and rejects a partially missing selection', async () => {
    const { default: db } = await import('../../app/lib/db')
    const { rule } = await import('../../app/lib/db/schema/rule')
    const { getActiveErpSupplier } = await import('../../server/utils/accountingDimensions')
    let ruleId: number | undefined

    cleanup = async () => {
      if (ruleId) await db.delete(rule).where(eq(rule.id, ruleId))
    }

    try {
      const [created] = await db.insert(rule).values({
        currentVersionId: 1,
        erpSupplier: await getActiveErpSupplier(),
        type: 'standard',
        status: 'aktiv',
      }).returning({ id: rule.id })
      ruleId = created!.id

      const { default: exportHandler } = await import('../../server/api/rules/export.get')
      const app = createApp()
      const router = createRouter()
      router.get('/api/rules/export', exportHandler)
      app.use(router)

      const server = createServer(toNodeListener(app))
      server.listen(0, '127.0.0.1')
      await once(server, 'listening')

      try {
        const address = server.address()
        if (!address || typeof address === 'string') throw new Error('Test server did not bind a TCP port')
        const baseUrl = `http://127.0.0.1:${address.port}/api/rules/export?variant=advanced&ids=${ruleId}`
        const response = await fetch(baseUrl)
        expect(response.status).toBe(200)
        const csv = await response.text()
        expect(csv.split('\n')).toHaveLength(2)
        expect(csv.split('\n')[1]).toMatch(/^standard;aktiv;/)
        expect(response.headers.get('content-disposition')).toContain('rules_selected_')

        const partialSelection = await fetch(`${baseUrl},2147483647`)
        expect(partialSelection.status).toBe(409)
      } finally {
        await new Promise<void>((resolve, reject) => {
          server.close(error => error ? reject(error) : resolve())
        })
      }
    } catch (error) {
      const message = String((error as { message?: unknown })?.message ?? error)
      if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
        throw new Error(`Postgres not reachable for integration test. Start it with: docker compose up -d db\n${message}`)
      }
      throw error
    }
  }, 15_000)
})
