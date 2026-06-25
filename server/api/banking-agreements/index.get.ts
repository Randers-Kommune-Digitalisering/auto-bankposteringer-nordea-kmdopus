import { and, asc, eq, inArray } from 'drizzle-orm'
import db from '~/lib/db'
import { bankingAgreement, bankProviderValues } from '~/lib/db/schema/bankingAgreement'
import { ZodError } from 'zod'
import { bankingAgreementAccountAllowlist } from '~/lib/db/schema/bankingAgreementAccountAllowlist'
import { bankingAgreementAccountDimension } from '~/lib/db/schema/bankingAgreementAccountDimension'
import {
  extractKeysFromZod,
  nonEmpty,
  providerEnvRequirements,
} from '~/../engine/banking-ingestion/infrastructure/providerEnv'
import { getCertificateStatusFromPem, type CertificateStatus } from '~/../engine/banking-ingestion/infrastructure/certificateStatus'
import { loadDanskeBankEnvSecrets } from '~/../engine/banking-ingestion/infrastructure/danskebank/danskeBankEnvSecrets'
import { loadNordeaEnvSecrets } from '~/../engine/banking-ingestion/infrastructure/nordea/nordeaEnvSecrets'
import { setHeader } from 'h3'

type EnvRequirement =
  | { type: 'key'; key: string }
  | { type: 'anyOf'; label: string; keys: string[] }

type EnvRequirementStatus =
  | { type: 'key'; key: string; present: boolean; invalid: boolean }
  | {
      type: 'anyOf'
      label: string
      keys: string[]
      presentKeys: string[]
      satisfied: boolean
      invalidKeys: string[]
    }

type EnvStatus = {
  requirements: EnvRequirementStatus[]
  presentKeys: string[]
  missingKeys: string[]
  invalidKeys: string[]
}

type Readiness =
  | { status: 'ready'; env: EnvStatus }
  | { status: 'not_configured'; message: string; env: EnvStatus }
  | { status: 'missing_env'; message: string; missingKeys: string[]; env: EnvStatus }
  | { status: 'not_implemented'; message: string; env?: EnvStatus }

type CertInfo =
  | { status: 'not_applicable'; message: string }
  | ({ provider: string; channel: string } & CertificateStatus)

function computeProviderCertificateInfo(input: {
  provider: string
  channel: string
  enabled: boolean
  readiness: Readiness
}): CertInfo {
  // Keep this cheap: only compute certificate status when the agreement is enabled
  // and the provider/channel is configured.
  if (!input.enabled) {
    return { status: 'not_applicable', message: 'Ikke aktiv' }
  }
  if (input.readiness.status !== 'ready') {
    return { status: 'not_applicable', message: 'Ikke konfigureret' }
  }

  // Only ISO20022 providers use certificates in this UI.
  if (input.channel !== 'iso20022') {
    return { status: 'not_applicable', message: 'Ikke relevant for kanal' }
  }

  if (input.provider === 'danskebank' && input.channel === 'iso20022') {
    try {
      const secrets = loadDanskeBankEnvSecrets()
      return {
        provider: input.provider,
        channel: input.channel,
        ...getCertificateStatusFromPem({ certificatePem: secrets.applicationRequestCertificatePem, expiresSoonDays: 7 }),
      }
    } catch (e) {
      return { provider: input.provider, channel: input.channel, status: 'invalid', message: String((e as any)?.message ?? e) }
    }
  }

  if (input.provider === 'nordea' && input.channel === 'iso20022') {
    try {
      const secrets = loadNordeaEnvSecrets()
      return {
        provider: input.provider,
        channel: input.channel,
        ...getCertificateStatusFromPem({
          certificatePem: secrets.NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM,
          expiresSoonDays: 7,
        }),
      }
    } catch (e) {
      return { provider: input.provider, channel: input.channel, status: 'invalid', message: String((e as any)?.message ?? e) }
    }
  }

  return { status: 'not_applicable', message: 'Ikke relevant for kanal' }
}

function computeEnvStatus(requirements: EnvRequirement[], invalidKeySet: Set<string>): EnvStatus {
  const statuses: EnvRequirementStatus[] = []
  const presentKeys: string[] = []
  const missingKeys: string[] = []
  const invalidKeys: string[] = []

  for (const req of requirements) {
    if (req.type === 'key') {
      const present = nonEmpty(process.env[req.key])
      const invalid = invalidKeySet.has(req.key)
      statuses.push({ type: 'key', key: req.key, present, invalid })
      if (present) presentKeys.push(req.key)
      else missingKeys.push(req.key)
      if (invalid) invalidKeys.push(req.key)
      continue
    }

    const presentGroupKeys = req.keys.filter((k) => nonEmpty(process.env[k]))
    const satisfied = presentGroupKeys.length > 0
    const groupInvalidKeys = req.keys.filter((k) => invalidKeySet.has(k))
    statuses.push({
      type: 'anyOf',
      label: req.label,
      keys: req.keys,
      presentKeys: presentGroupKeys,
      satisfied,
      invalidKeys: groupInvalidKeys,
    })
    if (satisfied) presentKeys.push(...presentGroupKeys)
    else missingKeys.push(...req.keys)
    invalidKeys.push(...groupInvalidKeys)
  }

  return {
    requirements: statuses,
    presentKeys: Array.from(new Set(presentKeys)),
    missingKeys: Array.from(new Set(missingKeys)),
    invalidKeys: Array.from(new Set(invalidKeys)),
  }
}

function computeProviderReadiness(provider: string, channel: string): Readiness {
  const requirements = providerEnvRequirements(provider, channel)
  if (!requirements) {
    return { status: 'not_implemented', message: 'Ikke implementeret endnu' }
  }

  // Keep readiness checks lightweight (presence-based).
  // Full/deep validation (e.g., key decoding) happens when enabling agreements or running ingestion.
  const env = computeEnvStatus(requirements, new Set())
  const hasAnyRelevantEnv = env.presentKeys.length > 0

  if (!hasAnyRelevantEnv) {
    return { status: 'not_configured', message: 'Ingen relevante env vars sat', env }
  }


  if (env.missingKeys.length === 0 && env.invalidKeys.length === 0) return { status: 'ready', env }
  return { status: 'missing_env', message: 'Mangler env vars for at aktivere', missingKeys: env.missingKeys, env }
}

export default defineEventHandler(async (event) => {
  // This endpoint is used in interactive settings screens; avoid HTTP caching so refetch shows changes immediately.
  setHeader(event, 'Cache-Control', 'no-store')

  // Ensure baseline rows exist for each provider.
  await db
    .insert(bankingAgreement)
    .values(bankProviderValues.map((provider) => ({ provider, enabled: false })))
    .onConflictDoNothing({ target: bankingAgreement.provider })

  const agreements = await db.select().from(bankingAgreement).orderBy(asc(bankingAgreement.provider))
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
    const readiness = computeProviderReadiness(providerKey, channel)
    return {
      ...a,
      allowlistAccounts: allowlistByProvider.get(providerKey) ?? [],
      readiness,
      certificate: computeProviderCertificateInfo({ provider: providerKey, channel, enabled: Boolean(a.enabled), readiness }),
    }
  })
})
