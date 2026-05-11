import { eq } from 'drizzle-orm'
import { createError, setHeader } from 'h3'
import db from '~/lib/db'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Manglende ruletag-id' })
  }

  const tag = await db.query.ruleTag.findFirst({
    where: (fields) => eq(fields.id, id)
  })

  if (!tag) {
    throw createError({ statusCode: 404, statusMessage: 'Ruletag ikke fundet' })
  }

  return tag
})
