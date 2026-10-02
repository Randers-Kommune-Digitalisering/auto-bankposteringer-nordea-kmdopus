import { afterEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { createApp, createRouter, defineEventHandler, setHeader, toNodeListener } from 'h3'

vi.mock('~~/server/auth/requireAppRoles', () => ({
  requireWriteAccessWithIdentity: vi.fn(async () => ({ id: 'test:rollback', displayName: 'Rollback test' })),
}))

vi.mock('~~/server/utils/ruleEditLock', () => ({
  claimRuleForMutationInTransaction: vi.fn(async () => undefined),
}))

vi.mock('~~/server/utils/accountingDimensions', () => ({
  listAccountingDimensionConstraints: vi.fn(async () => []),
  resolveDimensionValueRows: vi.fn(() => []),
}))

describe('rule rollback cache invalidation (integration)', () => {
  let cleanup: (() => Promise<void>) | undefined
  const storageItems = new Map<string, unknown>()

  afterEach(async () => {
    await cleanup?.()
    cleanup = undefined
    storageItems.clear()
    vi.unstubAllGlobals()
  })

  it('refreshes the cached rule list after rollback', async () => {
    const { default: db } = await import('../../app/lib/db')
    const { rule } = await import('../../app/lib/db/schema/rule')
    const { ruleVersion } = await import('../../app/lib/db/schema/ruleVersion')
    let ruleId: number | undefined

    try {
      vi.stubGlobal('defineEventHandler', defineEventHandler)
      vi.stubGlobal('setHeader', setHeader)
      vi.stubGlobal('useStorage', () => ({
        getItem: async (key: string) => storageItems.get(key),
        setItem: async (key: string, value: unknown) => { storageItems.set(key, value) },
        removeItem: async (key: string) => { storageItems.delete(key) },
      }))

      const [createdRule] = await db.insert(rule).values({
        currentVersionId: 1,
        erpSupplier: 'kmd',
        type: 'standard',
        status: 'aktiv',
      }).returning({ id: rule.id })
      ruleId = createdRule!.id

      cleanup = async () => {
        await db.delete(ruleVersion).where(eq(ruleVersion.ruleId, ruleId!))
        await db.delete(rule).where(eq(rule.id, ruleId!))
        await useStorage('rules').removeItem('rule-list-v2')
      }

      await db.insert(ruleVersion).values({
        ruleId,
        version: 1,
        content: {
          type: 'standard',
          status: 'inaktiv',
          relatedBankAccounts: [],
          ruleTags: [],
          matches: [],
          accounting: { dimensions: [], attachments: [] },
        },
      })

      const { default: rulesHandler } = await import('../../server/api/rules/index.get')
      const { default: rollbackHandler } = await import('../../server/api/rule-versions/[ruleId]/rollback.post')
      const app = createApp()
      const router = createRouter()
      router.get('/api/rules', rulesHandler)
      router.post('/api/rule-versions/:ruleId/rollback', rollbackHandler)
      app.use(router)

      const server = createServer(toNodeListener(app))
      server.listen(0, '127.0.0.1')
      await once(server, 'listening')

      try {
        const address = server.address()
        if (!address || typeof address === 'string') throw new Error('Test server did not bind a TCP port')
        const baseUrl = `http://127.0.0.1:${address.port}`

        const initialResponse = await fetch(`${baseUrl}/api/rules`)
        expect(initialResponse.status).toBe(200)
        const initialRules = await initialResponse.json() as Array<{ id: number; status: string }>
        expect(initialRules.find(row => row.id === ruleId)?.status).toBe('aktiv')

        const rollbackResponse = await fetch(`${baseUrl}/api/rule-versions/${ruleId}/rollback`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ version: 1 }),
        })
        expect(rollbackResponse.status).toBe(200)

        const refreshedResponse = await fetch(`${baseUrl}/api/rules`)
        expect(refreshedResponse.status).toBe(200)
        const refreshedRules = await refreshedResponse.json() as Array<{ id: number; status: string }>
        expect(refreshedRules.find(row => row.id === ruleId)?.status).toBe('inaktiv')
      } finally {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => error ? reject(error) : resolve())
        })
      }
    } catch (error) {
      if (ruleId && !cleanup) {
        await db.delete(ruleVersion).where(eq(ruleVersion.ruleId, ruleId))
        await db.delete(rule).where(eq(rule.id, ruleId))
      }
      const message = String((error as { message?: unknown })?.message ?? error)
      if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
        throw new Error(`Postgres not reachable for integration test. Start it with: docker compose up -d db\n${message}`)
      }
      throw error
    }
  }, 15_000)
})