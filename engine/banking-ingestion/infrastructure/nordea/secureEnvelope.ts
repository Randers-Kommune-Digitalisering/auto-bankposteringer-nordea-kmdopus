import { gunzipSync, gzipSync } from 'node:zlib'
import { z } from 'zod'
import {
  defaultXmlDsigAlgorithms,
  signEnvelopedXmlDsig,
  verifyEnvelopedXmlDsig,
  type XmlDsigAlgorithms,
} from './xmlDsig'
import { DOMParser } from '@xmldom/xmldom'

/**
 * Nordea Corporate Access Secure Envelope (ApplicationRequest/ApplicationResponse)
 *
 * Schema targetNamespace: http://bxd.fi/xmldata/
 * Root elements are in that default namespace.
 */
export const NORDEA_SECURE_ENVELOPE_NAMESPACE = 'http://bxd.fi/xmldata/'

export type NordeaEnvironment = 'PRODUCTION' | 'TEST'

export const nordeaEnvironmentSchema = z.enum(['PRODUCTION', 'TEST'])

export const nordeaUploadFileRequestSchema = z.object({
  customerId: z.string().min(1).max(16),
  signerId: z.string().min(1).max(80),
  fileType: z.string().min(1).max(40),
  softwareId: z.string().min(1).max(80),

  /** Optional filename stored by the bank (UserFilename in XSD). */
  userFilename: z.string().min(1).max(80).optional(),

  /** If omitted, we generate a timestamp at build time. */
  timestamp: z.date().optional(),

  /** Must be PRODUCTION in real traffic per Nordea docs. */
  environment: nordeaEnvironmentSchema.default('PRODUCTION'),

  /** ExecutionSerial is echoed back by Nordea. */
  executionSerial: z
    .string()
    .min(1)
    .max(32)
    .refine((v) => !v.endsWith('\\'), 'ExecutionSerial cannot end with \\')
    .optional(),

  /** Raw payload bytes (e.g. CAMT, pain.001). */
  content: z.union([z.instanceof(Buffer), z.string()]),

  /** Nordea supports GZIP compression; recommended for >1MB. */
  compress: z.boolean().optional(),
})

export type NordeaUploadFileRequest = z.infer<typeof nordeaUploadFileRequestSchema>

export const nordeaDownloadFileListRequestSchema = z.object({
  customerId: z.string().min(1).max(16),
  signerId: z.string().min(1).max(80),
  softwareId: z.string().min(1).max(80),

  /** Must be PRODUCTION in real traffic per Nordea docs. */
  environment: nordeaEnvironmentSchema.default('PRODUCTION'),

  /** If omitted, we generate a timestamp at build time. */
  timestamp: z.date().optional(),

  /** Filter window. Nordea docs mention valid values current date -7 days, +1 day. */
  startDate: z.date().optional(),
  endDate: z.date().optional(),

  /** NEW, DLD, ALL (case sensitive) per Nordea docs. */
  status: z.enum(['NEW', 'DLD', 'ALL']),

  /** Optional; used for file types that use ServiceId. */
  serviceId: z.string().min(1).max(256).optional(),

  /** Optional; may be used as additional filtering criteria. */
  fileType: z.string().min(1).max(40).optional(),

  /** ExecutionSerial is echoed back by Nordea. */
  executionSerial: z
    .string()
    .min(1)
    .max(32)
    .refine((v) => !v.endsWith('\\'), 'ExecutionSerial cannot end with \\')
    .optional(),
})

export type NordeaDownloadFileListRequest = z.infer<typeof nordeaDownloadFileListRequestSchema>

export const nordeaDownloadFileRequestSchema = z.object({
  customerId: z.string().min(1).max(16),
  signerId: z.string().min(1).max(80),
  softwareId: z.string().min(1).max(80),

  /** Must be PRODUCTION in real traffic per Nordea docs. */
  environment: nordeaEnvironmentSchema.default('PRODUCTION'),

  /** If omitted, we generate a timestamp at build time. */
  timestamp: z.date().optional(),

  /** Nordea file references returned from DownloadFileList. */
  fileReferences: z.array(z.string().min(1).max(32)).min(1),

  /** Request compression of the returned file (GZIP is the only supported method). */
  requestCompressed: z.boolean().optional(),

  /** Optional; may be required for certain file types. */
  fileType: z.string().min(1).max(40).optional(),

  /** Optional; used for file types that use ServiceId. */
  serviceId: z.string().min(1).max(256).optional(),

  /** ExecutionSerial is echoed back by Nordea. */
  executionSerial: z
    .string()
    .min(1)
    .max(32)
    .refine((v) => !v.endsWith('\\'), 'ExecutionSerial cannot end with \\')
    .optional(),
})

export type NordeaDownloadFileRequest = z.infer<typeof nordeaDownloadFileRequestSchema>

export type NordeaSigningMaterial = {
  privateKeyPem: string
  certificatePem: string
  algorithms?: Partial<XmlDsigAlgorithms>
}

export function buildNordeaUploadFileApplicationRequestXml(
  input: NordeaUploadFileRequest,
  signing: NordeaSigningMaterial,
): string {
  const parsed = nordeaUploadFileRequestSchema.parse(input)

  const payloadBytes =
    typeof parsed.content === 'string' ? Buffer.from(parsed.content, 'utf8') : parsed.content

  const shouldCompress = parsed.compress === true
  const processedBytes = shouldCompress ? gzipSync(payloadBytes) : payloadBytes
  const base64 = processedBytes.toString('base64')

  const timestamp = parsed.timestamp ?? new Date()

  const escape = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')

  // Note: Element order follows XSD sequence.
  const xmlUnsigned =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<ApplicationRequest xmlns="${NORDEA_SECURE_ENVELOPE_NAMESPACE}">` +
    `<CustomerId>${escape(parsed.customerId)}</CustomerId>` +
    `<Command>UploadFile</Command>` +
    `<Timestamp>${timestamp.toISOString()}</Timestamp>` +
    `<Environment>${escape(parsed.environment)}</Environment>` +
    (parsed.userFilename ? `<UserFilename>${escape(parsed.userFilename)}</UserFilename>` : '') +
    `<TargetId>${escape(parsed.signerId)}</TargetId>` +
    (parsed.executionSerial
      ? `<ExecutionSerial>${escape(parsed.executionSerial)}</ExecutionSerial>`
      : '') +
    (shouldCompress ? `<Compression>true</Compression><CompressionMethod>GZIP</CompressionMethod>` : '') +
    `<SoftwareId>${escape(parsed.softwareId)}</SoftwareId>` +
    `<FileType>${escape(parsed.fileType)}</FileType>` +
    `<Content>${base64}</Content>` +
    `</ApplicationRequest>`

  return signEnvelopedXmlDsig({
    xml: xmlUnsigned,
    privateKeyPem: signing.privateKeyPem,
    certificatePem: signing.certificatePem,
    algorithms: signing.algorithms ?? defaultXmlDsigAlgorithms,
  })
}

function formatDateOnlyUtc(date: Date): string {
  // ApplicationRequest XSD uses xs:date for StartDate/EndDate.
  // Use the UTC date portion to avoid local offset surprises.
  return date.toISOString().slice(0, 10)
}

export function buildNordeaDownloadFileListApplicationRequestXml(
  input: NordeaDownloadFileListRequest,
  signing: NordeaSigningMaterial,
): string {
  const parsed = nordeaDownloadFileListRequestSchema.parse(input)

  const timestamp = parsed.timestamp ?? new Date()

  const escape = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')

  const xmlUnsigned =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<ApplicationRequest xmlns="${NORDEA_SECURE_ENVELOPE_NAMESPACE}">` +
    `<CustomerId>${escape(parsed.customerId)}</CustomerId>` +
    `<Command>DownloadFileList</Command>` +
    `<Timestamp>${timestamp.toISOString()}</Timestamp>` +
    (parsed.startDate ? `<StartDate>${formatDateOnlyUtc(parsed.startDate)}</StartDate>` : '') +
    (parsed.endDate ? `<EndDate>${formatDateOnlyUtc(parsed.endDate)}</EndDate>` : '') +
    `<Status>${parsed.status}</Status>` +
    (parsed.serviceId ? `<ServiceId>${escape(parsed.serviceId)}</ServiceId>` : '') +
    `<Environment>${escape(parsed.environment)}</Environment>` +
    `<TargetId>${escape(parsed.signerId)}</TargetId>` +
    (parsed.executionSerial
      ? `<ExecutionSerial>${escape(parsed.executionSerial)}</ExecutionSerial>`
      : '') +
    `<SoftwareId>${escape(parsed.softwareId)}</SoftwareId>` +
    (parsed.fileType ? `<FileType>${escape(parsed.fileType)}</FileType>` : '') +
    `</ApplicationRequest>`

  return signEnvelopedXmlDsig({
    xml: xmlUnsigned,
    privateKeyPem: signing.privateKeyPem,
    certificatePem: signing.certificatePem,
    algorithms: signing.algorithms ?? defaultXmlDsigAlgorithms,
  })
}

export function buildNordeaDownloadFileApplicationRequestXml(
  input: NordeaDownloadFileRequest,
  signing: NordeaSigningMaterial,
): string {
  const parsed = nordeaDownloadFileRequestSchema.parse(input)
  const timestamp = parsed.timestamp ?? new Date()

  const escape = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')

  const fileRefsXml =
    `<FileReferences>` +
    parsed.fileReferences.map((ref) => `<FileReference>${escape(ref)}</FileReference>`).join('') +
    `</FileReferences>`

  const requestCompressed = parsed.requestCompressed === true

  const xmlUnsigned =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<ApplicationRequest xmlns="${NORDEA_SECURE_ENVELOPE_NAMESPACE}">` +
    `<CustomerId>${escape(parsed.customerId)}</CustomerId>` +
    `<Command>DownloadFile</Command>` +
    `<Timestamp>${timestamp.toISOString()}</Timestamp>` +
    (parsed.serviceId ? `<ServiceId>${escape(parsed.serviceId)}</ServiceId>` : '') +
    `<Environment>${escape(parsed.environment)}</Environment>` +
    fileRefsXml +
    `<TargetId>${escape(parsed.signerId)}</TargetId>` +
    (parsed.executionSerial
      ? `<ExecutionSerial>${escape(parsed.executionSerial)}</ExecutionSerial>`
      : '') +
    (requestCompressed
      ? `<Compression>true</Compression><CompressionMethod>GZIP</CompressionMethod>`
      : '') +
    `<SoftwareId>${escape(parsed.softwareId)}</SoftwareId>` +
    (parsed.fileType ? `<FileType>${escape(parsed.fileType)}</FileType>` : '') +
    `</ApplicationRequest>`

  return signEnvelopedXmlDsig({
    xml: xmlUnsigned,
    privateKeyPem: signing.privateKeyPem,
    certificatePem: signing.certificatePem,
    algorithms: signing.algorithms ?? defaultXmlDsigAlgorithms,
  })
}

export type NordeaApplicationResponse = {
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

export type ParseNordeaApplicationResponseOptions = {
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

export function parseNordeaApplicationResponseXml(
  xml: string,
  options: ParseNordeaApplicationResponseOptions = {},
): NordeaApplicationResponse {
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
  const fileType = firstText(doc, 'FileType')
  const executionSerial = firstText(doc, 'ExecutionSerial')

  let signatureResult: NordeaApplicationResponse['signature']
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
