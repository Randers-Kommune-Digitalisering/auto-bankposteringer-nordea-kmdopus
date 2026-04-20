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

type CacheEntry = { signature: string; value: NordeaRestEnv }
let cache: CacheEntry | null = null

function expandPlaceholder(value: string | undefined, env: NodeJS.ProcessEnv): string | undefined {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  const m = /^\$\{([A-Z0-9_]+)\}$/.exec(trimmed)
  if (!m) return value
  const key = m[1]!
  return env[key] ?? value
}

function withExpandedPlaceholders(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  // Only expand the exact "${VAR}" form to avoid surprising partial interpolation.
  const out: NodeJS.ProcessEnv = { ...env }
  const keysToExpand = [
    'NORDEA_REST_HOST',
    'NORDEA_REST_CLIENT_ID',
    'NORDEA_REST_CLIENT_SECRET',
    'NORDEA_REST_AGREEMENT_NUMBER',
    'NORDEA_REST_AUTHORIZER_ID',
    'NORDEA_REST_SCOPE',
    'NORDEA_REST_ACCESS_DURATION_SEC',
    'NORDEA_REST_TIMEOUT_MS',
    'NORDEA_REST_EIDAS_PRIVATE_KEY_PEM',
    'NORDEA_REST_EIDAS_PRIVATE_KEY_PEM_B64',
  ] as const

  for (const k of keysToExpand) {
    out[k] = expandPlaceholder(env[k], env)
  }

  return out
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

function normalizePem(pem: string): string {
  const trimmed = pem.trim()
  if (!trimmed) return ''

  // Common when secrets are stored as one line with literal \n.
  const withNewlines = trimmed.includes('\\n') ? trimmed.replace(/\\n/g, '\n') : trimmed
  // Normalize CRLF.
  return withNewlines.replace(/\r\n/g, '\n').trim() + '\n'
}

function looksLikeBase64(value: string): boolean {
  const compact = value.replace(/\s+/g, '')
  if (compact.length < 64) return false
  // Conservative: only base64 chars.
  return /^[A-Za-z0-9+/=]+$/.test(compact)
}

function maybeDecodePemFromBase64(raw: string): string {
  if (!looksLikeBase64(raw)) return ''
  try {
    const decoded = Buffer.from(raw.replace(/\s+/g, ''), 'base64').toString('utf8')
    const normalized = normalizePem(decoded)
    if (normalized.includes('BEGIN') && normalized.includes('PRIVATE KEY')) return normalized
    return ''
  } catch {
    return ''
  }
}

function wrapPkcs8PemFromBase64Der(base64Der: string): string {
  const t = base64Der.replace(/\s+/g, '')
  const lines: string[] = []
  for (let i = 0; i < t.length; i += 64) {
    lines.push(t.slice(i, i + 64))
  }
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`
}

function parseScopes(scopeRaw: string | undefined): string[] {
  const scope = (scopeRaw ?? 'ACCOUNTS_BROADBAND').trim()
  if (!scope) return ['ACCOUNTS_BROADBAND']
  return scope
    .split(/[\s,]+/g)
    .map((s) => s.trim())
    .filter(Boolean)
}

function signatureFromEnv(env: NodeJS.ProcessEnv): string {
  const keys = [
    'NORDEA_REST_HOST',
    'NORDEA_REST_CLIENT_ID',
    'NORDEA_REST_CLIENT_SECRET',
    'NORDEA_REST_AGREEMENT_NUMBER',
    'NORDEA_REST_AUTHORIZER_ID',
    'NORDEA_REST_SCOPE',
    'NORDEA_REST_ACCESS_DURATION_SEC',
    'NORDEA_REST_TIMEOUT_MS',
    'NORDEA_REST_EIDAS_PRIVATE_KEY_PEM',
    'NORDEA_REST_EIDAS_PRIVATE_KEY_PEM_B64',
  ]
  return keys.map((k) => `${k}=${String(env[k] ?? '')}`).join('\n')
}

function loadNordeaRestEnvUncached(env: NodeJS.ProcessEnv): NordeaRestEnv {
  const expanded = withExpandedPlaceholders(env)
  const parsed = schema.parse(expanded)

  // If placeholders are still present, the backing env var was not set.
  const placeholder = /^\$\{([A-Z0-9_]+)\}$/.exec((parsed.NORDEA_REST_EIDAS_PRIVATE_KEY_PEM ?? '').trim())
  if (placeholder) {
    throw new Error(
      `NORDEA_REST_EIDAS_PRIVATE_KEY_PEM points to placeholder ${placeholder[0]}, but ${placeholder[1]} is not set in the environment. ` +
        'Either export that env var before running, or set NORDEA_REST_EIDAS_PRIVATE_KEY_PEM_B64 directly.',
    )
  }

  const eidasPrivateKeyPemRaw = decodeMaybeB64(
    parsed.NORDEA_REST_EIDAS_PRIVATE_KEY_PEM,
    parsed.NORDEA_REST_EIDAS_PRIVATE_KEY_PEM_B64,
  )

  let eidasPrivateKeyPem = normalizePem(eidasPrivateKeyPemRaw)
  if (!eidasPrivateKeyPem.includes('BEGIN') || !eidasPrivateKeyPem.includes('PRIVATE KEY')) {
    const decoded = maybeDecodePemFromBase64(eidasPrivateKeyPemRaw)
    if (decoded) eidasPrivateKeyPem = decoded
  }

  // If the value is raw base64 DER (common form starting with e.g. "MIIE..."), wrap it into a PKCS#8 PEM.
  if (!eidasPrivateKeyPem.includes('BEGIN') || !eidasPrivateKeyPem.includes('PRIVATE KEY')) {
    if (looksLikeBase64(eidasPrivateKeyPemRaw)) {
      eidasPrivateKeyPem = normalizePem(wrapPkcs8PemFromBase64Der(eidasPrivateKeyPemRaw))
    }
  }

  if (!eidasPrivateKeyPem.includes('BEGIN') || !eidasPrivateKeyPem.includes('PRIVATE KEY')) {
    const preview = (eidasPrivateKeyPemRaw ?? '').trim().slice(0, 32)
    throw new Error(
      'NORDEA_REST_EIDAS_PRIVATE_KEY_PEM(_B64) does not look like a PEM private key. ' +
        'Ensure it is an unencrypted PEM and that newline characters are preserved (or provide *_B64). ' +
        `Value preview="${preview}"`,
    )
  }

  return {
    ...parsed,
    NORDEA_REST_HOST: normalizeHost(parsed.NORDEA_REST_HOST),
    NORDEA_REST_ACCESS_DURATION_SEC: parsed.NORDEA_REST_ACCESS_DURATION_SEC ?? 129_600,
    NORDEA_REST_TIMEOUT_MS: parsed.NORDEA_REST_TIMEOUT_MS ?? 30_000,
    scopes: parseScopes(parsed.NORDEA_REST_SCOPE),
    eidasPrivateKeyPem,
  }
}

export function loadNordeaRestEnv(env: NodeJS.ProcessEnv = process.env): NordeaRestEnv {
  // Only cache the common case (process.env) to avoid surprising behavior when
  // callers pass in custom env objects.
  if (env === process.env) {
    const signature = signatureFromEnv(env)
    if (cache?.signature === signature) return cache.value
    const value = loadNordeaRestEnvUncached(env)
    cache = { signature, value }
    return value
  }

  return loadNordeaRestEnvUncached(env)
}
