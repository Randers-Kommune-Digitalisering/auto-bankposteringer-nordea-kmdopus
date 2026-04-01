import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

import db from '~/lib/db'
import { bankProviderValues } from '~/lib/db/schema/bankingAgreement'
import { bankingAgreementAccountAllowlist } from '~/lib/db/schema/bankingAgreementAccountAllowlist'

function normalizeIban(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase()
}

const bodySchema = z.object({
  iban: z.string().min(1),
})

const ibanSchema = z
  .string()
  .min(15)
  .max(34)
  .regex(/^[A-Z]{2}[0-9A-Z]{13,32}$/, 'Ugyldig IBAN format')

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

  const iban = normalizeIban(parsed.data.iban)
  const valid = ibanSchema.safeParse(iban)
  if (!valid.success) {
    throw createError({ statusCode: 400, statusMessage: valid.error.issues[0]?.message ?? 'Ugyldig IBAN' })
  }

  await db
    .insert(bankingAgreementAccountAllowlist)
    .values({ provider: provider as any, iban, updatedAt: new Date() } as any)
    .onConflictDoNothing({ target: [bankingAgreementAccountAllowlist.provider, bankingAgreementAccountAllowlist.iban] })

  const rows = await db
    .select()
    .from(bankingAgreementAccountAllowlist)
    .where(eq(bankingAgreementAccountAllowlist.provider, provider as any))

  return rows
})
