import { and, eq } from 'drizzle-orm'
import { createError } from 'h3'
import db from '~/lib/db'
import { rule } from '~/lib/db/schema/rule'
import type { LockOwnerIdentity } from '~~/server/auth/requireAppRoles'
import { RULE_EDIT_LOCK_LEASE_MS } from '#engine/manual-booking/domain/bookingLease'

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

type RuleLockRow = {
  id: number
  lockedAt: Date | null
  lockedBy: string | null
  lockedByName: string | null
}

function isLiveLock(row: RuleLockRow, now: Date): boolean {
  return Boolean(row.lockedBy && row.lockedAt && now.getTime() - row.lockedAt.getTime() < RULE_EDIT_LOCK_LEASE_MS)
}

async function selectRuleForUpdate(tx: DbTransaction, ruleId: number): Promise<RuleLockRow> {
  const [row] = await tx
    .select({
      id: rule.id,
      lockedAt: rule.lockedAt,
      lockedBy: rule.lockedBy,
      lockedByName: rule.lockedByName,
    })
    .from(rule)
    .where(eq(rule.id, ruleId))
    .for('update')

  if (!row) throw createError({ statusCode: 404, statusMessage: 'Reglen blev ikke fundet' })
  return row
}

function assertNoOtherOwner(row: RuleLockRow, user: LockOwnerIdentity, now: Date): void {
  if (isLiveLock(row, now) && row.lockedBy !== user.id) {
    throw createError({
      statusCode: 409,
        message: `Reglen redigeres af ${row.lockedByName || 'anden bruger'}`,
    })
  }
}

export async function acquireRuleEditLock(ruleId: number, user: LockOwnerIdentity, renewOnly = false) {
  return db.transaction(async (tx) => {
    const row = await selectRuleForUpdate(tx, ruleId)
    const now = new Date()

    if (isLiveLock(row, now) && row.lockedBy !== user.id) {
      return { acquired: false as const, ownerName: row.lockedByName || 'anden bruger' }
    }

    if (renewOnly && (row.lockedBy !== user.id || !isLiveLock(row, now))) {
      return { acquired: false as const, ownerName: 'anden bruger' }
    }

    await tx.update(rule)
      .set({ lockedAt: now, lockedBy: user.id, lockedByName: user.displayName })
      .where(eq(rule.id, ruleId))

    return {
      acquired: true as const,
      expiresAt: new Date(now.getTime() + RULE_EDIT_LOCK_LEASE_MS).toISOString(),
    }
  })
}

export async function verifyRuleEditLockInTransaction(
  tx: DbTransaction,
  ruleId: number,
  user: LockOwnerIdentity,
): Promise<void> {
  const row = await selectRuleForUpdate(tx, ruleId)
  if (row.lockedBy !== user.id || !isLiveLock(row, new Date())) {
     throw createError({ statusCode: 409, message: 'Regellåsen mangler eller er udløbet. Luk og åbn reglen igen.' })
  }

  await tx.update(rule)
    .set({ lockedAt: new Date(), lockedByName: user.displayName })
    .where(eq(rule.id, ruleId))
}

export async function claimRuleForMutationInTransaction(
  tx: DbTransaction,
  ruleId: number,
  user: LockOwnerIdentity,
): Promise<void> {
  const row = await selectRuleForUpdate(tx, ruleId)
  const now = new Date()
  assertNoOtherOwner(row, user, now)

  await tx.update(rule)
    .set({ lockedAt: now, lockedBy: user.id, lockedByName: user.displayName })
    .where(eq(rule.id, ruleId))
}

export async function releaseRuleEditLock(ruleId: number, user: LockOwnerIdentity) {
  const released = await db.update(rule)
    .set({ lockedAt: null, lockedBy: null, lockedByName: null })
    .where(and(eq(rule.id, ruleId), eq(rule.lockedBy, user.id)))
    .returning({ id: rule.id })

  return { released: released.length > 0 }
}