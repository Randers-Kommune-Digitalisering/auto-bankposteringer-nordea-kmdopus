import { asc } from 'drizzle-orm'
import { setHeader } from 'h3'
import { ruleTagSelectSchema, ruleTag } from '~/lib/db/schema/ruleTag'
import db from '~/lib/db'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, max-age=60')

  const storage = useStorage('rule-tags')
  const cached = await storage.getItem('list')
  if (cached) {
    return ruleTagSelectSchema.array().parse(cached)
  }

  const rows = await db
    .select({ id: ruleTag.id })
    .from(ruleTag)
    .orderBy(asc(ruleTag.id))

  const parsed = ruleTagSelectSchema.array().parse(rows)
  await storage.setItem('list', parsed, { ttl: 60 })

  return parsed
})