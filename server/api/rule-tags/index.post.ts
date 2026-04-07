import { createError, defineEventHandler, readBody } from 'h3'
import { sql } from 'drizzle-orm'
import db from '~/lib/db'
import { ruleTag, ruleTagInsertSchema } from '~/lib/db/schema/ruleTag'
import { capitalizeFirst } from '~/lib/text/capitalizeFirst'
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
    const normalizedId = capitalizeFirst(String(payload.id))
    if (!normalizedId) {
      throw createError({ statusCode: 400, statusMessage: 'Ruletag-id er påkrævet' })
    }

    // Avoid duplicates that differ only by casing (existing legacy data).
    const existingCaseInsensitive = await db
      .select({ id: ruleTag.id })
      .from(ruleTag)
      .where(sql`lower(${ruleTag.id}) = lower(${normalizedId})`)
      .limit(1)

    if (existingCaseInsensitive.length) {
      throw createError({ statusCode: 409, statusMessage: 'Ruletag findes allerede' })
    }

    const [inserted] = await db
      .insert(ruleTag)
      .values({ id: normalizedId })
      .returning({ id: ruleTag.id })

    const storage = useStorage('rule-tags')
    await storage.removeItem('list')

    const ruleStorage = useStorage('rules')
    await ruleStorage.removeItem('rule-list')

    return { success: true, ruleTag: inserted }
  } catch (error: any) {
    if (error?.statusCode) {
      throw error
    }

    if (getPgErrorCode(error) === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Ruletag findes allerede' })
    }

    throw createError({ statusCode: 500, statusMessage: error?.message ?? 'Uventet fejl' })
  }
})
