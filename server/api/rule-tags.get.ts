import { ruleTagSelectSchema, ruleTag } from '~/lib/db/schema'
import db from '~/lib/db'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, max-age=60')

  const rows = await db.select({ id: ruleTag.id }).from(ruleTag)

  return ruleTagSelectSchema.array().parse(rows)
})