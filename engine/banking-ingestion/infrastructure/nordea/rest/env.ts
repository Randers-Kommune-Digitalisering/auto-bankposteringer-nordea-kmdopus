import { z } from 'zod'

const schema = z
  .object({
    NORDEA_REST_HOST: z.string().min(1),
    NORDEA_REST_CLIENT_ID: z.string().min(1),
    NORDEA_REST_CLIENT_SECRET: z.string().min(1),
    NORDEA_REST_AGREEMENT_NUMBER: z.string().min(1),
    NORDEA_REST_AUTHORIZER_ID: z.string().min(1),

    // Optional tuning / defaults
    NORDEA_REST_SCOPE: z.string().min(1).optional(),
    NORDEA_REST_ACCESS_DURATION_SEC: z.coerce.number().int().positive().optional(),
    NORDEA_REST_TIMEOUT_MS: z.coerce.number().int().positive().optional(),

    // Secrets: provide either raw PEM or a base64 encoded PEM.
    NORDEA_REST_EIDAS_PRIVATE_KEY_PEM: z.string().min(1).optional(),
    NORDEA_REST_EIDAS_PRIVATE_KEY_PEM_B64: z.string().min(1).optional(),
  })
  .superRefine((val, ctx) => {
    const hasKey = Boolean(val.NORDEA_REST_EIDAS_PRIVATE_KEY_PEM || val.NORDEA_REST_EIDAS_PRIVATE_KEY_PEM_B64)
    if (!hasKey) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Missing Nordea REST private key: set NORDEA_REST_EIDAS_PRIVATE_KEY_PEM or NORDEA_REST_EIDAS_PRIVATE_KEY_PEM_B64',
      })
    }
  })

export type NordeaRestEnv = z.infer<typeof schema> & {
  eidasPrivateKeyPem: string
  scopes: string[]
}

function normalizeHost(input: string): string {
  const trimmed = input.trim()

  // If a full URL was provided, use its host part.
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed)
      return u.host
    } catch {
      // fallthrough
    }
  }

  // Strip accidental protocol prefix without requiring URL parsing.
  return trimmed.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

function decodeMaybeB64(pem: string | undefined, b64: string | undefined): string {
  if (pem) return pem
  if (!b64) return ''
  return Buffer.from(b64, 'base64').toString('utf8')
}

function parseScopes(scopeRaw: string | undefined): string[] {
  const scope = (scopeRaw ?? 'ACCOUNTS_BROADBAND').trim()
  if (!scope) return ['ACCOUNTS_BROADBAND']
  return scope
    .split(/[\s,]+/g)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function loadNordeaRestEnv(env: NodeJS.ProcessEnv = process.env): NordeaRestEnv {
  const parsed = schema.parse(env)

  const eidasPrivateKeyPem = decodeMaybeB64(
    parsed.NORDEA_REST_EIDAS_PRIVATE_KEY_PEM,
    parsed.NORDEA_REST_EIDAS_PRIVATE_KEY_PEM_B64,
  )

  return {
    ...parsed,
    NORDEA_REST_HOST: normalizeHost(parsed.NORDEA_REST_HOST),
    NORDEA_REST_ACCESS_DURATION_SEC: parsed.NORDEA_REST_ACCESS_DURATION_SEC ?? 129_600,
    NORDEA_REST_TIMEOUT_MS: parsed.NORDEA_REST_TIMEOUT_MS ?? 30_000,
    scopes: parseScopes(parsed.NORDEA_REST_SCOPE),
    eidasPrivateKeyPem,
  }
}
