import { asc } from 'drizzle-orm'
import db from '~/lib/db'
import { bankingAgreement, bankProviderValues } from '~/lib/db/schema/bankingAgreement'
import { ZodError } from 'zod'
import { bankingAgreementAccountAllowlist } from '~/lib/db/schema/bankingAgreementAccountAllowlist'

import { loadDanskeBankEdiEnvConfig } from '~/../engine/banking-ingestion/infrastructure/danskebank/danskeBankEdiEnvConfig'
import { loadDanskeBankEnvSecrets } from '~/../engine/banking-ingestion/infrastructure/danskebank/danskeBankEnvSecrets'
import { loadNordeaCorporateAccessEnvConfig } from '~/../engine/banking-ingestion/infrastructure/nordea/nordeaCorporateAccessEnvConfig'
import { loadNordeaEnvSecrets } from '~/../engine/banking-ingestion/infrastructure/nordea/nordeaEnvSecrets'

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

function nonEmpty(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function extractEnvKeysFromMessage(message: string): string[] {
  // Conservative: only keep ALL_CAPS_WITH_UNDERSCORES tokens.
  const tokens = message.match(/[A-Z][A-Z0-9_]{2,}/g) ?? []
  return Array.from(new Set(tokens.filter((t) => t.includes('_'))))
}

function extractKeysFromZod(err: ZodError): string[] {
  const keys: string[] = []
  for (const issue of err.issues) {
    if (issue.path.length) {
      keys.push(issue.path.map(String).join('.'))
      continue
    }
    if (issue.message) {
      keys.push(...extractEnvKeysFromMessage(issue.message))
    }
  }
  return Array.from(new Set(keys)).filter(Boolean)
}

function providerEnvRequirements(provider: string, channel: string): EnvRequirement[] | null {
  if (channel === 'rest') return null

  if (provider === 'danskebank') {
    return [
      { type: 'key', key: 'DANSKE_BANK_EDI_SENDER_ID' },
      { type: 'key', key: 'DANSKE_BANK_EDI_USER_AGENT' },
      { type: 'key', key: 'DANSKE_BANK_CUSTOMER_ID' },
      { type: 'key', key: 'DANSKE_BANK_SIGNER_ID' },
      { type: 'key', key: 'DANSKE_BANK_SOFTWARE_ID' },
      { type: 'key', key: 'DANSKE_BANK_PKI_SENDER_ID' },
      { type: 'key', key: 'DANSKE_BANK_PKI_CUSTOMER_ID' },
      {
        type: 'anyOf',
        label: 'Privat nøgle (angiv mindst én)',
        keys: [
          'DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM',
          'DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM_B64',
        ],
      },
      {
        type: 'anyOf',
        label: 'Certifikat (angiv mindst én)',
        keys: [
          'DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM',
          'DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM_B64',
        ],
      },
    ]
  }

  if (provider === 'nordea') {
    return [
      { type: 'key', key: 'NORDEA_CA_WS_SENDER_ID' },
      { type: 'key', key: 'NORDEA_CA_WS_USER_AGENT' },
      { type: 'key', key: 'NORDEA_CA_CUSTOMER_ID' },
      { type: 'key', key: 'NORDEA_CA_SIGNER_ID' },
      { type: 'key', key: 'NORDEA_CA_SOFTWARE_ID' },
      {
        type: 'anyOf',
        label: 'Privat nøgle (angiv mindst én)',
        keys: ['NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM', 'NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM_B64'],
      },
      {
        type: 'anyOf',
        label: 'Certifikat (angiv mindst én)',
        keys: ['NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM', 'NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM_B64'],
      },
    ]
  }

  return null
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

function validateProviderEnv(provider: string, channel: string): void {
  if (channel === 'rest') {
    if (provider === 'nordea') throw new Error('Nordea REST (Premium API) er ikke implementeret endnu')
    if (provider === 'danskebank') throw new Error('Danske Bank REST API er ikke implementeret endnu')
    throw new Error('REST kanal er ikke implementeret endnu')
  }

  if (provider === 'danskebank') {
    loadDanskeBankEdiEnvConfig()
    loadDanskeBankEnvSecrets()
    return
  }
  if (provider === 'nordea') {
    loadNordeaCorporateAccessEnvConfig()
    loadNordeaEnvSecrets()
    return
  }

  throw new Error('Ikke implementeret endnu')
}

function computeProviderReadiness(provider: string, channel: string): Readiness {
  const requirements = providerEnvRequirements(provider, channel)
  if (!requirements) {
    if (channel === 'rest') return { status: 'not_implemented', message: 'REST kanal er ikke implementeret endnu' }
    return { status: 'not_implemented', message: 'Ikke implementeret endnu' }
  }

  // First pass: compute invalid keys if Zod points to keys that are set but invalid.
  let invalidFromZod = new Set<string>()
  try {
    validateProviderEnv(provider, channel)
  } catch (err) {
    if (err instanceof ZodError) {
      const keys = extractKeysFromZod(err)
      invalidFromZod = new Set(keys.filter((k) => nonEmpty(process.env[k])))
    }
  }

  const env = computeEnvStatus(requirements, invalidFromZod)
  const hasAnyRelevantEnv = env.presentKeys.length > 0

  if (!hasAnyRelevantEnv) {
    return { status: 'not_configured', message: 'Ingen relevante env vars sat', env }
  }

  // Second pass: enforce full validation and produce a stable readiness status.
  try {
    validateProviderEnv(provider, channel)
    if (env.missingKeys.length === 0 && env.invalidKeys.length === 0) return { status: 'ready', env }
    return { status: 'missing_env', message: 'Mangler env vars for at aktivere', missingKeys: env.missingKeys, env }
  } catch (err) {
    if (err instanceof ZodError) {
      const invalidKeys = extractKeysFromZod(err).filter((k) => nonEmpty(process.env[k]))
      const envWithInvalid = computeEnvStatus(requirements, new Set(invalidKeys))
      return {
        status: 'missing_env',
        message: 'Mangler/ugyldige env vars for at aktivere',
        missingKeys: envWithInvalid.missingKeys,
        env: envWithInvalid,
      }
    }
    return {
      status: 'missing_env',
      message: String((err as any)?.message ?? err),
      missingKeys: env.missingKeys,
      env,
    }
  }
}

export default defineEventHandler(async () => {
  // Ensure baseline rows exist for each provider.
  await db
    .insert(bankingAgreement)
    .values(bankProviderValues.map((provider) => ({ provider, enabled: false })))
    .onConflictDoNothing({ target: bankingAgreement.provider })

  const agreements = await db.select().from(bankingAgreement).orderBy(asc(bankingAgreement.provider))
  const allowlistRows = await db
    .select()
    .from(bankingAgreementAccountAllowlist)
    .orderBy(asc(bankingAgreementAccountAllowlist.provider), asc(bankingAgreementAccountAllowlist.iban))

  const allowlistByProvider = new Map<string, string[]>()
  for (const row of allowlistRows) {
    const provider = String((row as any).provider)
    const iban = String((row as any).iban)
    const existing = allowlistByProvider.get(provider) ?? []
    existing.push(iban)
    allowlistByProvider.set(provider, existing)
  }

  return agreements.map((a) => {
    const providerKey = String(a.provider)
    return {
      ...a,
      allowlistIbans: allowlistByProvider.get(providerKey) ?? [],
      readiness: computeProviderReadiness(providerKey, String(a.channel ?? 'iso20022')),
    }
  })
})
