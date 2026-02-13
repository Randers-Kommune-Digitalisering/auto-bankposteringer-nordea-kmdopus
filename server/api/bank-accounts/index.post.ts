import { defineEventHandler, readBody, createError } from 'h3'
import db from '~/lib/db'
import { account, accountInsertSchema } from '~/lib/db/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  let payload
  try {
    payload = accountInsertSchema.parse(body)
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error?.message ?? 'Ugyldigt input' })
  }

  try {
    const [inserted] = await db.insert(account).values(payload).returning()

    const storage = useStorage('bank-accounts')
    await storage.removeItem('list')

    return { success: true, account: inserted }
  } catch (error: any) {
    if (error?.code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Bankkonto findes allerede' })
    }

    throw createError({ statusCode: 500, statusMessage: error?.message ?? 'Uventet fejl' })
  }
})
