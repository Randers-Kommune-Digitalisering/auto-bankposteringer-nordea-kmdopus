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
  name: z.string().trim().min(1).max(80).optional(),
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
  const name = typeof parsed.data.name === 'string' && parsed.data.name.trim().length ? parsed.data.name.trim() : null
  const valid = ibanSchema.safeParse(iban)
  if (!valid.success) {
    throw createError({ statusCode: 400, statusMessage: valid.error.issues[0]?.message ?? 'Ugyldig IBAN' })
  }

  await db
    .insert(bankingAgreementAccountAllowlist)
    .values({ provider: provider as any, iban, name, updatedAt: new Date() } as any)
    .onConflictDoUpdate({
      target: [bankingAgreementAccountAllowlist.provider, bankingAgreementAccountAllowlist.iban],
      set: { name, updatedAt: new Date() } as any,
    })

  const rows = await db
    .select()
    .from(bankingAgreementAccountAllowlist)
    .where(eq(bankingAgreementAccountAllowlist.provider, provider as any))

  return rows
})
