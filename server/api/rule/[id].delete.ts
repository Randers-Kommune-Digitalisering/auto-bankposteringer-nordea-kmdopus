import { createError, defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import { rule } from '~/lib/db/schema/rule'
import { ruleVersion } from '~/lib/db/schema/ruleVersion'
import { requireRoles } from '~~/server/auth/keycloakAuth'

export default defineEventHandler(async (event) => {
  await requireRoles(event, ['write'])
  const id = Number(event.context.params?.id)
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing rule id' })
  }

  await db.delete(ruleVersion).where(eq(ruleVersion.ruleId, id))

  const [deleted] = await db.delete(rule).where(eq(rule.id, id)).returning()
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Rule not found' })
  }

  const storage = useStorage('rules')
  await storage.removeItem('rule-list')

  return { success: true, ruleId: id }
})
