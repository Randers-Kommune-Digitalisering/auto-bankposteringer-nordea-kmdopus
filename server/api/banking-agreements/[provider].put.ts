import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import { bankingAgreement, bankProviderValues } from '~/lib/db/schema/bankingAgreement'

const bodySchema = z.object({
  enabled: z.boolean(),
})

export default defineEventHandler(async (event) => {
  const provider = event.context.params?.provider
  if (!provider || !bankProviderValues.includes(provider as any)) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldig provider' })
  }

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.message })
  }

  const [updated] = await db
    .update(bankingAgreement)
    .set({ enabled: parsed.data.enabled, updatedAt: new Date() })
    .where(eq(bankingAgreement.provider, provider as any))
    .returning()

  if (!updated) {
    // If row doesn't exist yet, create it.
    const [inserted] = await db
      .insert(bankingAgreement)
      .values({ provider: provider as any, enabled: parsed.data.enabled })
      .returning()

    return { success: true, agreement: inserted }
  }

  return { success: true, agreement: updated }
})
