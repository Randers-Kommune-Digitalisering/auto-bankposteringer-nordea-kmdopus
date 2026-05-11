import { and, eq, inArray } from 'drizzle-orm'
import { account } from '~/lib/db/schema/account'
import { bankingAgreementAccountDimension } from '~/lib/db/schema/bankingAgreementAccountDimension'
import db from '~/lib/db'
import { createError, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing account ID' })
  }

  try {
    const rows = await db
      .select({
        id: account.id,
        name: account.name,
        provider: account.provider,
        iban: account.iban,
        currency: account.currency,
      })
      .from(account)
      .where(eq(account.id, id))
      .limit(1)

    const base = rows[0] ?? null
    if (!base) {
      throw createError({ statusCode: 404, statusMessage: 'Account not found' })
    }

    const dimRows = await db
      .select({ key: bankingAgreementAccountDimension.dimensionKey, value: bankingAgreementAccountDimension.dimensionValue })
      .from(bankingAgreementAccountDimension)
      .where(and(
        eq(bankingAgreementAccountDimension.provider, base.provider as any),
        eq(bankingAgreementAccountDimension.iban, base.iban),
        inArray(bankingAgreementAccountDimension.dimensionKey, ['statuskonto', 'artskonto']),
      ))

    const statuskonto = (() => {
      const preferred = dimRows.find((d) => String(d.key) === 'statuskonto')
      if (preferred?.value) return String(preferred.value)
      const legacy = dimRows.find((d) => String(d.key) === 'artskonto')
      if (legacy?.value) return String(legacy.value)
      return null
    })()

    const row = { ...base, statuskonto }
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Account not found' })
    }

    return row
  } catch (err) {
    console.error('Failed fetching account:', err)
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' })
  }
})
