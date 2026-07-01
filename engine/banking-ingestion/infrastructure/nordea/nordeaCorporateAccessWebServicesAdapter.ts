import type {
  BankAdapter,
  FetchBankDocumentsInput,
  FetchBankDocumentsOutput,
} from '../../ports/bankAdapter'
import { z } from 'zod'

import { nordeaDownloadFile, nordeaDownloadFileList, nordeaCorporateAccessWsClientConfigSchema } from './nordeaCorporateAccessWsClient'

/**
 * Nordea Corporate Access Web Services (SOAP) adapter focused on CAMT.053 ingestion.
 *
 * Implemented:
 * - DownloadFileList + DownloadFile
 * - WS-Security: SOAP Body signature + Timestamp (per Nordea WSDL policy)
 * - Secure Envelope signature verification on ApplicationResponse
 * - Optional mTLS support via undici Agent
 */

export const nordeaCorporateAccessWsConfigSchema = z.object({
  senderId: z.string().min(1),
  receiverId: z.string().min(1),
  userAgent: z.string().min(1),

  language: z.string().min(1).default('EN'),

  /** SOAP endpoint URL (production differs from certificate service). */
  endpointUrl: z.string().url(),

  /** Secure Envelope (ApplicationRequest) fields. */
  customerId: z.string().min(1).max(16),
  signerId: z.string().min(1).max(80),
  softwareId: z.string().min(1).max(80),
  environment: z.enum(['PRODUCTION', 'TEST']).default('PRODUCTION'),

  /** Default statement file type (prefer extended CAMT.053). */
  statementFileType: z.string().min(1).default('NDAREXXMLO'),

  /** Daily default is unread files only. */
  downloadStatus: z.enum(['NEW', 'DLD', 'ALL']).default('NEW'),
  lookbackDays: z.number().int().min(1).max(31).default(7),
  maxFilesPerRun: z.number().int().min(1).max(100).default(25),

  /** Whether DownloadFile should request compressed payloads. */
  requestCompressed: z.boolean().optional().default(true),

  /** The Secure Envelope signing material (content signing certificate). */
  applicationRequestPrivateKeyPem: z.string().min(1),
  applicationRequestCertificatePem: z.string().min(1),

  /** Nordea CA / cert pinning for response verification. */
  trustedNordeaCertificateFingerprintSha256Hex: z.string().min(64).max(64).optional(),

  /** Optional mTLS client credentials. */
  mtlsClientCertificatePem: z.string().min(1).optional(),
  mtlsClientPrivateKeyPem: z.string().min(1).optional(),

  timeoutMs: z.number().int().min(1).max(120_000).default(30_000),
})

export type NordeaCorporateAccessWsConfig = z.infer<typeof nordeaCorporateAccessWsConfigSchema>

export class NordeaCorporateAccessWebServicesAdapter implements BankAdapter {
  public readonly key = 'nordea-corporate-access-ws'
  public readonly lookbackDays: number

  constructor(private readonly config: NordeaCorporateAccessWsConfig) {
    const parsed = nordeaCorporateAccessWsConfigSchema.parse(config)
    this.lookbackDays = parsed.lookbackDays
  }

  async fetchDocuments(
    input: FetchBankDocumentsInput,
  ): Promise<FetchBankDocumentsOutput> {
    const config = nordeaCorporateAccessWsConfigSchema.parse(this.config)

    const clientConfig = nordeaCorporateAccessWsClientConfigSchema.parse({
      endpointUrl: config.endpointUrl,
      senderId: config.senderId,
      receiverId: config.receiverId,
      userAgent: config.userAgent,
      language: config.language,
      customerId: config.customerId,
      signerId: config.signerId,
      softwareId: config.softwareId,
      environment: config.environment,
      signingPrivateKeyPem: config.applicationRequestPrivateKeyPem,
      signingCertificatePem: config.applicationRequestCertificatePem,
      trustedSoapSigningCertFingerprintSha256Hex: config.trustedNordeaCertificateFingerprintSha256Hex,
      trustedApplicationResponseCertFingerprintSha256Hex: config.trustedNordeaCertificateFingerprintSha256Hex,
      mtlsClientCertificatePem: config.mtlsClientCertificatePem,
      mtlsClientPrivateKeyPem: config.mtlsClientPrivateKeyPem,
      timeoutMs: config.timeoutMs,
    })

    const listInput: Parameters<typeof nordeaDownloadFileList>[1] = {
      status: config.downloadStatus,
      fileType: config.statementFileType,
    }

    const requestedBookingDate = input.bookingDate.trim()
    const startDate = new Date(`${requestedBookingDate}T00:00:00.000Z`)
    const endDate = new Date(`${requestedBookingDate}T23:59:59.999Z`)
    listInput.status = 'ALL'
    listInput.startDate = startDate
    listInput.endDate = endDate

    const list = await nordeaDownloadFileList(clientConfig, listInput)

    const requestedLimit = input.limit ?? config.maxFilesPerRun
    const limit = Math.max(1, Math.min(requestedLimit, config.maxFilesPerRun))
    const refs = list.fileDescriptors
      .filter((d) => !d.fileType || d.fileType === config.statementFileType)
      .slice(0, limit)

    const documents: FetchBankDocumentsOutput['documents'] = []

    for (const d of refs) {
      const dl = await nordeaDownloadFile(clientConfig, {
        fileReference: d.fileReference,
        requestCompressed: config.requestCompressed,
        fileType: d.fileType ?? config.statementFileType,
        serviceId: d.serviceId ?? undefined,
      })

      documents.push({
        format: 'camt053',
        filename: `${d.fileReference}.xml`,
        content: dl.payload.toString('utf8'),
        receivedAt: d.timestamp ?? new Date(),
      })
    }

    return {
      documents,
      nextCursor: {
        value: JSON.stringify({ lastFetchAt: new Date().toISOString() }),
      },
    }
  }
}
