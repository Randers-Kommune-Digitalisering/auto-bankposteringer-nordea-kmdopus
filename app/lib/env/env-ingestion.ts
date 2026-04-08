import { z, ZodError } from 'zod'

import {
  extractKeysFromZod,
  providerEnvKeys,
  validateProviderEnvOrThrow,
} from '../../../engine/banking-ingestion/infrastructure/providerEnv'

/**
 * Conditional validation for bank-ingestion env variables.
 *
 * Goal:
 * - Keep runtime stateless.
 * - Avoid failing application startup when a provider is not configured.
 * - Avoid duplicating env-requirements in multiple places.
 *
 * Strategy:
 * - If none of a provider/channel's env vars are set => do not error.
 * - If any env var for a provider/channel is set => enforce full validation via the provider env loader.
 */
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

      const anySet = keys.some((k) => typeof env[k] === 'string' && (env[k] ?? '').trim().length > 0)
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
