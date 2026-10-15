import { afterEach, describe, expect, it, vi } from 'vitest'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { createApp, createRouter, toNodeListener } from 'h3'
import { eq, inArray } from 'drizzle-orm'

vi.mock('~~/server/auth/requireAppRoles', () => ({
  requireWriteAccessWithIdentity: vi.fn(async () => ({
    id: 'test:rule-delete-user',
    displayName: 'Rule delete test',
  })),
}))

describe('rule delete API (integration)', () => {
  let cleanup: (() => Promise<void>) | undefined

  afterEach(async () => {
    await cleanup?.()
    cleanup = undefined
    vi.unstubAllGlobals()
  })

  it('deletes an unlocked rule and rejects a rule with another user’s live lease', async () => {
    const { default: db } = await import('../../app/lib/db')
    const { rule } = await import('../../app/lib/db/schema/rule')
    const { acquireRuleEditLock } = await import('../../server/utils/ruleEditLock')
    const ruleIds: number[] = []

    cleanup = async () => {
      if (ruleIds.length) {
        await db.delete(rule).where(inArray(rule.id, ruleIds))
      }
    }

    try {
      const [unlockedRule] = await db.insert(rule).values({
        currentVersionId: 1,
        erpSupplier: 'kmd',
        type: 'standard',
        status: 'aktiv',
      }).returning({ id: rule.id })
      ruleIds.push(unlockedRule!.id)

      const [lockedRule] = await db.insert(rule).values({
        currentVersionId: 1,
        erpSupplier: 'kmd',
        type: 'standard',
        status: 'aktiv',
      }).returning({ id: rule.id })
      ruleIds.push(lockedRule!.id)

      await acquireRuleEditLock(lockedRule!.id, {
        id: 'test:other-rule-editor',
        displayName: 'Other editor',
      })

      vi.stubGlobal('useStorage', () => ({ removeItem: async () => undefined }))
      const { default: deleteHandler } = await import('../../server/api/rule/[id].delete')
      const app = createApp()
      const router = createRouter()
      router.delete('/api/rule/:id', deleteHandler)
      app.use(router)

      const server = createServer(toNodeListener(app))
      server.listen(0, '127.0.0.1')
      await once(server, 'listening')

      try {
        const address = server.address()
        if (!address || typeof address === 'string') throw new Error('Test server did not bind a TCP port')
        const baseUrl = `http://127.0.0.1:${address.port}`

        const deleteResponse = await fetch(`${baseUrl}/api/rule/${unlockedRule!.id}`, { method: 'DELETE' })
        expect(deleteResponse.status).toBe(200)
        expect(await deleteResponse.json()).toEqual({ success: true, ruleId: unlockedRule!.id })

        const [deletedRule] = await db.select({ id: rule.id }).from(rule).where(eq(rule.id, unlockedRule!.id)).limit(1)
        expect(deletedRule).toBeUndefined()

        const conflictResponse = await fetch(`${baseUrl}/api/rule/${lockedRule!.id}`, { method: 'DELETE' })
        expect(conflictResponse.status).toBe(409)

        const [preservedRule] = await db.select({ id: rule.id }).from(rule).where(eq(rule.id, lockedRule!.id)).limit(1)
        expect(preservedRule).toEqual({ id: lockedRule!.id })
      } finally {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => error ? reject(error) : resolve())
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