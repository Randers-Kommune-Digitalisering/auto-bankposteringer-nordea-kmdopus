import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import db from '~/lib/db'
import { ruleTag } from '~/lib/db/schema/ruleTag'
import { ruleRuleTag } from '~/lib/db/schema/rule'
import { requireRoles } from '~~/server/auth/keycloakAuth'

function getPgErrorCode(error: any): string | undefined {
  return error?.code ?? error?.cause?.code ?? error?.cause?.cause?.code
}

const renameSchema = z.object({
  id: z.string().min(1, 'Ruletag-id er påkrævet')
})

export default defineEventHandler(async (event) => {
  await requireRoles(event, ['write'])
  const oldId = event.context.params?.id
  if (!oldId) {
    throw createError({ statusCode: 400, statusMessage: 'Manglende ruletag-id' })
  }

  const body = await readBody(event)

  let payload
  try {
    payload = renameSchema.parse(body)
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error?.message ?? 'Ugyldigt input' })
  }

  const newId = payload.id.trim()
  if (!newId) {
    throw createError({ statusCode: 400, statusMessage: 'Ruletag-id er påkrævet' })
  }

  if (newId === oldId) {
    return { success: true, ruleTag: { id: newId } }
  }

  try {
    const result = await db.transaction(async (tx) => {
      const existingOld = await tx.query.ruleTag.findFirst({
        where: (fields) => eq(fields.id, oldId)
      })
      if (!existingOld) {
        throw createError({ statusCode: 404, statusMessage: 'Ruletag ikke fundet' })
      }

      const existingNew = await tx.query.ruleTag.findFirst({
        where: (fields) => eq(fields.id, newId)
      })

      if (!existingNew) {
        await tx.insert(ruleTag).values({ id: newId })
      }

      const affectedRuleIds = await tx
        .select({ ruleId: ruleRuleTag.ruleId })
        .from(ruleRuleTag)
        .where(eq(ruleRuleTag.ruleTagId, oldId))

      if (affectedRuleIds.length) {
        await tx
          .insert(ruleRuleTag)
          .values(
            affectedRuleIds.map((r) => ({
              ruleId: r.ruleId,
              ruleTagId: newId
            }))
          )
          .onConflictDoNothing({ target: [ruleRuleTag.ruleId, ruleRuleTag.ruleTagId] })

        await tx.delete(ruleRuleTag).where(eq(ruleRuleTag.ruleTagId, oldId))
      }

      await tx.delete(ruleTag).where(eq(ruleTag.id, oldId))

      return { id: newId }
    })

    const storage = useStorage('rule-tags')
    await storage.removeItem('list')

    const ruleStorage = useStorage('rules')
    await ruleStorage.removeItem('rule-list')

    return { success: true, ruleTag: result }
  } catch (error: any) {
    if (error?.statusCode) throw error

    if (getPgErrorCode(error) === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Ruletag findes allerede' })
    }

    throw createError({ statusCode: 500, statusMessage: error?.message ?? 'Uventet fejl' })
  }
})
