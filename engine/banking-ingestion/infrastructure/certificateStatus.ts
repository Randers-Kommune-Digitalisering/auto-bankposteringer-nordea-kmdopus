import crypto from 'node:crypto'

export type CertificateStatus =
  | { status: 'missing'; message: string }
  | { status: 'invalid'; message: string }
  | {
      status: 'ok' | 'expires_soon' | 'expired'
      expiresAt: string
      daysRemaining: number
      subject?: string
      issuer?: string
      serialHex?: string
      fingerprintSha256Hex?: string
    }

export function getCertificateStatusFromPem(options: {
  certificatePem: string | null | undefined
  now?: Date
  expiresSoonDays?: number
}): CertificateStatus {
  const now = options.now ?? new Date()
  const expiresSoonDays = options.expiresSoonDays ?? 7

  const pem = (options.certificatePem ?? '').trim()
  if (!pem) return { status: 'missing', message: 'Certifikat mangler' }

  try {
    const x509 = new crypto.X509Certificate(pem)
    const expiresAt = new Date(x509.validTo)

    if (Number.isNaN(expiresAt.getTime())) {
      return { status: 'invalid', message: 'Kan ikke læse certifikatets udløbsdato' }
    }

    const msRemaining = expiresAt.getTime() - now.getTime()
    const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000))

    const fingerprintSha256Hex = crypto.createHash('sha256').update(x509.raw).digest('hex')

    if (daysRemaining < 0) {
      return {
        status: 'expired',
        expiresAt: expiresAt.toISOString(),
        daysRemaining,
        subject: x509.subject,
        issuer: x509.issuer,
        serialHex: x509.serialNumber,
        fingerprintSha256Hex,
      }
    }

    if (daysRemaining <= expiresSoonDays) {
      return {
        status: 'expires_soon',
        expiresAt: expiresAt.toISOString(),
        daysRemaining,
        subject: x509.subject,
        issuer: x509.issuer,
        serialHex: x509.serialNumber,
        fingerprintSha256Hex,
      }
    }

    return {
      status: 'ok',
      expiresAt: expiresAt.toISOString(),
      daysRemaining,
      subject: x509.subject,
      issuer: x509.issuer,
      serialHex: x509.serialNumber,
      fingerprintSha256Hex,
    }
  } catch (e) {
    return { status: 'invalid', message: String((e as any)?.message ?? e) }
  }
}
