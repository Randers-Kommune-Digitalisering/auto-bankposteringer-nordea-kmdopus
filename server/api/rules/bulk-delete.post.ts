import { createError, defineEventHandler, readBody } from 'h3'
import { inArray } from 'drizzle-orm'
import { z } from 'zod/v4'
import db from '~/lib/db'
import { rule } from '~/lib/db/schema/rule'
import { ruleVersion } from '~/lib/db/schema/ruleVersion'
import { transactionProcessing } from '~/lib/db/schema/transaction'
import { requireWriteAccessWithIdentity } from '~~/server/auth/requireAppRoles'
import { tryClaimRuleForMutationInTransaction } from '~~/server/utils/ruleEditLock'

const requestSchema = z.object({
  ruleIds: z.array(z.number().int().positive()).min(1).max(100).superRefine((ids, ctx) => {
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', message: 'Regel-id’er må ikke gentages' })
    }
  }),
})

export default defineEventHandler(async (event) => {
  const user = await requireWriteAccessWithIdentity(event)
  const parsed = requestSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Ugyldig anmodning' })
  }

  const requestedIds = parsed.data.ruleIds
  const result = await db.transaction(async (tx) => {
    const skippedReasons = new Map<number, string>()
    const claimedIds: number[] = []

    for (const id of [...requestedIds].sort((a, b) => a - b)) {
      const claim = await tryClaimRuleForMutationInTransaction(tx, id, user)
      if (claim.status === 'missing') {
        skippedReasons.set(id, 'Reglen findes ikke længere.')
      } else if (claim.status === 'locked') {
        skippedReasons.set(id, `Reglen redigeres af ${claim.ownerName}.`)
      } else {
        claimedIds.push(id)
      }
    }

    const referencedIds = new Set<number>()
    if (claimedIds.length) {
      const references = await tx
        .select({ ruleId: transactionProcessing.ruleApplied })
        .from(transactionProcessing)
        .where(inArray(transactionProcessing.ruleApplied, claimedIds))

      for (const reference of references) {
        if (reference.ruleId !== null) referencedIds.add(reference.ruleId)
      }
    }

    const blockedByHistory = claimedIds.filter(id => referencedIds.has(id))
    for (const id of blockedByHistory) {
      skippedReasons.set(id, 'Reglen er anvendt på transaktioner og kan ikke slettes.')
    }

    if (blockedByHistory.length) {
      await tx.update(rule)
        .set({ lockedAt: null, lockedBy: null, lockedByName: null })
        .where(inArray(rule.id, blockedByHistory))
    }

    const deletableIds = claimedIds.filter(id => !referencedIds.has(id))
    let deletedIds: number[] = []
    if (deletableIds.length) {
      await tx.delete(ruleVersion).where(inArray(ruleVersion.ruleId, deletableIds))
      const deleted = await tx.delete(rule)
        .where(inArray(rule.id, deletableIds))
        .returning({ id: rule.id })
      deletedIds = deleted.map(row => row.id)
    }

    return {
      deletedIds,
      skipped: requestedIds
        .filter(id => skippedReasons.has(id))
        .map(ruleId => ({ ruleId, reason: skippedReasons.get(ruleId)! })),
    }
  })

  if (result.deletedIds.length) {
    const storage = useStorage('rules')
    await storage.removeItem('rule-list-v2')
  }

  return { success: true, ...result }
})
