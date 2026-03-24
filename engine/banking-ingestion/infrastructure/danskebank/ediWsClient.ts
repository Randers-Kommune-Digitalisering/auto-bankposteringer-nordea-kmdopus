import crypto from 'node:crypto'
import { DOMParser } from '@xmldom/xmldom'
import { z } from 'zod'

import { Agent } from 'undici'
import { SignedXml } from 'xml-crypto'

import {
  buildBxdDownloadFileApplicationRequestXml,
  buildBxdDownloadFileListApplicationRequestXml,
  parseBxdApplicationResponseXml,
} from '../bxd/secureEnvelope'
import {
  decryptEncryptedDataToXml,
  encryptXmlToEncryptedData,
} from '../bxd/xmlEnc'
import { verifyEnvelopedXmlDsig } from '../bxd/xmlDsig'

function firstText(doc: any, tagName: string): string | null {
  const nodes = doc.getElementsByTagName(tagName)
  const node = nodes?.item(0) ?? null
  const text = node?.textContent?.trim() ?? ''
  return text.length > 0 ? text : null
}

function generateEdiRequestId(): string {
  // Keep consistent with Danske PKIWS guidance: RequestId should be <= 10 chars.
  return crypto.randomBytes(5).toString('hex')
}

function looksLikeXmlEncEncryptedData(xml: string): boolean {
  return /<(?:\w+:)?EncryptedData\b/.test(xml)
}

function buildSoapSignature(options: {
  soapXml: string
  signingPrivateKeyPem: string
  signingCertificatePem: string
}): string {
  const signer = new SignedXml({
    privateKey: options.signingPrivateKeyPem,
    publicCert: options.signingCertificatePem,
    canonicalizationAlgorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#',
    signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
  })

  // Sign the SOAP 1.1 Body and place the signature in the SOAP Header.
  // Use an Id-based reference for maximum interoperability.
  signer.addReference({
    xpath:
      "//*[local-name()='Body' and namespace-uri()='http://schemas.xmlsoap.org/soap/envelope/']",
    uri: '#soap-body',
    digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
    transforms: ['http://www.w3.org/2001/10/xml-exc-c14n#'],
  })

  signer.computeSignature(options.soapXml, {
    location: {
      reference:
        "//*[local-name()='Header' and namespace-uri()='http://schemas.xmlsoap.org/soap/envelope/']",
      action: 'append',
    },
  } as any)

  return signer.getSignedXml()
}

function parseResponseHeaderOrNull(doc: any): { responseCode: string; responseText: string } | null {
  const headerNode = doc.getElementsByTagName('ResponseHeader')?.item(0) ?? null
  if (!headerNode) return null
  const responseCode = firstText(doc, 'ResponseCode')
  const responseText = firstText(doc, 'ResponseText')
  if (!responseCode || !responseText) return null
  return { responseCode, responseText }
}

async function postSoap(options: {
  endpointUrl: string
  xmlBody: string
  timeoutMs: number
  mtls?: { certPem: string; keyPem: string } | null
}): Promise<string> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), options.timeoutMs)
  try {
    const dispatcher = options.mtls
      ? new Agent({
          connect: {
            cert: options.mtls.certPem,
            key: options.mtls.keyPem,
          },
        })
      : undefined

    const res = await fetch(options.endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
      },
      body: options.xmlBody,
      signal: controller.signal,
      dispatcher: dispatcher as any,
    })
    const text = await res.text()
    if (!res.ok) {
      throw new Error(`EDIWS HTTP ${res.status} ${res.statusText}: ${text.slice(0, 500)}`)
    }
    return text
  } finally {
    clearTimeout(id)
  }
}

export const danskeEdiWsConfigSchema = z.object({
  endpointUrl: z.string().url().default('https://businessws.danskebank.com/financialservice/edifileservice.asmx'),

  // RequestHeader fields
  senderId: z.string().min(1),
  receiverId: z.string().min(1).default('Danske Bank'),
  userAgent: z.string().min(1),
  language: z.string().min(1).default('EN'),

  // ApplicationRequest fields
  customerId: z.string().min(1).max(16),
  signerId: z.string().min(1).max(80),
  softwareId: z.string().min(1).max(80),
  environment: z.enum(['TEST', 'PRODUCTION']).default('TEST'),

  // Our signing material
  applicationRequestPrivateKeyPem: z.string().min(1),
  applicationRequestCertificatePem: z.string().min(1),

  // Bank material (from PKI GetBankCertificate)
  bankEncryptionCertificatePem: z.string().min(1),
  bankSigningCertificatePem: z.string().min(1),
  trustedBankSigningCertFingerprintSha256Hex: z.string().length(64).optional(),

  // Optional mTLS (TLS-layer client cert)
  mtlsClientCertificatePem: z.string().min(1).optional(),
  mtlsClientPrivateKeyPem: z.string().min(1).optional(),

  timeoutMs: z.number().int().min(1).max(120_000).default(30_000),
})

export type DanskeEdiWsConfig = z.infer<typeof danskeEdiWsConfigSchema>

type DownloadFileListResult = {
  fileReferences: string[]
}

function buildSoapEnvelope(bodyInnerXml: string): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" ` +
    `xmlns:cor="http://bxd.fi/CorporateFileService" xmlns:mod="http://model.bxd.fi">` +
    `<soapenv:Header></soapenv:Header>` +
    `<soapenv:Body Id="soap-body">` +
    bodyInnerXml +
    `</soapenv:Body>` +
    `</soapenv:Envelope>`
  )
}

function base64EncodeUtf8(xml: string): string {
  return Buffer.from(xml, 'utf8').toString('base64')
}

function base64DecodeUtf8(b64: string): string {
  return Buffer.from(b64.replace(/\s+/g, ''), 'base64').toString('utf8')
}

async function buildEncryptedApplicationRequestBase64(options: {
  plaintextApplicationRequestXml: string
  bankEncryptionCertificatePem: string
}): Promise<string> {
  const encryptedData = await encryptXmlToEncryptedData(options.plaintextApplicationRequestXml, {
    recipientCertificatePem: options.bankEncryptionCertificatePem,
    encryptionAlgorithm: 'http://www.w3.org/2001/04/xmlenc#aes256-cbc',
    keyEncryptionAlgorithm: 'http://www.w3.org/2001/04/xmlenc#rsa-1_5',
    warnInsecureAlgorithm: false,
  })

  return base64EncodeUtf8(encryptedData)
}

async function decryptApplicationResponseBase64(options: {
  applicationResponseBase64: string
  privateKeyPem: string
}): Promise<string> {
  const encryptedDataXml = base64DecodeUtf8(options.applicationResponseBase64)
  return decryptEncryptedDataToXml(encryptedDataXml, {
    privateKeyPem: options.privateKeyPem,
    warnInsecureAlgorithm: false,
  })
}

export async function danskeEdiDownloadFileList(cfgInput: DanskeEdiWsConfig, input: {
  status: 'NEW' | 'DLD' | 'ALL'
  startDate?: Date
  endDate?: Date
  serviceId?: string
  fileType?: string
}): Promise<DownloadFileListResult> {
  const cfg = danskeEdiWsConfigSchema.parse(cfgInput)

  const plaintextApplicationRequestXml = buildBxdDownloadFileListApplicationRequestXml(
    {
      customerId: cfg.customerId,
      signerId: cfg.signerId,
      softwareId: cfg.softwareId,
      environment: cfg.environment,
      status: input.status,
      startDate: input.startDate,
      endDate: input.endDate,
      serviceId: input.serviceId,
      fileType: input.fileType,
      encryption: true,
      compressionMethod: 'gzip',
    } as any,
    {
      privateKeyPem: cfg.applicationRequestPrivateKeyPem,
      certificatePem: cfg.applicationRequestCertificatePem,
    },
  )

  const applicationRequestB64 = await buildEncryptedApplicationRequestBase64({
    plaintextApplicationRequestXml,
    bankEncryptionCertificatePem: cfg.bankEncryptionCertificatePem,
  })

  const requestId = generateEdiRequestId()
  const timestamp = new Date().toISOString()

  const body =
    `<cor:downloadFileListin>` +
    `<mod:RequestHeader>` +
    `<mod:SenderId>${cfg.senderId}</mod:SenderId>` +
    `<mod:RequestId>${requestId}</mod:RequestId>` +
    `<mod:Timestamp>${timestamp}</mod:Timestamp>` +
    `<mod:Language>${cfg.language}</mod:Language>` +
    `<mod:UserAgent>${cfg.userAgent}</mod:UserAgent>` +
    `<mod:ReceiverId>${cfg.receiverId}</mod:ReceiverId>` +
    `</mod:RequestHeader>` +
    `<mod:ApplicationRequest>${applicationRequestB64}</mod:ApplicationRequest>` +
    `</cor:downloadFileListin>`

  const unsignedSoap = buildSoapEnvelope(body)
  const signedSoap = buildSoapSignature({
    soapXml: unsignedSoap,
    signingPrivateKeyPem: cfg.applicationRequestPrivateKeyPem,
    signingCertificatePem: cfg.applicationRequestCertificatePem,
  })

  const responseXml = await postSoap({
    endpointUrl: cfg.endpointUrl,
    xmlBody: signedSoap,
    timeoutMs: cfg.timeoutMs,
    mtls:
      cfg.mtlsClientCertificatePem && cfg.mtlsClientPrivateKeyPem
        ? { certPem: cfg.mtlsClientCertificatePem, keyPem: cfg.mtlsClientPrivateKeyPem }
        : null,
  })

  const soapDoc = new DOMParser().parseFromString(responseXml, 'application/xml')

  const responseHeader = parseResponseHeaderOrNull(soapDoc)
  if (responseHeader && responseHeader.responseCode !== '00') {
    throw new Error(`EDIWS downloadFileList: ResponseHeader ${responseHeader.responseCode} ${responseHeader.responseText}`)
  }

  const appRespB64 = firstText(soapDoc, 'ApplicationResponse')
  if (!appRespB64) {
    throw new Error('EDIWS downloadFileList: missing ApplicationResponse')
  }

  const decodedAppRespXml = base64DecodeUtf8(appRespB64)
  const decrypted = looksLikeXmlEncEncryptedData(decodedAppRespXml)
    ? await decryptEncryptedDataToXml(decodedAppRespXml, {
        privateKeyPem: cfg.applicationRequestPrivateKeyPem,
        warnInsecureAlgorithm: false,
      })
    : decodedAppRespXml

  // Verify bank signature inside decrypted ApplicationResponse (recommended).
  const verify = verifyEnvelopedXmlDsig({
    xml: decrypted,
    trustedCertificateFingerprintSha256Hex: cfg.trustedBankSigningCertFingerprintSha256Hex,
    verificationCertificatePem: cfg.bankSigningCertificatePem,
  })
  if (cfg.trustedBankSigningCertFingerprintSha256Hex && !verify.isSignatureValid) {
    throw new Error('EDIWS downloadFileList: ApplicationResponse signature verification failed')
  }

  const parsed = parseBxdApplicationResponseXml(decrypted, {
    allowUnpinnedCertificate: !cfg.trustedBankSigningCertFingerprintSha256Hex,
    trustedCertificateFingerprintSha256Hex: cfg.trustedBankSigningCertFingerprintSha256Hex,
  })

  // Extract file references from decrypted XML using DOM.
  const doc = new DOMParser().parseFromString(decrypted, 'application/xml')
  const refs = Array.from(doc.getElementsByTagName('FileReference')).map((n: any) => String(n?.textContent ?? '').trim()).filter(Boolean)
  // The response also includes ServiceIdOwnerName etc; ignore for now.

  if (parsed.responseCode !== '0' && parsed.responseCode !== '00' && parsed.responseCode !== '000') {
    // Bank response codes vary by service; include text.
    throw new Error(`EDIWS downloadFileList: bank response ${parsed.responseCode} ${parsed.responseText}`)
  }

  return { fileReferences: refs }
}

export async function danskeEdiDownloadFile(cfgInput: DanskeEdiWsConfig, input: {
  fileReference: string
  requestCompressed?: boolean
  serviceId?: string
  fileType?: string
}): Promise<Buffer> {
  const cfg = danskeEdiWsConfigSchema.parse(cfgInput)

  const plaintextApplicationRequestXml = buildBxdDownloadFileApplicationRequestXml(
    {
      customerId: cfg.customerId,
      signerId: cfg.signerId,
      softwareId: cfg.softwareId,
      environment: cfg.environment,
      fileReferences: [input.fileReference],
      requestCompressed: input.requestCompressed ?? true,
      compressionMethod: 'gzip',
      serviceId: input.serviceId,
      fileType: input.fileType,
      encryption: true,
    } as any,
    {
      privateKeyPem: cfg.applicationRequestPrivateKeyPem,
      certificatePem: cfg.applicationRequestCertificatePem,
    },
  )

  const applicationRequestB64 = await buildEncryptedApplicationRequestBase64({
    plaintextApplicationRequestXml,
    bankEncryptionCertificatePem: cfg.bankEncryptionCertificatePem,
  })

  const requestId = generateEdiRequestId()
  const timestamp = new Date().toISOString()

  const body =
    `<cor:downloadFilein>` +
    `<mod:RequestHeader>` +
    `<mod:SenderId>${cfg.senderId}</mod:SenderId>` +
    `<mod:RequestId>${requestId}</mod:RequestId>` +
    `<mod:Timestamp>${timestamp}</mod:Timestamp>` +
    `<mod:Language>${cfg.language}</mod:Language>` +
    `<mod:UserAgent>${cfg.userAgent}</mod:UserAgent>` +
    `<mod:ReceiverId>${cfg.receiverId}</mod:ReceiverId>` +
    `</mod:RequestHeader>` +
    `<mod:ApplicationRequest>${applicationRequestB64}</mod:ApplicationRequest>` +
    `</cor:downloadFilein>`

  const unsignedSoap = buildSoapEnvelope(body)
  const signedSoap = buildSoapSignature({
    soapXml: unsignedSoap,
    signingPrivateKeyPem: cfg.applicationRequestPrivateKeyPem,
    signingCertificatePem: cfg.applicationRequestCertificatePem,
  })

  const responseXml = await postSoap({
    endpointUrl: cfg.endpointUrl,
    xmlBody: signedSoap,
    timeoutMs: cfg.timeoutMs,
    mtls:
      cfg.mtlsClientCertificatePem && cfg.mtlsClientPrivateKeyPem
        ? { certPem: cfg.mtlsClientCertificatePem, keyPem: cfg.mtlsClientPrivateKeyPem }
        : null,
  })

  const soapDoc = new DOMParser().parseFromString(responseXml, 'application/xml')

  const responseHeader = parseResponseHeaderOrNull(soapDoc)
  if (responseHeader && responseHeader.responseCode !== '00') {
    throw new Error(`EDIWS downloadFile: ResponseHeader ${responseHeader.responseCode} ${responseHeader.responseText}`)
  }

  const appRespB64 = firstText(soapDoc, 'ApplicationResponse')
  if (!appRespB64) {
    throw new Error('EDIWS downloadFile: missing ApplicationResponse')
  }

  const decodedAppRespXml = base64DecodeUtf8(appRespB64)
  const decrypted = looksLikeXmlEncEncryptedData(decodedAppRespXml)
    ? await decryptEncryptedDataToXml(decodedAppRespXml, {
        privateKeyPem: cfg.applicationRequestPrivateKeyPem,
        warnInsecureAlgorithm: false,
      })
    : decodedAppRespXml

  const parsed = parseBxdApplicationResponseXml(decrypted, {
    allowUnpinnedCertificate: !cfg.trustedBankSigningCertFingerprintSha256Hex,
    trustedCertificateFingerprintSha256Hex: cfg.trustedBankSigningCertFingerprintSha256Hex,
  })

  if (parsed.responseCode !== '0' && parsed.responseCode !== '00' && parsed.responseCode !== '000') {
    throw new Error(`EDIWS downloadFile: bank response ${parsed.responseCode} ${parsed.responseText}`)
  }

  if (!parsed.content) {
    throw new Error('EDIWS downloadFile: missing content in ApplicationResponse')
  }

  return parsed.content
}
