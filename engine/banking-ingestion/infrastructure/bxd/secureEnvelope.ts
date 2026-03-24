import { gunzipSync, gzipSync } from 'node:zlib'
import { z } from 'zod'
import { DOMParser } from '@xmldom/xmldom'

import {
  defaultXmlDsigAlgorithms,
  signEnvelopedXmlDsig,
  verifyEnvelopedXmlDsig,
  type XmlDsigAlgorithms,
} from './xmlDsig'

/**
 * BXD Secure Envelope (ApplicationRequest/ApplicationResponse)
 *
 * Schema targetNamespace: http://bxd.fi/xmldata/
 * Root elements are in that default namespace.
 */
export const BXD_SECURE_ENVELOPE_NAMESPACE = 'http://bxd.fi/xmldata/'

export type BxdEnvironment = 'PRODUCTION' | 'TEST'

export const bxdEnvironmentSchema = z.enum(['PRODUCTION', 'TEST'])

export const bxdUploadFileRequestSchema = z.object({
  customerId: z.string().min(1).max(16),
  signerId: z.string().min(1).max(80),
  fileType: z.string().min(1).max(40),
  softwareId: z.string().min(1).max(80),

  /** Optional: indicates that the message content is encrypted (some banks require this flag). */
  encryption: z.boolean().optional(),
  /** Optional: free-text/URI per bank docs. */
  encryptionMethod: z.string().min(1).max(35).optional(),

  /** Optional filename stored by the bank (UserFilename in XSD). */
  userFilename: z.string().min(1).max(80).optional(),

  /** If omitted, we generate a timestamp at build time. */
  timestamp: z.date().optional(),

  environment: bxdEnvironmentSchema.default('PRODUCTION'),

  /** ExecutionSerial is echoed back by the bank. */
  executionSerial: z
    .string()
    .min(1)
    .max(32)
    .refine((v) => !v.endsWith('\\'), 'ExecutionSerial cannot end with \\\\')
    .optional(),

  /** Raw payload bytes (e.g. CAMT, pain.001). */
  content: z.union([z.instanceof(Buffer), z.string()]),

  /** Banks typically support GZIP compression. */
  compress: z.boolean().optional(),

  /** Optional override; default is "GZIP" (keeps existing Nordea tests stable). */
  compressionMethod: z.string().min(1).max(10).optional(),
})

export type BxdUploadFileRequest = z.infer<typeof bxdUploadFileRequestSchema>

export const bxdDownloadFileListRequestSchema = z.object({
  customerId: z.string().min(1).max(16),
  signerId: z.string().min(1).max(80),
  softwareId: z.string().min(1).max(80),

  encryption: z.boolean().optional(),
  encryptionMethod: z.string().min(1).max(35).optional(),

  environment: bxdEnvironmentSchema.default('PRODUCTION'),

  /** If omitted, we generate a timestamp at build time. */
  timestamp: z.date().optional(),

  startDate: z.date().optional(),
  endDate: z.date().optional(),

  /** NEW, DLD, ALL (case sensitive) per bank docs. */
  status: z.enum(['NEW', 'DLD', 'ALL']),

  /** Optional; used for file types that use ServiceId. */
  serviceId: z.string().min(1).max(256).optional(),

  /** Optional; may be used as additional filtering criteria. */
  fileType: z.string().min(1).max(40).optional(),

  /** ExecutionSerial is echoed back by the bank. */
  executionSerial: z
    .string()
    .min(1)
    .max(32)
    .refine((v) => !v.endsWith('\\'), 'ExecutionSerial cannot end with \\\\')
    .optional(),
})

export type BxdDownloadFileListRequest = z.infer<typeof bxdDownloadFileListRequestSchema>

export const bxdDownloadFileRequestSchema = z.object({
  customerId: z.string().min(1).max(16),
  signerId: z.string().min(1).max(80),
  softwareId: z.string().min(1).max(80),

  encryption: z.boolean().optional(),
  encryptionMethod: z.string().min(1).max(35).optional(),

  environment: bxdEnvironmentSchema.default('PRODUCTION'),

  /** If omitted, we generate a timestamp at build time. */
  timestamp: z.date().optional(),

  /** File references returned from DownloadFileList. */
  fileReferences: z.array(z.string().min(1).max(32)).min(1),

  /** Request compression of the returned file (GZIP is the only supported method). */
  requestCompressed: z.boolean().optional(),

  /** Optional override for <CompressionMethod> when requestCompressed is true. */
  compressionMethod: z.string().min(1).max(10).optional(),

  /** Optional; may be required for certain file types. */
  fileType: z.string().min(1).max(40).optional(),

  /** Optional; used for file types that use ServiceId. */
  serviceId: z.string().min(1).max(256).optional(),

  /** ExecutionSerial is echoed back by the bank. */
  executionSerial: z
    .string()
    .min(1)
    .max(32)
    .refine((v) => !v.endsWith('\\'), 'ExecutionSerial cannot end with \\\\')
    .optional(),
})

export type BxdDownloadFileRequest = z.infer<typeof bxdDownloadFileRequestSchema>

export type BxdSigningMaterial = {
  privateKeyPem: string
  certificatePem: string
  algorithms?: Partial<XmlDsigAlgorithms>
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDateOnlyUtc(date: Date): string {
  // ApplicationRequest XSD uses xs:date for StartDate/EndDate.
  // Use the UTC date portion to avoid local offset surprises.
  return date.toISOString().slice(0, 10)
}

export function buildBxdUploadFileApplicationRequestXml(
  input: BxdUploadFileRequest,
  signing: BxdSigningMaterial,
): string {
  const parsed = bxdUploadFileRequestSchema.parse(input)

  const payloadBytes =
    typeof parsed.content === 'string' ? Buffer.from(parsed.content, 'utf8') : parsed.content

  const shouldCompress = parsed.compress === true
  const processedBytes = shouldCompress ? gzipSync(payloadBytes) : payloadBytes
  const base64 = processedBytes.toString('base64')

  const timestamp = parsed.timestamp ?? new Date()

  const compressionMethod = parsed.compressionMethod ?? 'GZIP'

  // Note: Element order follows XSD sequence.
  const xmlUnsigned =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<ApplicationRequest xmlns="${BXD_SECURE_ENVELOPE_NAMESPACE}">` +
    `<CustomerId>${escapeXml(parsed.customerId)}</CustomerId>` +
    `<Command>UploadFile</Command>` +
    `<Timestamp>${timestamp.toISOString()}</Timestamp>` +
    `<Environment>${escapeXml(parsed.environment)}</Environment>` +
    (parsed.encryption === true ? `<Encryption>true</Encryption>` : '') +
    (parsed.encryptionMethod ? `<EncryptionMethod>${escapeXml(parsed.encryptionMethod)}</EncryptionMethod>` : '') +
    (parsed.userFilename ? `<UserFilename>${escapeXml(parsed.userFilename)}</UserFilename>` : '') +
    `<TargetId>${escapeXml(parsed.signerId)}</TargetId>` +
    (parsed.executionSerial ? `<ExecutionSerial>${escapeXml(parsed.executionSerial)}</ExecutionSerial>` : '') +
    (shouldCompress
      ? `<Compression>true</Compression><CompressionMethod>${escapeXml(compressionMethod)}</CompressionMethod>`
      : '') +
    `<SoftwareId>${escapeXml(parsed.softwareId)}</SoftwareId>` +
    `<FileType>${escapeXml(parsed.fileType)}</FileType>` +
    `<Content>${base64}</Content>` +
    `</ApplicationRequest>`

  return signEnvelopedXmlDsig({
    xml: xmlUnsigned,
    privateKeyPem: signing.privateKeyPem,
    certificatePem: signing.certificatePem,
    algorithms: signing.algorithms ?? defaultXmlDsigAlgorithms,
  })
}

export function buildBxdDownloadFileListApplicationRequestXml(
  input: BxdDownloadFileListRequest,
  signing: BxdSigningMaterial,
): string {
  const parsed = bxdDownloadFileListRequestSchema.parse(input)
  const timestamp = parsed.timestamp ?? new Date()

  const xmlUnsigned =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<ApplicationRequest xmlns="${BXD_SECURE_ENVELOPE_NAMESPACE}">` +
    `<CustomerId>${escapeXml(parsed.customerId)}</CustomerId>` +
    `<Command>DownloadFileList</Command>` +
    `<Timestamp>${timestamp.toISOString()}</Timestamp>` +
    (parsed.startDate ? `<StartDate>${formatDateOnlyUtc(parsed.startDate)}</StartDate>` : '') +
    (parsed.endDate ? `<EndDate>${formatDateOnlyUtc(parsed.endDate)}</EndDate>` : '') +
    `<Status>${parsed.status}</Status>` +
    (parsed.serviceId ? `<ServiceId>${escapeXml(parsed.serviceId)}</ServiceId>` : '') +
    (parsed.encryption === true ? `<Encryption>true</Encryption>` : '') +
    (parsed.encryptionMethod ? `<EncryptionMethod>${escapeXml(parsed.encryptionMethod)}</EncryptionMethod>` : '') +
    `<Environment>${escapeXml(parsed.environment)}</Environment>` +
    `<TargetId>${escapeXml(parsed.signerId)}</TargetId>` +
    (parsed.executionSerial ? `<ExecutionSerial>${escapeXml(parsed.executionSerial)}</ExecutionSerial>` : '') +
    `<SoftwareId>${escapeXml(parsed.softwareId)}</SoftwareId>` +
    (parsed.fileType ? `<FileType>${escapeXml(parsed.fileType)}</FileType>` : '') +
    `</ApplicationRequest>`

  return signEnvelopedXmlDsig({
    xml: xmlUnsigned,
    privateKeyPem: signing.privateKeyPem,
    certificatePem: signing.certificatePem,
    algorithms: signing.algorithms ?? defaultXmlDsigAlgorithms,
  })
}

export function buildBxdDownloadFileApplicationRequestXml(
  input: BxdDownloadFileRequest,
  signing: BxdSigningMaterial,
): string {
  const parsed = bxdDownloadFileRequestSchema.parse(input)
  const timestamp = parsed.timestamp ?? new Date()

  const fileRefsXml =
    `<FileReferences>` +
    parsed.fileReferences.map((ref) => `<FileReference>${escapeXml(ref)}</FileReference>`).join('') +
    `</FileReferences>`

  const requestCompressed = parsed.requestCompressed === true
  const compressionMethod = parsed.compressionMethod ?? 'GZIP'

  const xmlUnsigned =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<ApplicationRequest xmlns="${BXD_SECURE_ENVELOPE_NAMESPACE}">` +
    `<CustomerId>${escapeXml(parsed.customerId)}</CustomerId>` +
    `<Command>DownloadFile</Command>` +
    `<Timestamp>${timestamp.toISOString()}</Timestamp>` +
    (parsed.serviceId ? `<ServiceId>${escapeXml(parsed.serviceId)}</ServiceId>` : '') +
    (parsed.encryption === true ? `<Encryption>true</Encryption>` : '') +
    (parsed.encryptionMethod ? `<EncryptionMethod>${escapeXml(parsed.encryptionMethod)}</EncryptionMethod>` : '') +
    `<Environment>${escapeXml(parsed.environment)}</Environment>` +
    fileRefsXml +
    `<TargetId>${escapeXml(parsed.signerId)}</TargetId>` +
    (parsed.executionSerial ? `<ExecutionSerial>${escapeXml(parsed.executionSerial)}</ExecutionSerial>` : '') +
    (requestCompressed
      ? `<Compression>true</Compression><CompressionMethod>${escapeXml(compressionMethod)}</CompressionMethod>`
      : '') +
    `<SoftwareId>${escapeXml(parsed.softwareId)}</SoftwareId>` +
    (parsed.fileType ? `<FileType>${escapeXml(parsed.fileType)}</FileType>` : '') +
    `</ApplicationRequest>`

  return signEnvelopedXmlDsig({
    xml: xmlUnsigned,
    privateKeyPem: signing.privateKeyPem,
    certificatePem: signing.certificatePem,
    algorithms: signing.algorithms ?? defaultXmlDsigAlgorithms,
  })
}

export type BxdApplicationResponse = {
  customerId: string
  timestamp: Date
  responseCode: string
  responseText: string
  executionSerial?: string | null
  encrypted: boolean
  compressed: boolean
  compressionMethod?: string | null
  fileType?: string | null
  content?: Buffer | null
  /** Signature verification outcome (if verification was requested). */
  signature?: {
    isValid: boolean
    embeddedCertificateFingerprintSha256Hex: string | null
  }
}

export type ParseBxdApplicationResponseOptions = {
  /** If set, verifies signature cryptographically and pins to this fingerprint (recommended). */
  trustedCertificateFingerprintSha256Hex?: string

  /**
   * If true, we will verify signature cryptographically but will not require trust pinning.
   * This is not recommended for production because any embedded certificate could be accepted.
   */
  allowUnpinnedCertificate?: boolean
}

function firstText(doc: any, tagName: string): string | null {
  const nodes = doc.getElementsByTagName(tagName)
  const node = nodes?.item(0) ?? null
  const text = node?.textContent?.trim() ?? ''
  return text.length > 0 ? text : null
}

function parseBooleanText(value: string | null): boolean {
  if (!value) return false
  return value.trim() === 'true'
}

export function parseBxdApplicationResponseXml(
  xml: string,
  options: ParseBxdApplicationResponseOptions = {},
): BxdApplicationResponse {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')

  const customerId = firstText(doc, 'CustomerId') ?? ''
  const timestampRaw = firstText(doc, 'Timestamp') ?? ''
  const responseCode = firstText(doc, 'ResponseCode') ?? ''
  const responseText = firstText(doc, 'ResponseText') ?? ''

  if (!customerId || !timestampRaw || !responseCode || !responseText) {
    throw new Error('Invalid ApplicationResponse: missing required fields')
  }

  const encrypted = parseBooleanText(firstText(doc, 'Encrypted'))
  const compressed = parseBooleanText(firstText(doc, 'Compressed'))
  const compressionMethod = firstText(doc, 'CompressionMethod')
  // Some variants may include Encryption flags (request-side) as well.
  const fileType = firstText(doc, 'FileType')
  const executionSerial = firstText(doc, 'ExecutionSerial')

  let signatureResult: BxdApplicationResponse['signature']
  if (options.trustedCertificateFingerprintSha256Hex || options.allowUnpinnedCertificate) {
    const verify = verifyEnvelopedXmlDsig({
      xml,
      trustedCertificateFingerprintSha256Hex: options.trustedCertificateFingerprintSha256Hex,
    })

    if (!options.allowUnpinnedCertificate && !options.trustedCertificateFingerprintSha256Hex) {
      throw new Error(
        'Signature verification requested without trust pinning; set trustedCertificateFingerprintSha256Hex or allowUnpinnedCertificate',
      )
    }

    signatureResult = {
      isValid: verify.isSignatureValid,
      embeddedCertificateFingerprintSha256Hex: verify.embeddedCertificateFingerprintSha256Hex,
    }
  }

  const contentBase64 = firstText(doc, 'Content')
  let content: Buffer | null = null

  if (contentBase64) {
    const decoded = Buffer.from(contentBase64.replace(/\s+/g, ''), 'base64')

    if (encrypted) {
      // Spec says encryption is not implemented yet, but the schema still allows it.
      throw new Error('Encrypted ApplicationResponse content is not supported')
    }

    if (compressed) {
      if (compressionMethod && compressionMethod.toUpperCase() !== 'GZIP') {
        throw new Error(`Unsupported compression method: ${compressionMethod}`)
      }
      content = gunzipSync(decoded)
    } else {
      content = decoded
    }
  }

  return {
    customerId,
    timestamp: new Date(timestampRaw),
    responseCode,
    responseText,
    executionSerial,
    encrypted,
    compressed,
    compressionMethod,
    fileType,
    content,
    signature: signatureResult,
  }
}
