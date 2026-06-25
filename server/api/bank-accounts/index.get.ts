import { and, asc, eq, inArray } from 'drizzle-orm'
import { setHeader } from 'h3'
import { account } from '~/lib/db/schema/account'
import { bankingAgreementAccountDimension } from '~/lib/db/schema/bankingAgreementAccountDimension'
import db from '~/lib/db'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const base = await db
    .select({
      id: account.id,
      name: account.name,
      provider: account.provider,
      iban: account.iban,
      currency: account.currency,
    })
    .from(account)
    .orderBy(asc(account.iban), asc(account.currency), asc(account.provider))

  const providers = Array.from(new Set(base.map((r) => String(r.provider))))
  const ibans = Array.from(new Set(base.map((r) => String(r.iban))))

  const dimRows = providers.length && ibans.length
    ? await db
        .select({
          provider: bankingAgreementAccountDimension.provider,
          iban: bankingAgreementAccountDimension.iban,
          key: bankingAgreementAccountDimension.dimensionKey,
          value: bankingAgreementAccountDimension.dimensionValue,
        })
        .from(bankingAgreementAccountDimension)
        .where(and(
          inArray(bankingAgreementAccountDimension.provider, providers as any),
          inArray(bankingAgreementAccountDimension.iban, ibans),
          inArray(bankingAgreementAccountDimension.dimensionKey, ['artskonto', 'statuskonto', 'ignore_ingestion']),
        ))
    : []

  const mapped = new Map<string, string>()
  const ignored = new Map<string, boolean>()
  for (const d of dimRows) {
    const k = `${String(d.provider)}:${String(d.iban)}`
    const key = String(d.key)
    const value = String(d.value)

    if (key === 'ignore_ingestion') {
      ignored.set(k, /^(1|true|yes)$/i.test(value.trim()))
      continue
    }

    if (key === 'artskonto') {
      mapped.set(k, String(d.value))
      continue
    }
    if (!mapped.has(k)) mapped.set(k, String(d.value))
  }

  const accounts = base.map((r) => ({
    ...r,
    artskonto: mapped.get(`${String(r.provider)}:${String(r.iban)}`) ?? null,
    statuskonto: mapped.get(`${String(r.provider)}:${String(r.iban)}`) ?? null,
    ignoreIngestion: ignored.get(`${String(r.provider)}:${String(r.iban)}`) ?? false,
  }))

  return accounts
})
