import crypto from 'node:crypto'
import { DOMParser } from '@xmldom/xmldom'
import { SignedXml } from 'xml-crypto'
import { z } from 'zod'

const XMLDSIG_NS = 'http://www.w3.org/2000/09/xmldsig#'
const NORDEA_XMLDATA_NS = 'http://filetransfer.nordea.com/xmldata/'
const NORDEA_CERT_SERVICE_NS = 'http://bxd.fi/CertificateService'
const NORDEA_C14N_WITH_COMMENTS = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315#WithComments'
const XML_C14N = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
const ENVELOPED_SIGNATURE = `${XMLDSIG_NS}enveloped-signature`
const RSA_SHA256 = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256'
const SHA256 = 'http://www.w3.org/2001/04/xmlenc#sha256'

function xmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function localNameOf(node: any): string {
  const name = String(node?.localName ?? node?.tagName ?? '')
  const i = name.indexOf(':')
  return i >= 0 ? name.slice(i + 1) : name
}

function firstElementByLocalName(root: any, localName: string): any | null {
  const direct = root?.getElementsByTagName?.(localName)?.item?.(0) ?? null
  if (direct) return direct

  const nodes = root?.getElementsByTagName?.('*')
  if (!nodes) return null

  for (let i = 0; i < nodes.length; i += 1) {
    const n = nodes.item(i)
    if (localNameOf(n) === localName) return n
  }

  return null
}

function firstText(root: any, localName: string): string | null {
  const node = firstElementByLocalName(root, localName)
  const text = String(node?.textContent ?? '').trim()
  return text.length > 0 ? text : null
}

function formatTimestampUtc(d: Date): string {
  return d.toISOString()
}

function looksLikePemCertificate(value: string): boolean {
  return value.includes('BEGIN CERTIFICATE')
}

function base64EncodeUtf8(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64')
}

function base64DecodeUtf8(value: string): string {
  return Buffer.from(value.replace(/\s+/g, ''), 'base64').toString('utf8')
}

function buildNordeaKeyInfo(certificatePem: string): string {
  const certificate = new crypto.X509Certificate(certificatePem)
  const issuerName = certificate.issuer
    .split(/\r?\n/)
    .map(part => part.trim())
    .filter(Boolean)
    .reverse()
    .join(',')
  const serialHex = certificate.serialNumber.replace(/^0x/i, '')
  const serialNumber = BigInt(`0x${serialHex}`).toString(10)

  return (
    `<X509Data>` +
    `<X509Certificate>${certificate.raw.toString('base64')}</X509Certificate>` +
    `<X509IssuerSerial>` +
    `<X509IssuerName>${xmlEscape(issuerName)}</X509IssuerName>` +
    `<X509SerialNumber>${serialNumber}</X509SerialNumber>` +
    `</X509IssuerSerial>` +
    `</X509Data>`
  )
}

function signNordeaCertApplicationRequest(xml: string, privateKeyPem: string, certificatePem: string): string {
  const signer = new SignedXml({
    privateKey: crypto.createPrivateKey(privateKeyPem),
    publicCert: certificatePem,
    canonicalizationAlgorithm: NORDEA_C14N_WITH_COMMENTS,
    signatureAlgorithm: RSA_SHA256,
    getKeyInfoContent: () => buildNordeaKeyInfo(certificatePem),
  })

  signer.addReference({
    xpath: '/*',
    uri: '',
    isEmptyUri: true,
    digestAlgorithm: SHA256,
    transforms: [ENVELOPED_SIGNATURE],
  })

  // xml-crypto adds this implicit XMLDSig transform when verifying, but its
  // signer needs it during digest calculation without serializing it in Reference.
  const signerInternals = signer as unknown as {
    getCanonReferenceXml: (doc: unknown, reference: { transforms: string[] }, node: unknown) => string
  }
  const getCanonReferenceXml = signerInternals.getCanonReferenceXml.bind(signer)
  signerInternals.getCanonReferenceXml = (doc, reference, node) => {
    const transforms = [...reference.transforms]
    if (transforms.at(-1) === ENVELOPED_SIGNATURE) transforms.push(XML_C14N)
    return getCanonReferenceXml(doc, { ...reference, transforms }, node)
  }

  signer.computeSignature(xml)
  return signer.getSignedXml()
}

export function certDerBase64ToPem(certDerBase64: string): string {
  const clean = certDerBase64.replace(/\s+/g, '')
  const lines = clean.match(/.{1,64}/g) ?? []
  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----\n`
}

export function computeNordeaCertApplicationHmacBase64(input: {
  csrDer: Buffer
  activationCode: string
}): string {
  return crypto
    .createHmac('sha1', Buffer.from(input.activationCode, 'ascii'))
    .update(input.csrDer)
    .digest('base64')
}

const nordeaCertApplicationBaseSchema = z.object({
  customerId: z.string().min(1),
  softwareId: z.string().min(1),
  environment: z.enum(['PRODUCTION']).default('PRODUCTION'),
  service: z.string().min(1).default('service'),
  command: z.string().min(1).default('GetCertificate'),
  csrDerBase64: z.string().min(1),
  timestamp: z.date().default(() => new Date()),
})

export const nordeaCertApplicationInputSchema = z.union([
  nordeaCertApplicationBaseSchema.extend({
    authentication: z.object({
      type: z.literal('hmac'),
      hmacBase64: z.string().min(1),
    }),
  }),
  nordeaCertApplicationBaseSchema.extend({
    authentication: z.object({
      type: z.literal('signature'),
      privateKeyPem: z.string().min(1),
      certificatePem: z.string().min(1),
    }),
  }),
])

export type NordeaCertApplicationInput = z.infer<typeof nordeaCertApplicationInputSchema>

export function buildNordeaCertApplicationRequestXml(inputRaw: NordeaCertApplicationInput): string {
  const input = nordeaCertApplicationInputSchema.parse(inputRaw)

  const authenticationXml = input.authentication.type === 'hmac'
    ? `<ns2:HMAC>${xmlEscape(input.authentication.hmacBase64)}</ns2:HMAC>`
    : ''

  const unsignedXml = (
    `<ns2:CertApplicationRequest xmlns="${XMLDSIG_NS}" xmlns:ns2="${NORDEA_XMLDATA_NS}">` +
    `<ns2:CustomerId>${xmlEscape(input.customerId)}</ns2:CustomerId>` +
    `<ns2:Timestamp>${xmlEscape(formatTimestampUtc(input.timestamp))}</ns2:Timestamp>` +
    `<ns2:Environment>${xmlEscape(input.environment)}</ns2:Environment>` +
    `<ns2:SoftwareId>${xmlEscape(input.softwareId)}</ns2:SoftwareId>` +
    `<ns2:Command>${xmlEscape(input.command)}</ns2:Command>` +
    `<ns2:Service>${xmlEscape(input.service)}</ns2:Service>` +
    `<ns2:Content>${xmlEscape(input.csrDerBase64)}</ns2:Content>` +
    authenticationXml +
    `</ns2:CertApplicationRequest>`
  )

  if (input.authentication.type === 'hmac') return unsignedXml

  return signNordeaCertApplicationRequest(
    unsignedXml,
    input.authentication.privateKeyPem,
    input.authentication.certificatePem,
  )
}

export const nordeaCertificateServiceConfigSchema = z.object({
  endpointUrl: z.string().url().default('https://filetransfer.nordea.com/services/CertificateService/sha2'),
  soapAction: z.string().min(1).optional(),
  timeoutMs: z.number().int().min(1).max(120_000).default(30_000),
})

export type NordeaCertificateServiceConfig = z.infer<typeof nordeaCertificateServiceConfigSchema>

export const nordeaCertificateServiceGetCertificateInputSchema = z.object({
  senderId: z.string().min(1),
  requestId: z.string().min(1),
  timestamp: z.date().default(() => new Date()),
  certApplicationRequestXml: z.string().min(1),
})

export type NordeaCertificateServiceGetCertificateInput = z.infer<
  typeof nordeaCertificateServiceGetCertificateInputSchema
>

export type NordeaCertificateServiceResponse = {
  responseXml: string
  certApplicationResponseXml: string | null
  responseCode: string | null
  responseText: string | null
  contentBase64: string | null
  certificatePem: string | null
}

export class NordeaCertificateServiceError extends Error {
  constructor(message: string, readonly responseXml: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'NordeaCertificateServiceError'
  }
}

type NordeaCertificateServiceParsedPayload = Omit<NordeaCertificateServiceResponse, 'responseXml'>

function wrapInSoapEnvelope(bodyInnerXml: string): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cer="${NORDEA_CERT_SERVICE_NS}">` +
    `<soapenv:Header/>` +
    `<soapenv:Body>` +
    bodyInnerXml +
    `</soapenv:Body>` +
    `</soapenv:Envelope>`
  )
}

function buildGetCertificateBody(input: NordeaCertificateServiceGetCertificateInput): string {
  return (
    `<cer:getCertificatein>` +
    `<cer:RequestHeader>` +
    `<cer:SenderId>${xmlEscape(input.senderId)}</cer:SenderId>` +
    `<cer:RequestId>${xmlEscape(input.requestId)}</cer:RequestId>` +
    `<cer:Timestamp>${xmlEscape(formatTimestampUtc(input.timestamp))}</cer:Timestamp>` +
    `</cer:RequestHeader>` +
    `<cer:ApplicationRequest>${base64EncodeUtf8(input.certApplicationRequestXml)}</cer:ApplicationRequest>` +
    `</cer:getCertificatein>`
  )
}

function extractSoapFaultOrNull(doc: any): { code: string | null; text: string | null; detail: string | null } | null {
  const faultNode = firstElementByLocalName(doc, 'Fault')
  if (!faultNode) return null

  return {
    code: firstText(faultNode, 'faultcode'),
    text: firstText(faultNode, 'faultstring'),
    detail: firstText(faultNode, 'detail'),
  }
}

function serializeNode(node: any): string {
  // xmldom has toString() on nodes which serializes XML.
  return typeof node?.toString === 'function' ? String(node.toString()) : ''
}

function extractCertificateBase64FromCertApplicationResponse(doc: any): string | null {
  const certificatesNode = firstElementByLocalName(doc, 'Certificates')
  if (!certificatesNode) return null

  const certificateContainer = firstElementByLocalName(certificatesNode, 'Certificate')
  if (!certificateContainer) return null

  // Inside the container, the actual certificate bytes are in the nested Certificate element.
  const nodes = certificateContainer.getElementsByTagName('*')
  for (let i = 0; i < nodes.length; i += 1) {
    const n = nodes.item(i)
    if (!n) continue
    if (localNameOf(n) !== 'Certificate') continue
    if (n === certificateContainer) continue
    const value = String(n.textContent ?? '').trim()
    if (value.length > 0) return value
  }

  return null
}

export async function nordeaCertificateServiceGetCertificate(
  configRaw: NordeaCertificateServiceConfig,
  inputRaw: NordeaCertificateServiceGetCertificateInput,
): Promise<NordeaCertificateServiceResponse> {
  const config = nordeaCertificateServiceConfigSchema.parse(configRaw)
  const input = nordeaCertificateServiceGetCertificateInputSchema.parse(inputRaw)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'text/xml; charset=utf-8',
    }
    // WSDL defines empty soapAction for document-literal binding.
    if (config.soapAction) headers.SOAPAction = config.soapAction

    const body = buildGetCertificateBody(input)
    const requestSoapXml = wrapInSoapEnvelope(body)

    const res = await fetch(config.endpointUrl, {
      method: 'POST',
      headers,
      body: requestSoapXml,
      signal: controller.signal,
    })

    const responseXml = await res.text()
    if (!res.ok) {
      throw new NordeaCertificateServiceError(
        `Nordea CertificateService HTTP ${res.status} ${res.statusText}: ${responseXml.slice(0, 600)}`,
        responseXml,
      )
    }

    let parsed: NordeaCertificateServiceParsedPayload
    try {
      parsed = parseNordeaCertificateServiceResponseXml(responseXml)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not parse Nordea CertificateService response.'
      throw new NordeaCertificateServiceError(message, responseXml, { cause })
    }

    return {
      responseXml,
      ...parsed,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export function parseNordeaCertificateServiceResponseXml(responseXml: string): NordeaCertificateServiceParsedPayload {
  const doc = new DOMParser().parseFromString(responseXml, 'application/xml')
  const fault = extractSoapFaultOrNull(doc)
  if (fault) {
    throw new Error(`Nordea CertificateService SOAP fault ${fault.code ?? 'UNKNOWN'}: ${(fault.text ?? '').trim()} ${(fault.detail ?? '').trim()}`.trim())
  }

  const getCertificateOut = firstElementByLocalName(doc, 'getCertificateout')
  const appRespB64 = firstText(getCertificateOut ?? doc, 'ApplicationResponse')

  const directCertAppResponseNode = firstElementByLocalName(doc, 'CertApplicationResponse')
  const certApplicationResponseXml = appRespB64
    ? base64DecodeUtf8(appRespB64)
    : directCertAppResponseNode
      ? serializeNode(directCertAppResponseNode)
      : null

  const certAppDoc = certApplicationResponseXml
    ? new DOMParser().parseFromString(certApplicationResponseXml, 'application/xml')
    : null

  const responseHeader = firstElementByLocalName(getCertificateOut ?? doc, 'ResponseHeader')
  const responseCode =
    firstText(responseHeader ?? getCertificateOut ?? certAppDoc ?? doc, 'ResponseCode') ??
    firstText(getCertificateOut ?? certAppDoc ?? doc, 'ReturnCode')
  const responseText =
    firstText(responseHeader ?? getCertificateOut ?? certAppDoc ?? doc, 'ResponseText') ??
    firstText(getCertificateOut ?? certAppDoc ?? doc, 'ReturnText')

  const contentBase64 = certAppDoc
    ? firstText(certAppDoc, 'Content')
    : null
  const certificateFromCertificatesElementBase64 = certAppDoc
    ? extractCertificateBase64FromCertApplicationResponse(certAppDoc)
    : null

  const certificatePem = (() => {
    const certificateValue = contentBase64 || certificateFromCertificatesElementBase64
    if (!certificateValue) return null
    if (looksLikePemCertificate(certificateValue)) return certificateValue
    return certDerBase64ToPem(certificateValue)
  })()

  return {
    certApplicationResponseXml,
    responseCode,
    responseText,
    contentBase64,
    certificatePem,
  }
}
