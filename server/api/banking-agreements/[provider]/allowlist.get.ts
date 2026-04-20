import { defineEventHandler, createError } from 'h3'
import { and, asc, eq, inArray } from 'drizzle-orm'

import db from '~/lib/db'
import { bankProviderValues } from '~/lib/db/schema/bankingAgreement'
import { bankingAgreementAccountAllowlist } from '~/lib/db/schema/bankingAgreementAccountAllowlist'
import { bankingAgreementAccountDimension } from '~/lib/db/schema/bankingAgreementAccountDimension'

export default defineEventHandler(async (event) => {
  const provider = event.context.params?.provider
  if (!provider || !bankProviderValues.includes(provider as any)) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldig provider' })
  }

  const rows = await db
    .select({
      provider: bankingAgreementAccountAllowlist.provider,
      iban: bankingAgreementAccountAllowlist.iban,
      name: bankingAgreementAccountAllowlist.name,
      createdAt: bankingAgreementAccountAllowlist.createdAt,
      updatedAt: bankingAgreementAccountAllowlist.updatedAt,
    })
    .from(bankingAgreementAccountAllowlist)
    .where(eq(bankingAgreementAccountAllowlist.provider, provider as any))
    .orderBy(asc(bankingAgreementAccountAllowlist.iban))

  const ibans = Array.from(new Set(rows.map((r) => String(r.iban))))
  const dims = ibans.length
    ? await db
        .select({
          iban: bankingAgreementAccountDimension.iban,
          key: bankingAgreementAccountDimension.dimensionKey,
          value: bankingAgreementAccountDimension.dimensionValue,
        })
        .from(bankingAgreementAccountDimension)
        .where(and(
          eq(bankingAgreementAccountDimension.provider, provider as any),
          inArray(bankingAgreementAccountDimension.iban, ibans),
          inArray(bankingAgreementAccountDimension.dimensionKey, ['statuskonto', 'artskonto']),
        ))
    : []

  const statuskontoByIban = new Map<string, string>()
  for (const d of dims) {
    const iban = String(d.iban)
    const key = String(d.key)
    const value = String(d.value)
    if (key === 'statuskonto') {
      statuskontoByIban.set(iban, value)
      continue
    }
    if (!statuskontoByIban.has(iban)) statuskontoByIban.set(iban, value)
  }

  return rows.map((r) => ({
    ...r,
    statuskonto: statuskontoByIban.get(String(r.iban)) ?? null,
  }))
})
