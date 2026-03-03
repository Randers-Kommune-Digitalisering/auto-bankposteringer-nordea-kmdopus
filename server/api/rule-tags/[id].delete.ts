import { eq } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import db from '~/lib/db'
import { ruleTag } from '~/lib/db/schema/ruleTag'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Manglende ruletag-id' })
  }

  const [deleted] = await db.delete(ruleTag).where(eq(ruleTag.id, id)).returning({ id: ruleTag.id })
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Ruletag ikke fundet' })
  }

  const storage = useStorage('rule-tags')
  await storage.removeItem('list')

  const ruleStorage = useStorage('rules')
  await ruleStorage.removeItem('rule-list')

  return { success: true }
})
