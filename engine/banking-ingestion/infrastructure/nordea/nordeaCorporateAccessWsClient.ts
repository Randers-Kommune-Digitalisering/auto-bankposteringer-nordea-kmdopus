import crypto from 'node:crypto'
import { DOMParser } from '@xmldom/xmldom'
import { z } from 'zod'
import { Agent } from 'undici'

import {
  buildNordeaDownloadFileApplicationRequestXml,
  buildNordeaDownloadFileListApplicationRequestXml,
  parseNordeaApplicationResponseXml,
} from './secureEnvelope'
import { buildSignedSoapEnvelope, verifySoapSignatureOrThrow } from './nordeaWsSecurity'

function base64EncodeUtf8(xml: string): string {
  return Buffer.from(xml, 'utf8').toString('base64')
}

function base64DecodeUtf8(b64: string): string {
  return Buffer.from(String(b64).replace(/\s+/g, ''), 'base64').toString('utf8')
}

function firstElementByLocalName(doc: any, localName: string): any | null {
  const all = doc.getElementsByTagName('*')
  for (let i = 0; i < all.length; i++) {
    const n = all.item(i)
    const ln = String((n as any)?.localName ?? '').trim()
    const nn = String((n as any)?.nodeName ?? '').trim()
    if (ln === localName) return n
    if (!ln && nn.endsWith(`:${localName}`)) return n
    if (!ln && nn === localName) return n
  }
  return null
}

function firstTextByLocalName(doc: any, localName: string): string | null {
  const node = firstElementByLocalName(doc, localName)
  const text = node?.textContent?.trim() ?? ''
  return text.length ? text : null
}

function generateRequestId(): string {
  // Must be unique for 3 months per Nordea docs. Random 16 bytes is fine.
  return crypto.randomBytes(16).toString('hex')
}

async function postSoap(options: {
  endpointUrl: string
  soapXml: string
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
      body: options.soapXml,
      signal: controller.signal,
      dispatcher: dispatcher as any,
    })

    const text = await res.text()
    if (!res.ok) {
      throw new Error(`Nordea CorporateFileService HTTP ${res.status} ${res.statusText}: ${text.slice(0, 500)}`)
    }
    return text
  } finally {
    clearTimeout(id)
  }
}

export const nordeaCorporateAccessWsClientConfigSchema = z.object({
  endpointUrl: z.string().url().default('https://ws.ebridge.prod.nordea.com/ws/CorporateFileService'),

  senderId: z.string().min(1),
  receiverId: z.string().min(1),
  userAgent: z.string().min(1),
  language: z.string().min(1).default('EN'),

  customerId: z.string().min(1).max(16),
  signerId: z.string().min(1).max(80),
  softwareId: z.string().min(1).max(80),
  environment: z.enum(['PRODUCTION', 'TEST']).default('PRODUCTION'),

  signingPrivateKeyPem: z.string().min(1),
  signingCertificatePem: z.string().min(1),

  /** Optional pinning for SOAP signature cert on responses (recommended in production). */
  trustedSoapSigningCertFingerprintSha256Hex: z.string().length(64).optional(),

  /** Optional pinning for Secure Envelope signature cert on ApplicationResponse. */
  trustedApplicationResponseCertFingerprintSha256Hex: z.string().length(64).optional(),

  /** Optional mTLS (often required by Nordea). */
  mtlsClientCertificatePem: z.string().min(1).optional(),
  mtlsClientPrivateKeyPem: z.string().min(1).optional(),

  timeoutMs: z.number().int().min(1).max(120_000).default(30_000),
})

export type NordeaCorporateAccessWsClientConfig = z.infer<typeof nordeaCorporateAccessWsClientConfigSchema>

export type NordeaFileDescriptor = {
  fileReference: string
  fileType: string | null
  serviceId: string | null
  timestamp: Date | null
}

function buildRequestHeaderXml(cfg: NordeaCorporateAccessWsClientConfig, requestId: string, timestampIso: string): string {
  return (
    `<mod:RequestHeader>` +
    `<mod:SenderId>${cfg.senderId}</mod:SenderId>` +
    `<mod:RequestId>${requestId}</mod:RequestId>` +
    `<mod:Timestamp>${timestampIso}</mod:Timestamp>` +
    `<mod:Language>${cfg.language}</mod:Language>` +
    `<mod:UserAgent>${cfg.userAgent}</mod:UserAgent>` +
    `<mod:ReceiverId>${cfg.receiverId}</mod:ReceiverId>` +
    `</mod:RequestHeader>`
  )
}

function parseResponseHeaderOrThrow(doc: any): void {
  const headerNode = doc.getElementsByTagName('ResponseHeader')?.item(0) ?? null
  const responseCode = headerNode
    ? String(headerNode.getElementsByTagName('ResponseCode')?.item(0)?.textContent ?? '').trim() || null
    : firstTextByLocalName(doc, 'ResponseCode')
  const responseText = headerNode
    ? String(headerNode.getElementsByTagName('ResponseText')?.item(0)?.textContent ?? '').trim() || null
    : firstTextByLocalName(doc, 'ResponseText')
  // Code may be empty when SOAP faults occur; in that case caller should treat as error anyway.
  if (responseCode && responseCode !== '0' && responseCode !== '00' && responseCode !== '000') {
    throw new Error(`Nordea ResponseHeader ${responseCode}: ${responseText ?? ''}`.trim())
  }
}

function extractApplicationResponseBase64OrThrow(doc: any): string {
  const node = firstElementByLocalName(doc, 'ApplicationResponse')
  const b64 = String(node?.textContent ?? '').trim()
  if (!b64) {
    const snippet = String((doc as any)?.toString?.() ?? '').replace(/\s+/g, ' ').slice(0, 500)
    throw new Error(`Missing ApplicationResponse in SOAP response: ${snippet}`)
  }
  return b64
}

export async function nordeaDownloadFileList(
  cfgInput: NordeaCorporateAccessWsClientConfig,
  input: {
    status: 'NEW' | 'DLD' | 'ALL'
    startDate?: Date
    endDate?: Date
    serviceId?: string
    fileType?: string
  },
): Promise<{ fileDescriptors: NordeaFileDescriptor[]; applicationResponseXml: string }>
{
  const cfg = nordeaCorporateAccessWsClientConfigSchema.parse(cfgInput)
  const requestId = generateRequestId()
  const timestampIso = new Date().toISOString()

  const applicationRequestXml = buildNordeaDownloadFileListApplicationRequestXml(
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
    },
    {
      privateKeyPem: cfg.signingPrivateKeyPem,
      certificatePem: cfg.signingCertificatePem,
    },
  )

  const bodyInnerXml =
    `<cor:downloadFileListin>` +
    buildRequestHeaderXml(cfg, requestId, timestampIso) +
    `<mod:ApplicationRequest>${base64EncodeUtf8(applicationRequestXml)}</mod:ApplicationRequest>` +
    `</cor:downloadFileListin>`

  const soapXml = buildSignedSoapEnvelope({
    bodyInnerXml,
    signingPrivateKeyPem: cfg.signingPrivateKeyPem,
    signingCertificatePem: cfg.signingCertificatePem,
  })

  const responseSoapXml = await postSoap({
    endpointUrl: cfg.endpointUrl,
    soapXml,
    timeoutMs: cfg.timeoutMs,
    mtls:
      cfg.mtlsClientCertificatePem && cfg.mtlsClientPrivateKeyPem
        ? { certPem: cfg.mtlsClientCertificatePem, keyPem: cfg.mtlsClientPrivateKeyPem }
        : null,
  })

  verifySoapSignatureOrThrow({
    soapXml: responseSoapXml,
    trustedCertificateFingerprintSha256Hex: cfg.trustedSoapSigningCertFingerprintSha256Hex,
  })

  const soapDoc = new DOMParser().parseFromString(responseSoapXml, 'application/xml')
  parseResponseHeaderOrThrow(soapDoc)

  const appRespB64 = extractApplicationResponseBase64OrThrow(soapDoc)
  const applicationResponseXml = base64DecodeUtf8(appRespB64)

  // Parse Secure Envelope response header fields and verify the embedded signature.
  const parsedApp = parseNordeaApplicationResponseXml(applicationResponseXml, {
    trustedCertificateFingerprintSha256Hex: cfg.trustedApplicationResponseCertFingerprintSha256Hex,
    allowUnpinnedCertificate: !cfg.trustedApplicationResponseCertFingerprintSha256Hex,
  })
  if (parsedApp.signature && !parsedApp.signature.isValid) {
    throw new Error('Nordea ApplicationResponse signature verification failed')
  }

  const appDoc = new DOMParser().parseFromString(applicationResponseXml, 'application/xml')
  const fileDescriptors = Array.from(appDoc.getElementsByTagName('FileDescriptor')).map((n: any) => {
    const ref = String(n?.getElementsByTagName('FileReference')?.item(0)?.textContent ?? '').trim()
    const fileType = String(n?.getElementsByTagName('FileType')?.item(0)?.textContent ?? '').trim() || null
    const serviceId = String(n?.getElementsByTagName('ServiceId')?.item(0)?.textContent ?? '').trim() || null
    const tsRaw = String(n?.getElementsByTagName('Timestamp')?.item(0)?.textContent ?? '').trim() || null
    return {
      fileReference: ref,
      fileType,
      serviceId,
      timestamp: tsRaw ? new Date(tsRaw) : null,
    } satisfies NordeaFileDescriptor
  }).filter((d) => d.fileReference)

  return { fileDescriptors, applicationResponseXml }
}

export async function nordeaDownloadFile(
  cfgInput: NordeaCorporateAccessWsClientConfig,
  input: {
    fileReference: string
    requestCompressed?: boolean
    serviceId?: string
    fileType?: string
  },
): Promise<{ payload: Buffer; applicationResponseXml: string }>
{
  const cfg = nordeaCorporateAccessWsClientConfigSchema.parse(cfgInput)
  const requestId = generateRequestId()
  const timestampIso = new Date().toISOString()

  const applicationRequestXml = buildNordeaDownloadFileApplicationRequestXml(
    {
      customerId: cfg.customerId,
      signerId: cfg.signerId,
      softwareId: cfg.softwareId,
      environment: cfg.environment,
      fileReferences: [input.fileReference],
      requestCompressed: input.requestCompressed ?? true,
      serviceId: input.serviceId,
      fileType: input.fileType,
    },
    {
      privateKeyPem: cfg.signingPrivateKeyPem,
      certificatePem: cfg.signingCertificatePem,
    },
  )

  const bodyInnerXml =
    `<cor:downloadFilein>` +
    buildRequestHeaderXml(cfg, requestId, timestampIso) +
    `<mod:ApplicationRequest>${base64EncodeUtf8(applicationRequestXml)}</mod:ApplicationRequest>` +
    `</cor:downloadFilein>`

  const soapXml = buildSignedSoapEnvelope({
    bodyInnerXml,
    signingPrivateKeyPem: cfg.signingPrivateKeyPem,
    signingCertificatePem: cfg.signingCertificatePem,
  })

  const responseSoapXml = await postSoap({
    endpointUrl: cfg.endpointUrl,
    soapXml,
    timeoutMs: cfg.timeoutMs,
    mtls:
      cfg.mtlsClientCertificatePem && cfg.mtlsClientPrivateKeyPem
        ? { certPem: cfg.mtlsClientCertificatePem, keyPem: cfg.mtlsClientPrivateKeyPem }
        : null,
  })

  verifySoapSignatureOrThrow({
    soapXml: responseSoapXml,
    trustedCertificateFingerprintSha256Hex: cfg.trustedSoapSigningCertFingerprintSha256Hex,
  })

  const soapDoc = new DOMParser().parseFromString(responseSoapXml, 'application/xml')
  parseResponseHeaderOrThrow(soapDoc)

  const appRespB64 = extractApplicationResponseBase64OrThrow(soapDoc)
  const applicationResponseXml = base64DecodeUtf8(appRespB64)
  const parsed = parseNordeaApplicationResponseXml(applicationResponseXml, {
    trustedCertificateFingerprintSha256Hex: cfg.trustedApplicationResponseCertFingerprintSha256Hex,
    allowUnpinnedCertificate: !cfg.trustedApplicationResponseCertFingerprintSha256Hex,
  })

  if (parsed.signature && !parsed.signature.isValid) {
    throw new Error('Nordea ApplicationResponse signature verification failed')
  }

  if (!parsed.content) {
    throw new Error('Nordea DownloadFile: missing Content in ApplicationResponse')
  }

  return { payload: parsed.content, applicationResponseXml }
}
