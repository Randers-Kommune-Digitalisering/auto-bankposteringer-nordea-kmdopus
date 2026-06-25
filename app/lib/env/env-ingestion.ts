/**
 * Conditional validation for bank-ingestion env variables.
 *
 * Strategy:
 * - If none of a provider/channel's credential env vars are set => do not error.
 * - If any credential env var for a provider/channel is set => enforce full validation.
 */

import { z, ZodError } from 'zod'

import {
  extractKeysFromZod,
  providerEnvKeys,
  validateProviderEnvOrThrow,
} from '../../../engine/banking-ingestion/infrastructure/providerEnv'

export const IngestionEnvSchema = z
  .object({})
  .passthrough()
  .superRefine((_val, ctx) => {
    const env = process.env as Record<string, string | undefined>

    const checks: Array<{ provider: string; channel: string }> = [
      { provider: 'danskebank', channel: 'iso20022' },
      { provider: 'nordea', channel: 'iso20022' },
      { provider: 'nordea', channel: 'rest' },
    ]

    for (const c of checks) {
      const keys = providerEnvKeys(c.provider, c.channel)
      if (!keys.length) continue

      const credentialKeys = (() => {
        if (c.provider === 'danskebank' && c.channel === 'iso20022') {
          return [
            'DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM',
            'DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM_B64',
            'DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM',
            'DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM_B64',
            'DANSKE_BANK_MTLS_CLIENT_PRIVATE_KEY_PEM',
            'DANSKE_BANK_MTLS_CLIENT_PRIVATE_KEY_PEM_B64',
            'DANSKE_BANK_MTLS_CLIENT_CERTIFICATE_PEM',
            'DANSKE_BANK_MTLS_CLIENT_CERTIFICATE_PEM_B64',
            'DANSKE_BANK_TRUSTED_SIGNING_CERT_SHA256',
          ]
        }

        if (c.provider === 'nordea' && c.channel === 'iso20022') {
          return [
            'NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM',
            'NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM_B64',
            'NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM',
            'NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM_B64',
            'NORDEA_MTLS_CLIENT_PRIVATE_KEY_PEM',
            'NORDEA_MTLS_CLIENT_PRIVATE_KEY_PEM_B64',
            'NORDEA_MTLS_CLIENT_CERTIFICATE_PEM',
            'NORDEA_MTLS_CLIENT_CERTIFICATE_PEM_B64',
            'NORDEA_TRUSTED_SIGNING_CERT_SHA256',
          ]
        }

        if (c.provider === 'nordea' && c.channel === 'rest') {
          return [
            'NORDEA_REST_CLIENT_SECRET',
            'NORDEA_REST_EIDAS_PRIVATE_KEY_PEM',
            'NORDEA_REST_EIDAS_PRIVATE_KEY_PEM_B64',
          ]
        }

        return keys
      })()

      const anySet = credentialKeys.some((k) => typeof env[k] === 'string' && (env[k] ?? '').trim().length > 0)
      if (!anySet) continue

      try {
        validateProviderEnvOrThrow(c.provider, c.channel)
      } catch (err) {
        if (err instanceof ZodError) {
          const invalidKeys = extractKeysFromZod(err)
          for (const k of invalidKeys) {
            ctx.addIssue({
              code: 'custom',
              path: [k],
              message: `Manglende/ugyldige env vars for ${c.provider}/${c.channel}`,
            })
          }
          continue
        }

        ctx.addIssue({
          code: 'custom',
          path: [],
          message: String((err as any)?.message ?? err),
        })
      }
    }
  })

export type IngestionEnv = z.infer<typeof IngestionEnvSchema>
