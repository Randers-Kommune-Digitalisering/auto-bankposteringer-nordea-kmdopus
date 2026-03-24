import { asc } from 'drizzle-orm'
import db from '~/lib/db'
import { bankingAgreement, bankProviderValues } from '~/lib/db/schema/bankingAgreement'

export default defineEventHandler(async () => {
  // Ensure baseline rows exist for each provider.
  await db
    .insert(bankingAgreement)
    .values(bankProviderValues.map((provider) => ({ provider, enabled: false })))
    .onConflictDoNothing({ target: bankingAgreement.provider })

  return db.select().from(bankingAgreement).orderBy(asc(bankingAgreement.provider))
})
