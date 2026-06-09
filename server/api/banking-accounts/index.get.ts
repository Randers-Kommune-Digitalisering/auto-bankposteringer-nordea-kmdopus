import { and, asc, eq, inArray } from 'drizzle-orm'
import { defineEventHandler, setHeader } from 'h3'

import db from '~/lib/db'
import { account } from '~/lib/db/schema/account'
import { bankingAgreementAccountAllowlist } from '~/lib/db/schema/bankingAgreementAccountAllowlist'
import { bankingAgreementAccountDimension } from '~/lib/db/schema/bankingAgreementAccountDimension'

export type BankingAccountUnionDto = {
  provider: 'danskebank' | 'nordea' | 'bankconnect'
  iban: string
  currency: string | null
  name: string | null
  statuskonto: string | null
  ignoreIngestion: boolean
  observed: boolean
  configuredForApi: boolean
  observedAccountId: string | null
}

export default defineEventHandler(async (event) => {
  // This endpoint is used in interactive settings screens; avoid HTTP caching so refetch shows changes immediately.
  setHeader(event, 'Cache-Control', 'no-store')

  const observed = await db
    .select({
      id: account.id,
      provider: account.provider,
      iban: account.iban,
      currency: account.currency,
      name: account.name,
    })
    .from(account)
    .orderBy(asc(account.iban), asc(account.currency), asc(account.provider))

  const configured = await db
    .select({
      provider: bankingAgreementAccountAllowlist.provider,
      iban: bankingAgreementAccountAllowlist.iban,
      name: bankingAgreementAccountAllowlist.name,
    })
    .from(bankingAgreementAccountAllowlist)
    .orderBy(asc(bankingAgreementAccountAllowlist.iban), asc(bankingAgreementAccountAllowlist.provider))

  const providerSet = new Set<string>()
  const ibanSet = new Set<string>()
  for (const row of observed) {
    if (row.provider) providerSet.add(String(row.provider))
    if (row.iban) ibanSet.add(String(row.iban))
  }
  for (const row of configured) {
    if (row.provider) providerSet.add(String(row.provider))
    if (row.iban) ibanSet.add(String(row.iban))
  }

  const providers = Array.from(providerSet)
  const ibans = Array.from(ibanSet)

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
          inArray(bankingAgreementAccountDimension.dimensionKey, ['statuskonto', 'artskonto', 'ignore_ingestion']),
        ))
    : []

  const statuskontoByProviderIban = new Map<string, string>()
  const ignoreIngestionByProviderIban = new Map<string, boolean>()
  // Prefer new key, but allow legacy.
  for (const d of dimRows) {
    const provider = String(d.provider)
    const iban = String(d.iban)
    const mapKey = `${provider}:${iban}`
    const key = String(d.key)
    const value = String(d.value)

    if (key === 'ignore_ingestion') {
      ignoreIngestionByProviderIban.set(mapKey, /^(1|true|yes)$/i.test(value.trim()))
      continue
    }

    if (key === 'statuskonto') {
      statuskontoByProviderIban.set(mapKey, value)
      continue
    }

    if (!statuskontoByProviderIban.has(mapKey)) {
      statuskontoByProviderIban.set(mapKey, value)
    }
  }

  const byProviderIban = new Map<string, BankingAccountUnionDto[]>()

  for (const row of observed) {
    const provider = row.provider as BankingAccountUnionDto['provider']
    const iban = String(row.iban)
    const key = `${provider}:${iban}`

    const dto: BankingAccountUnionDto = {
      provider,
      iban,
      currency: row.currency ? String(row.currency) : null,
      name: row.name ? String(row.name) : null,
      statuskonto: statuskontoByProviderIban.get(key) ?? null,
      ignoreIngestion: ignoreIngestionByProviderIban.get(key) ?? false,
      observed: true,
      configuredForApi: false,
      observedAccountId: String(row.id),
    }

    const bucket = byProviderIban.get(key) ?? []
    bucket.push(dto)
    byProviderIban.set(key, bucket)
  }

  const out: BankingAccountUnionDto[] = []

  // First, add observed (and later mark configuredForApi=true where applicable)
  for (const bucket of byProviderIban.values()) {
    out.push(...bucket)
  }

  for (const cfg of configured) {
    const provider = cfg.provider as BankingAccountUnionDto['provider']
    const iban = String(cfg.iban)
    const key = `${provider}:${iban}`

    const bucket = byProviderIban.get(key)
    if (bucket?.length) {
      for (const row of bucket) {
        row.configuredForApi = true
        // Prefer explicit configured name over observed bank owner name.
        if (cfg.name) row.name = String(cfg.name)
        if (!row.statuskonto) row.statuskonto = statuskontoByProviderIban.get(key) ?? null
      }
      continue
    }

    out.push({
      provider,
      iban,
      currency: null,
      name: cfg.name ? String(cfg.name) : null,
      statuskonto: statuskontoByProviderIban.get(key) ?? null,
      ignoreIngestion: ignoreIngestionByProviderIban.get(key) ?? false,
      observed: false,
      configuredForApi: true,
      observedAccountId: null,
    })
  }

  return out.sort((a, b) =>
    (a.iban.localeCompare(b.iban, 'da', { sensitivity: 'base' })) ||
    ((a.currency ?? '').localeCompare(b.currency ?? '')) ||
    (a.provider.localeCompare(b.provider, 'da', { sensitivity: 'base' })),
  )
})
