import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import { account } from '~/lib/db/schema'

const updateSchema = z.object({
  statusAccount: z.number('Statuskonto er påkrævet').int('Skal være et helt tal')
})

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Manglende konto-id' })
  }

  const body = await readBody(event)

  let payload
  try {
    payload = updateSchema.parse(body)
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error?.message ?? 'Ugyldigt input' })
  }

  const [updated] = await db
    .update(account)
    .set(payload)
    .where(eq(account.id, id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Bankkonto ikke fundet' })
  }

  const storage = useStorage('bank-accounts')
  await storage.removeItem('list')

  return { success: true, account: updated }
})
