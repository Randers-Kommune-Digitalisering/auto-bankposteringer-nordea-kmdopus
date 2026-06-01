import crypto from 'node:crypto'
import { DOMParser } from '@xmldom/xmldom'
import { SignedXml } from 'xml-crypto'

type WsseTimestamp = { created: Date; expires: Date }

function normalizePem(pem: string): string {
  return pem.trim().endsWith('\n') ? pem.trim() + '\n' : pem.trim() + '\n'
}

function certPemToDerBase64(certPem: string): string {
  const normalized = normalizePem(certPem)
  const base64 = normalized
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s+/g, '')
  // Base64 DER, not PEM.
  return base64
}

function buildTimestampXml(ts: WsseTimestamp): string {
  return (
    `<wsu:Timestamp wsu:Id="TS-${crypto.randomUUID()}">` +
    `<wsu:Created>${ts.created.toISOString()}</wsu:Created>` +
    `<wsu:Expires>${ts.expires.toISOString()}</wsu:Expires>` +
    `</wsu:Timestamp>`
  )
}

class WsseKeyInfoProvider {
  constructor(private readonly certificateDerBase64: string) {}

  getKeyInfo(): string {
    return (
      `<wsse:SecurityTokenReference>` +
      `<wsse:KeyIdentifier ` +
      `EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ` +
      `ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3">` +
      `${this.certificateDerBase64}` +
      `</wsse:KeyIdentifier>` +
      `</wsse:SecurityTokenReference>`
    )
  }

  getKey(): any {
    return null
  }
}

export function buildSignedSoapEnvelope(options: {
  bodyInnerXml: string
  signingPrivateKeyPem: string
  signingCertificatePem: string
  timestamp?: WsseTimestamp
}): string {
  const created = options.timestamp?.created ?? new Date()
  const expires = options.timestamp?.expires ?? new Date(created.getTime() + 5 * 60 * 1000)
  const tokenId = `X509-${crypto.randomUUID()}`

  const unsignedSoap =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soapenv:Envelope ` +
    `xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" ` +
    `xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" ` +
    `xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" ` +
    `xmlns:cor="http://bxd.fi/CorporateFileService" ` +
    `xmlns:mod="http://model.bxd.fi">` +
    `<soapenv:Header>` +
    `<wsse:Security soapenv:mustUnderstand="1">` +
    buildTimestampXml({ created, expires }) +
    `<wsse:BinarySecurityToken ` +
    `wsu:Id="${tokenId}" ` +
    `EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ` +
    `ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3">` +
    `${certPemToDerBase64(options.signingCertificatePem)}` +
    `</wsse:BinarySecurityToken>` +
    `</wsse:Security>` +
    `</soapenv:Header>` +
    `<soapenv:Body wsu:Id="soap-body">` +
    options.bodyInnerXml +
    `</soapenv:Body>` +
    `</soapenv:Envelope>`

  const signer = new SignedXml({
    privateKey: normalizePem(options.signingPrivateKeyPem),
    signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
    canonicalizationAlgorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#',
    getKeyInfoContent: () => new WsseKeyInfoProvider(certPemToDerBase64(options.signingCertificatePem)).getKeyInfo(),
  })

  signer.addReference({
    xpath: "//*[local-name()='Body' and namespace-uri()='http://schemas.xmlsoap.org/soap/envelope/']",
    uri: '#soap-body',
    digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
    transforms: ['http://www.w3.org/2001/10/xml-exc-c14n#'],
  })

  signer.computeSignature(unsignedSoap, {
    location: {
      reference:
        "//*[local-name()='Security' and namespace-uri()='http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd']",
      action: 'append',
    },
  } as any)

  return signer.getSignedXml()
}

export function verifySoapSignatureOrThrow(options: {
  soapXml: string
  trustedCertificateFingerprintSha256Hex?: string
}): void {
  const doc = new DOMParser().parseFromString(options.soapXml, 'application/xml')
  const sigNodes = doc.getElementsByTagNameNS('http://www.w3.org/2000/09/xmldsig#', 'Signature')
  const sigNode = sigNodes?.item(0) ?? null
  if (!sigNode) {
    throw new Error('SOAP signature missing')
  }

  const tokenNode = doc.getElementsByTagNameNS(
    'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd',
    'BinarySecurityToken',
  )?.item(0) ?? null

  const tokenDerBase64 = String(tokenNode?.textContent ?? '').replace(/\s+/g, '')
  const tokenPem = tokenDerBase64
    ? `-----BEGIN CERTIFICATE-----\n${tokenDerBase64.match(/.{1,64}/g)?.join('\n') ?? tokenDerBase64}\n-----END CERTIFICATE-----\n`
    : null

  const verifier = new SignedXml({
    getCertFromKeyInfo: SignedXml.getCertFromKeyInfo,
  })
  verifier.loadSignature(sigNode)

  if (tokenPem) {
    verifier.publicCert = tokenPem as any
  }

  const ok = verifier.checkSignature(options.soapXml)
  if (!ok) {
    throw new Error('SOAP signature verification failed')
  }

  if (options.trustedCertificateFingerprintSha256Hex) {
    const derBase64 = tokenDerBase64 || String(doc.getElementsByTagName('X509Certificate')?.item(0)?.textContent ?? '').replace(/\s+/g, '')
    if (!derBase64) throw new Error('SOAP signature missing certificate material for pinning')
    const der = Buffer.from(derBase64, 'base64')
    const fp = crypto.createHash('sha256').update(der).digest('hex')
    if (fp.toLowerCase() !== options.trustedCertificateFingerprintSha256Hex.toLowerCase()) {
      throw new Error(`SOAP signing certificate fingerprint mismatch (got ${fp})`)
    }
  }
}
