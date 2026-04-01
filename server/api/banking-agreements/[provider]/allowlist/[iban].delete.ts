import { defineEventHandler, createError } from 'h3'
import { and, eq } from 'drizzle-orm'

import db from '~/lib/db'
import { bankProviderValues } from '~/lib/db/schema/bankingAgreement'
import { bankingAgreementAccountAllowlist } from '~/lib/db/schema/bankingAgreementAccountAllowlist'

function normalizeIban(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase()
}

export default defineEventHandler(async (event) => {
  const provider = event.context.params?.provider
  const ibanParam = event.context.params?.iban

  if (!provider || !bankProviderValues.includes(provider as any)) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldig provider' })
  }
  if (!ibanParam || typeof ibanParam !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Mangler IBAN' })
  }

  const iban = normalizeIban(ibanParam)

  await db
    .delete(bankingAgreementAccountAllowlist)
    .where(
      and(
        eq(bankingAgreementAccountAllowlist.provider, provider as any),
        eq(bankingAgreementAccountAllowlist.iban, iban),
      ),
    )

  return { success: true }
})
