import { defineEventHandler, createError } from 'h3'
import { asc, eq } from 'drizzle-orm'

import db from '~/lib/db'
import { bankProviderValues } from '~/lib/db/schema/bankingAgreement'
import { bankingAgreementAccountAllowlist } from '~/lib/db/schema/bankingAgreementAccountAllowlist'

export default defineEventHandler(async (event) => {
  const provider = event.context.params?.provider
  if (!provider || !bankProviderValues.includes(provider as any)) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldig provider' })
  }

  return db
    .select()
    .from(bankingAgreementAccountAllowlist)
    .where(eq(bankingAgreementAccountAllowlist.provider, provider as any))
    .orderBy(asc(bankingAgreementAccountAllowlist.iban))
})
