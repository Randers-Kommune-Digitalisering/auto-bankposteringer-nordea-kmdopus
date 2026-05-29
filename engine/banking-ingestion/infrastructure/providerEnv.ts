import { ZodError } from 'zod'

import { loadDanskeBankEdiEnvConfig } from './danskebank/danskeBankEdiEnvConfig'
import { loadDanskeBankEnvSecrets } from './danskebank/danskeBankEnvSecrets'
import { loadNordeaCorporateAccessEnvConfig } from './nordea/nordeaCorporateAccessEnvConfig'
import { loadNordeaEnvSecrets } from './nordea/nordeaEnvSecrets'
import { loadNordeaRestEnv } from './nordea/rest/env'

export type EnvRequirement =
  | { type: 'key'; key: string }
  | { type: 'anyOf'; label: string; keys: string[] }

export function nonEmpty(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
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
