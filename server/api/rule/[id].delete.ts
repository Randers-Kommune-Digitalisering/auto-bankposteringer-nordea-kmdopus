import { createError, defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import { rule } from '~/lib/db/schema/rule'
import { ruleVersion } from '~/lib/db/schema/ruleVersion'
import { requireWriteAccessWithIdentity } from '~~/server/auth/requireAppRoles'
import { claimRuleForMutationInTransaction } from '~~/server/utils/ruleEditLock'

export default defineEventHandler(async (event) => {
  const user = await requireWriteAccessWithIdentity(event)
  const id = Number(event.context.params?.id)
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing rule id' })
  }

  await db.transaction(async (tx) => {
    await claimRuleForMutationInTransaction(tx, id, user)
    await tx.delete(ruleVersion).where(eq(ruleVersion.ruleId, id))

    const [deleted] = await tx.delete(rule).where(eq(rule.id, id)).returning()
    if (!deleted) throw createError({ statusCode: 404, statusMessage: 'Rule not found' })
  })

  const storage = useStorage('rules')
  await storage.removeItem('rule-list-v2')

  return { success: true, ruleId: id }
})
