import { z } from 'zod'

/**
 * Minimal env-based secret loading for Danske Bank Web Services.
 *
 * Keep secrets out of DB to preserve statelessness.
 */

const schema = z
  .object({
    // Signing material used for message-level security (XMLDSig / XMLENC).
    DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM: z.string().min(1).optional(),
    DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM: z.string().min(1).optional(),

    DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM_B64: z.string().min(1).optional(),
    DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM_B64: z.string().min(1).optional(),

    /** Optional pinning for Danske's signing certificate (SHA-256 fingerprint hex, lowercase/uppercase ok). */
    DANSKE_BANK_TRUSTED_SIGNING_CERT_SHA256: z.string().length(64).optional(),

    // Optional: separate mTLS client certificate/key (if the TLS layer uses distinct credentials).
    DANSKE_BANK_MTLS_CLIENT_PRIVATE_KEY_PEM: z.string().min(1).optional(),
    DANSKE_BANK_MTLS_CLIENT_CERTIFICATE_PEM: z.string().min(1).optional(),

    DANSKE_BANK_MTLS_CLIENT_PRIVATE_KEY_PEM_B64: z.string().min(1).optional(),
    DANSKE_BANK_MTLS_CLIENT_CERTIFICATE_PEM_B64: z.string().min(1).optional(),
  })
  .superRefine((val, ctx) => {
    const hasKey = Boolean(
      val.DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM ||
        val.DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM_B64,
    )
    const hasCert = Boolean(
      val.DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM ||
        val.DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM_B64,
    )
    if (!hasKey) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Missing Danske Bank private key: set DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM or DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM_B64',
      })
    }
    if (!hasCert) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Missing Danske Bank certificate: set DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM or DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM_B64',
      })
    }
  })

export type DanskeBankEnvSecrets = z.infer<typeof schema>

type CacheEntry = {
  signature: string
  value: {
    applicationRequestPrivateKeyPem: string
    applicationRequestCertificatePem: string
    trustedSigningCertificateFingerprintSha256Hex?: string
    mtlsClientPrivateKeyPem?: string
    mtlsClientCertificatePem?: string
  }
}

let cache: CacheEntry | null = null

function signatureFromEnv(env: NodeJS.ProcessEnv): string {
  const keys = [
    'DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM',
    'DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM',
    'DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM_B64',
    'DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM_B64',
    'DANSKE_BANK_TRUSTED_SIGNING_CERT_SHA256',
    'DANSKE_BANK_MTLS_CLIENT_PRIVATE_KEY_PEM',
    'DANSKE_BANK_MTLS_CLIENT_CERTIFICATE_PEM',
    'DANSKE_BANK_MTLS_CLIENT_PRIVATE_KEY_PEM_B64',
    'DANSKE_BANK_MTLS_CLIENT_CERTIFICATE_PEM_B64',
  ]
  return keys.map((k) => `${k}=${String(env[k] ?? '')}`).join('\n')
}

export function loadDanskeBankEnvSecrets(
  env: NodeJS.ProcessEnv = process.env,
): {
  applicationRequestPrivateKeyPem: string
  applicationRequestCertificatePem: string
  trustedSigningCertificateFingerprintSha256Hex?: string
  mtlsClientPrivateKeyPem?: string
  mtlsClientCertificatePem?: string
} {
  if (env === process.env) {
    const signature = signatureFromEnv(env)
    if (cache?.signature === signature) return cache.value
    const value = loadDanskeBankEnvSecretsUncached(env)
    cache = { signature, value }
    return value
  }

  return loadDanskeBankEnvSecretsUncached(env)
}

function loadDanskeBankEnvSecretsUncached(env: NodeJS.ProcessEnv) {
  const parsed = schema.parse(env)

  const decodeMaybeB64 = (pem: string | undefined, b64: string | undefined): string => {
    if (pem) return pem
    if (!b64) return ''
    return Buffer.from(b64, 'base64').toString('utf8')
  }

  const applicationRequestPrivateKeyPem = decodeMaybeB64(
    parsed.DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM,
    parsed.DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM_B64,
  )
  const applicationRequestCertificatePem = decodeMaybeB64(
    parsed.DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM,
    parsed.DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM_B64,
  )

  const mtlsClientPrivateKeyPemRaw = decodeMaybeB64(
    parsed.DANSKE_BANK_MTLS_CLIENT_PRIVATE_KEY_PEM,
    parsed.DANSKE_BANK_MTLS_CLIENT_PRIVATE_KEY_PEM_B64,
  )
  const mtlsClientCertificatePemRaw = decodeMaybeB64(
    parsed.DANSKE_BANK_MTLS_CLIENT_CERTIFICATE_PEM,
    parsed.DANSKE_BANK_MTLS_CLIENT_CERTIFICATE_PEM_B64,
  )

  return {
    applicationRequestPrivateKeyPem,
    applicationRequestCertificatePem,
    trustedSigningCertificateFingerprintSha256Hex: parsed.DANSKE_BANK_TRUSTED_SIGNING_CERT_SHA256,
    mtlsClientPrivateKeyPem: mtlsClientPrivateKeyPemRaw || undefined,
    mtlsClientCertificatePem: mtlsClientCertificatePemRaw || undefined,
  }
}
