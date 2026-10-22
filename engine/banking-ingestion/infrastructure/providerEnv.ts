import { ZodError } from 'zod'

import { loadDanskeBankEdiEnvConfig } from './danskebank/danskeBankEdiEnvConfig'
import { loadDanskeBankEnvSecrets } from './danskebank/danskeBankEnvSecrets'
import { loadNordeaCorporateAccessEnvConfig } from './nordea/nordeaCorporateAccessEnvConfig'
import { loadNordeaEnvSecrets } from './nordea/nordeaEnvSecrets'
import { loadNordeaRestEnv } from './nordea/rest/env'

export type EnvRequirement =
  | { type: 'key'; key: string }
  | { type: 'anyOf'; label: string; keys: string[] }

export type ProviderEnvRequirementStatus =
  | { type: 'key'; key: string; present: boolean; invalid: boolean }
  | {
      type: 'anyOf'
      label: string
      keys: string[]
      presentKeys: string[]
      satisfied: boolean
      invalidKeys: string[]
    }

export type ProviderEnvStatus =
  | {
      status: 'ready' | 'missing_env' | 'not_configured'
      message?: string
      missingKeys: string[]
      env: {
        requirements: ProviderEnvRequirementStatus[]
        presentKeys: string[]
        missingKeys: string[]
        invalidKeys: string[]
      }
    }
  | { status: 'not_implemented'; message: string }

export function nonEmpty(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function inspectProviderEnv(
  provider: string,
  channel: string,
  env: NodeJS.ProcessEnv = process.env,
): ProviderEnvStatus {
  const requirements = providerEnvRequirements(provider, channel)
  if (!requirements) {
    return { status: 'not_implemented', message: 'Ikke implementeret endnu' }
  }

  const requirementStatuses: ProviderEnvRequirementStatus[] = []
  const presentKeys: string[] = []
  const missingKeys: string[] = []

  for (const requirement of requirements) {
    if (requirement.type === 'key') {
      const present = nonEmpty(env[requirement.key])
      requirementStatuses.push({ type: 'key', key: requirement.key, present, invalid: false })
      if (present) presentKeys.push(requirement.key)
      else missingKeys.push(requirement.key)
      continue
    }

    const presentGroupKeys = requirement.keys.filter(key => nonEmpty(env[key]))
    const satisfied = presentGroupKeys.length > 0
    requirementStatuses.push({
      type: 'anyOf',
      label: requirement.label,
      keys: requirement.keys,
      presentKeys: presentGroupKeys,
      satisfied,
      invalidKeys: [],
    })
    if (satisfied) presentKeys.push(...presentGroupKeys)
    else missingKeys.push(...requirement.keys)
  }

  const envStatus = {
    requirements: requirementStatuses,
    presentKeys: Array.from(new Set(presentKeys)),
    missingKeys: Array.from(new Set(missingKeys)),
    invalidKeys: [],
  }

  if (presentKeys.length === 0) {
    return {
      status: 'not_configured',
      message: 'Ingen relevante env vars sat',
      missingKeys: envStatus.missingKeys,
      env: envStatus,
    }
  }

  if (envStatus.missingKeys.length === 0) {
    return { status: 'ready', missingKeys: [], env: envStatus }
  }

  return {
    status: 'missing_env',
    message: 'Mangler env vars for at aktivere',
    missingKeys: envStatus.missingKeys,
    env: envStatus,
  }
}

export function extractEnvKeysFromMessage(message: string): string[] {
  const tokens = message.match(/[A-Z][A-Z0-9_]{2,}/g) ?? []
  return Array.from(new Set(tokens.filter((t) => t.includes('_'))))
}

export function extractKeysFromZod(err: ZodError): string[] {
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

export function providerEnvRequirements(provider: string, channel: string): EnvRequirement[] | null {
  if (provider === 'danskebank' && channel === 'iso20022') {
    return [
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

  if (provider === 'nordea' && channel === 'iso20022') {
    return [
      { type: 'key', key: 'NORDEA_CA_WS_SENDER_ID' },
      { type: 'key', key: 'NORDEA_CA_WS_USER_AGENT' },
      { type: 'key', key: 'NORDEA_CA_CUSTOMER_ID' },
      { type: 'key', key: 'NORDEA_CA_SIGNER_ID' },
      { type: 'key', key: 'NORDEA_CA_SOFTWARE_ID' },
      {
        type: 'anyOf',
        label: 'Privat nøgle (angiv mindst én)',
        keys: [
          'NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM',
          'NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM_B64',
        ],
      },
      {
        type: 'anyOf',
        label: 'Certifikat (angiv mindst én)',
        keys: [
          'NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM',
          'NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM_B64',
        ],
      },
    ]
  }

  if (provider === 'nordea' && channel === 'rest') {
    return [
      { type: 'key', key: 'NORDEA_REST_HOST' },
      { type: 'key', key: 'NORDEA_REST_CLIENT_ID' },
      { type: 'key', key: 'NORDEA_REST_CLIENT_SECRET' },
      { type: 'key', key: 'NORDEA_REST_AGREEMENT_NUMBER' },
      { type: 'key', key: 'NORDEA_REST_AUTHORIZER_ID' },
      {
        type: 'anyOf',
        label: 'EIDAS privat nøgle (angiv mindst én)',
        keys: ['NORDEA_REST_EIDAS_PRIVATE_KEY_PEM', 'NORDEA_REST_EIDAS_PRIVATE_KEY_PEM_B64'],
      },
    ]
  }

  return null
}

export function providerEnvKeys(provider: string, channel: string): string[] {
  const req = providerEnvRequirements(provider, channel)
  if (!req) return []

  const keys: string[] = []
  for (const r of req) {
    if (r.type === 'key') keys.push(r.key)
    else keys.push(...r.keys)
  }
  return Array.from(new Set(keys))
}

export function validateProviderEnvOrThrow(provider: string, channel: string): void {
  if (provider === 'danskebank' && channel === 'iso20022') {
    loadDanskeBankEdiEnvConfig()
    loadDanskeBankEnvSecrets()
    return
  }

  if (provider === 'nordea' && channel === 'iso20022') {
    loadNordeaCorporateAccessEnvConfig()
    loadNordeaEnvSecrets()
    return
  }

  if (provider === 'nordea' && channel === 'rest') {
    loadNordeaRestEnv()
    return
  }

  if (channel === 'rest' && provider === 'danskebank') {
    throw new Error('Danske Bank REST API er ikke implementeret endnu')
  }

  throw new Error('Ikke implementeret endnu')
}
