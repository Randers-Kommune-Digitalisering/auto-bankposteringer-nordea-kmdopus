import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import db from '~/lib/db'
import { bankingAgreement, bankProviderValues } from '~/lib/db/schema/bankingAgreement'
import { bankingAgreementDiscoveryRun } from '~/lib/db/schema/bankingAgreementDiscoveryRun'
import { bankingAgreementAccountAllowlist } from '~/lib/db/schema/bankingAgreementAccountAllowlist'
import { bankingAgreementAccountDimension } from '~/lib/db/schema/bankingAgreementAccountDimension'
import { setHeader } from 'h3'
import { logger } from '~/lib/logger'
import { getWorkerConfiguration, type WorkerProviderConfiguration } from '~/../server/utils/workerStatus'

function configUnavailable(message: string): WorkerProviderConfiguration {
  return {
    readiness: { status: 'worker_unavailable', message },
    certificate: { status: 'not_applicable', message },
  }
}

export default defineEventHandler(async (event) => {
  // This endpoint is used in interactive settings screens; avoid HTTP caching so refetch shows changes immediately.
  setHeader(event, 'Cache-Control', 'no-store')

  let workerProviders: Record<string, WorkerProviderConfiguration> = {}
  try {
    workerProviders = (await getWorkerConfiguration()).providers
  } catch (error) {
    logger.warn('Worker configuration status unavailable', { error })
  }

  // Ensure baseline rows exist for each provider.
  await db
    .insert(bankingAgreement)
    .values(bankProviderValues.map((provider) => ({ provider, enabled: false })))
    .onConflictDoNothing({ target: bankingAgreement.provider })

  const agreements = await db.select().from(bankingAgreement).orderBy(asc(bankingAgreement.provider))
  const discoveryRows = await db
    .select()
    .from(bankingAgreementDiscoveryRun)
    .orderBy(asc(bankingAgreementDiscoveryRun.provider), desc(bankingAgreementDiscoveryRun.requestedAt))

  const latestDiscoveryByProvider = new Map<string, typeof discoveryRows[number]>()
  for (const row of discoveryRows) {
    const key = String(row.provider)
    if (latestDiscoveryByProvider.has(key)) continue
    latestDiscoveryByProvider.set(key, row)
  }
  const allowlistRows = await db
    .select({
      provider: bankingAgreementAccountAllowlist.provider,
      iban: bankingAgreementAccountAllowlist.iban,
      name: bankingAgreementAccountAllowlist.name,
    })
    .from(bankingAgreementAccountAllowlist)
    .orderBy(asc(bankingAgreementAccountAllowlist.provider), asc(bankingAgreementAccountAllowlist.iban))

  const providers = Array.from(new Set(allowlistRows.map((r) => String(r.provider))))
  const ibans = Array.from(new Set(allowlistRows.map((r) => String(r.iban))))

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

  const artskontoByProviderIban = new Map<string, string>()
  const ignoreByProviderIban = new Map<string, boolean>()
  for (const d of dimRows) {
    const k = `${String(d.provider)}:${String(d.iban)}`
    const key = String(d.key)
    if (key === 'ignore_ingestion') {
      ignoreByProviderIban.set(k, /^(1|true|yes)$/i.test(String(d.value ?? '').trim()))
      continue
    }
    if (key === 'artskonto') {
      artskontoByProviderIban.set(k, String(d.value))
      continue
    }
    if (!artskontoByProviderIban.has(k)) artskontoByProviderIban.set(k, String(d.value))
  }

  const allowlistByProvider = new Map<string, Array<{
    iban: string
    name: string | null
    artskonto: string | null
    statuskonto: string | null
    ignoreIngestion: boolean
  }>>()
  for (const row of allowlistRows) {
    const provider = String(row.provider)
    const iban = String(row.iban)
    const name = row.name === null || typeof row.name === 'undefined' ? null : String(row.name)
    const artskonto = artskontoByProviderIban.get(`${provider}:${iban}`) ?? null
    const ignoreIngestion = ignoreByProviderIban.get(`${provider}:${iban}`) ?? false
    const existing = allowlistByProvider.get(provider) ?? []
    existing.push({ iban, name, artskonto, statuskonto: artskonto, ignoreIngestion })
    allowlistByProvider.set(provider, existing)
  }

  return agreements.map((a) => {
    const providerKey = String(a.provider)
    const channel = String(a.channel ?? 'iso20022')
    const workerConfiguration = workerProviders[`${providerKey}/${channel}`]
      ?? configUnavailable('Workerens konfigurationsstatus er ikke tilgængelig')
    return {
      ...a,
      allowlistAccounts: allowlistByProvider.get(providerKey) ?? [],
      readiness: workerConfiguration.readiness,
      certificate: a.enabled
        ? { provider: providerKey, channel, ...workerConfiguration.certificate }
        : { status: 'not_applicable', message: 'Ikke aktiv' },
      latestDiscovery: (() => {
        const run = latestDiscoveryByProvider.get(providerKey)
        if (!run) return null
        return {
          id: run.id,
          status: run.status,
          channel: run.channel,
          requestedAt: run.requestedAt?.toISOString() ?? null,
          startedAt: run.startedAt?.toISOString() ?? null,
          finishedAt: run.finishedAt?.toISOString() ?? null,
          updatedAt: run.updatedAt?.toISOString() ?? null,
          discoveredAccounts: run.discoveredAccounts,
          inspectedDocuments: run.inspectedDocuments,
          skippedDays: run.skippedDays,
          errorMessage: run.errorMessage,
        }
      })(),
    }
  })
})
