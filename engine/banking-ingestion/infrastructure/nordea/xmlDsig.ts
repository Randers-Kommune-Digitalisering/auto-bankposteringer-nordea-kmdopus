import crypto from 'node:crypto'
import { DOMParser } from '@xmldom/xmldom'
import { SignedXml } from 'xml-crypto'

export type XmlDsigAlgorithms = {
  canonicalizationAlgorithm: string
  signatureAlgorithm: string
  digestAlgorithm: string
}

export const defaultXmlDsigAlgorithms: XmlDsigAlgorithms = {
  // Exclusive XML Canonicalization 1.0
  canonicalizationAlgorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#',

  // RSA with SHA-256 (xmldsig-more)
  signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',

  // SHA-256 digest (xmlenc)
  digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
}

function normalizePem(pem: string): string {
  return pem.trim().endsWith('\n') ? pem.trim() + '\n' : pem.trim() + '\n'
}

function certPemToDer(certPem: string): Buffer {
  const normalized = normalizePem(certPem)
  const base64 = normalized
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s+/g, '')
  return Buffer.from(base64, 'base64')
}

export function sha256FingerprintHexFromCertPem(certPem: string): string {
  const der = certPemToDer(certPem)
  return crypto.createHash('sha256').update(der).digest('hex')
}

export type SignXmlInput = {
  xml: string
  privateKeyPem: string
  certificatePem: string
  algorithms?: Partial<XmlDsigAlgorithms>
}

export function signEnvelopedXmlDsig(input: SignXmlInput): string {
  const algorithms = { ...defaultXmlDsigAlgorithms, ...(input.algorithms ?? {}) }

  const signer = new SignedXml({
    privateKey: normalizePem(input.privateKeyPem),
    publicCert: normalizePem(input.certificatePem),
    canonicalizationAlgorithm: algorithms.canonicalizationAlgorithm,
    signatureAlgorithm: algorithms.signatureAlgorithm,
  })

  signer.addReference({
    xpath: '/*',
    digestAlgorithm: algorithms.digestAlgorithm,
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      algorithms.canonicalizationAlgorithm,
    ],
  })

  signer.computeSignature(input.xml)

  return signer.getSignedXml()
}

export type VerifyXmlInput = {
  xml: string
  /**
   * If set, require that the embedded X509Certificate matches this SHA-256 fingerprint.
   * (This is the minimal form of trust-pinning; do not rely on the embedded cert alone.)
   */
  trustedCertificateFingerprintSha256Hex?: string
  /**
   * If set, use this key/cert for signature verification.
   * If omitted, we try to verify using the embedded X509Certificate.
   */
  verificationCertificatePem?: string
}

export type VerifyXmlOutput = {
  isSignatureValid: boolean
  embeddedCertificateFingerprintSha256Hex: string | null
}

function extractEmbeddedX509CertificateBase64(xml: string): string | null {
  // Conservative extraction via DOM; avoids regex pitfalls.
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const nodes = doc.getElementsByTagName('X509Certificate')
  const node = nodes?.item(0) ?? null
  const text = node?.textContent?.replace(/\s+/g, '') ?? ''
  return text.length > 0 ? text : null
}

function base64DerToFingerprintHex(certBase64Der: string): string {
  const der = Buffer.from(certBase64Der, 'base64')
  return crypto.createHash('sha256').update(der).digest('hex')
}

export function verifyEnvelopedXmlDsig(input: VerifyXmlInput): VerifyXmlOutput {
  const doc = new DOMParser().parseFromString(input.xml, 'application/xml')
  const signatureNodes = doc.getElementsByTagNameNS(
    'http://www.w3.org/2000/09/xmldsig#',
    'Signature',
  )

  const signatureNode = signatureNodes?.item(0) ?? null
  if (!signatureNode) {
    return { isSignatureValid: false, embeddedCertificateFingerprintSha256Hex: null }
  }

  const embeddedCertBase64 = extractEmbeddedX509CertificateBase64(input.xml)
  const embeddedFingerprint = embeddedCertBase64
    ? base64DerToFingerprintHex(embeddedCertBase64)
    : null

  if (input.trustedCertificateFingerprintSha256Hex && embeddedFingerprint) {
    if (
      embeddedFingerprint.toLowerCase() !==
      input.trustedCertificateFingerprintSha256Hex.toLowerCase()
    ) {
      return {
        isSignatureValid: false,
        embeddedCertificateFingerprintSha256Hex: embeddedFingerprint,
      }
    }
  }

  const verifier = new SignedXml({
    // Required if we want to verify using KeyInfo's embedded X509Certificate.
    getCertFromKeyInfo: SignedXml.getCertFromKeyInfo,
  })
  verifier.loadSignature(signatureNode)

  if (input.verificationCertificatePem) {
    verifier.publicCert = normalizePem(input.verificationCertificatePem) as any
  }

  const ok = verifier.checkSignature(input.xml)

  return { isSignatureValid: ok, embeddedCertificateFingerprintSha256Hex: embeddedFingerprint }
}
