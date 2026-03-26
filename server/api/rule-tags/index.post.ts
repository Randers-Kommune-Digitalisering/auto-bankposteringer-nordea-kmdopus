import { createError, defineEventHandler, readBody } from 'h3'
import db from '~/lib/db'
import { ruleTag, ruleTagInsertSchema } from '~/lib/db/schema/ruleTag'
import { requireRoles } from '~~/server/auth/keycloakAuth'

function getPgErrorCode(error: any): string | undefined {
  return error?.code ?? error?.cause?.code ?? error?.cause?.cause?.code
}

export default defineEventHandler(async (event) => {
  await requireRoles(event, ['write'])
  const body = await readBody(event)

  let payload
  try {
    payload = ruleTagInsertSchema.parse(body)
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error?.message ?? 'Ugyldigt input' })
  }

  try {
    const [inserted] = await db
      .insert(ruleTag)
      .values({ id: String(payload.id).trim() })
      .returning({ id: ruleTag.id })

    const storage = useStorage('rule-tags')
    await storage.removeItem('list')

    const ruleStorage = useStorage('rules')
    await ruleStorage.removeItem('rule-list')

    return { success: true, ruleTag: inserted }
  } catch (error: any) {
    if (getPgErrorCode(error) === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Ruletag findes allerede' })
    }

    throw createError({ statusCode: 500, statusMessage: error?.message ?? 'Uventet fejl' })
  }
})
