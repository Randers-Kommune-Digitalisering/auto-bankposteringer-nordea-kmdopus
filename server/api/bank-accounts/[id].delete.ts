import { eq } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import db from '~/lib/db'
import { account } from '~/lib/db/schema'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Manglende konto-id' })
  }

  const [deleted] = await db.delete(account).where(eq(account.id, id)).returning()

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Bankkonto ikke fundet' })
  }

  const storage = useStorage('bank-accounts')
  await storage.removeItem('list')

  return { success: true }
})
