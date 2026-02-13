import { createError, defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import { rule, ruleVersion } from '~/lib/db/schema/index'

export default defineEventHandler(async (event) => {
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
