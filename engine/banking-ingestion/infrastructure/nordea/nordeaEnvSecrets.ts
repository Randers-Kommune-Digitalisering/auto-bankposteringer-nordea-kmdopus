import { z } from 'zod'

/**
 * Minimal env-based secret loading for Nordea Secure Envelope.
 *
 * This does NOT assume any specific deployment platform; it just reads `process.env`.
 * Keep secrets out of DB to preserve statelessness.
 */

const schema = z
  .object({
    // Prefer PEM directly.
    NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM: z.string().min(1).optional(),
    NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM: z.string().min(1).optional(),

    // Or provide base64 for easier secret storage (single-line).
    NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM_B64: z.string().min(1).optional(),
    NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM_B64: z.string().min(1).optional(),

    /** Optional pinning for Nordea's response signing cert (SHA-256 fingerprint hex, lowercase/uppercase ok). */
    NORDEA_TRUSTED_SIGNING_CERT_SHA256: z.string().length(64).optional(),
  })
  .superRefine((val, ctx) => {
    const hasKey = Boolean(val.NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM || val.NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM_B64)
    const hasCert = Boolean(val.NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM || val.NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM_B64)
    if (!hasKey) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Missing Nordea private key: set NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM or NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM_B64',
      })
    }
    if (!hasCert) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Missing Nordea certificate: set NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM or NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM_B64',
      })
    }
  })

export type NordeaEnvSecrets = z.infer<typeof schema>

export function loadNordeaEnvSecrets(env: NodeJS.ProcessEnv = process.env): NordeaEnvSecrets {
  const parsed = schema.parse(env)

  const decodeMaybeB64 = (pem: string | undefined, b64: string | undefined): string => {
    if (pem) return pem
    if (!b64) return ''
    return Buffer.from(b64, 'base64').toString('utf8')
  }

  return {
    NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM: decodeMaybeB64(
      parsed.NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM,
      parsed.NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM_B64,
    ),
    NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM: decodeMaybeB64(
      parsed.NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM,
      parsed.NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM_B64,
    ),
    NORDEA_TRUSTED_SIGNING_CERT_SHA256: parsed.NORDEA_TRUSTED_SIGNING_CERT_SHA256,
    NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM_B64: parsed.NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM_B64,
    NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM_B64: parsed.NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM_B64,
  }
}
