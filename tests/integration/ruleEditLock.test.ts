import { afterEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'

describe('rule edit locks (integration)', () => {
  let cleanup: (() => Promise<void>) | undefined

  afterEach(async () => {
    await cleanup?.()
    cleanup = undefined
  })

  it('rejects another owner and permits renewal, release, and stale-lease reclaim', async () => {
    const { default: db } = await import('../../app/lib/db')
    const { rule } = await import('../../app/lib/db/schema/rule')
    const { RULE_EDIT_LOCK_LEASE_MS } = await import('../../engine/manual-booking/domain/bookingLease')
    const {
      acquireRuleEditLock,
      releaseRuleEditLock,
      verifyRuleEditLockInTransaction,
    } = await import('../../server/utils/ruleEditLock')

    const firstUser = { id: 'https://issuer.example:rule-editor-a', displayName: 'Ada Hansen' }
    const secondUser = { id: 'https://issuer.example:rule-editor-b', displayName: 'Bo Jensen' }
    let ruleId: number | undefined

    try {
      const [createdRule] = await db.insert(rule).values({
        currentVersionId: 1,
        erpSupplier: 'kmd',
        type: 'standard',
        status: 'aktiv',
      }).returning({ id: rule.id })
      ruleId = createdRule!.id
      cleanup = async () => {
        await db.delete(rule).where(eq(rule.id, ruleId!))
      }

      expect((await acquireRuleEditLock(ruleId, firstUser)).acquired).toBe(true)
      expect(await acquireRuleEditLock(ruleId, secondUser)).toEqual({
        acquired: false,
        ownerName: firstUser.displayName,
      })

      await expect(db.transaction(tx => verifyRuleEditLockInTransaction(tx, ruleId!, secondUser)))
        .rejects.toMatchObject({ statusCode: 409 })

      expect((await acquireRuleEditLock(ruleId, firstUser, true)).acquired).toBe(true)
      expect((await releaseRuleEditLock(ruleId, firstUser)).released).toBe(true)
      expect((await acquireRuleEditLock(ruleId, secondUser)).acquired).toBe(true)

      await db.update(rule)
        .set({ lockedAt: new Date(Date.now() - RULE_EDIT_LOCK_LEASE_MS - 1) })
        .where(eq(rule.id, ruleId))
      expect((await acquireRuleEditLock(ruleId, firstUser)).acquired).toBe(true)
    } catch (error) {
      if (ruleId) await db.delete(rule).where(eq(rule.id, ruleId))

      const message = String((error as { message?: unknown })?.message ?? error)
      if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
        throw new Error(`Postgres not reachable for integration test. Start it with: docker compose up -d db\n${message}`)
      }
      throw error
    }
  }, 15_000)
})