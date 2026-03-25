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

  constructor(private readonly config: NordeaCorporateAccessWsConfig) {
    nordeaCorporateAccessWsConfigSchema.parse(config)
  }

  async fetchDocuments(
    input: FetchBankDocumentsInput,
  ): Promise<FetchBankDocumentsOutput> {
    const cfg = nordeaCorporateAccessWsConfigSchema.parse(this.config)

    const clientCfg = nordeaCorporateAccessWsClientConfigSchema.parse({
      endpointUrl: cfg.endpointUrl,
      senderId: cfg.senderId,
      receiverId: cfg.receiverId,
      userAgent: cfg.userAgent,
      language: cfg.language,
      customerId: cfg.customerId,
      signerId: cfg.signerId,
      softwareId: cfg.softwareId,
      environment: cfg.environment,
      signingPrivateKeyPem: cfg.applicationRequestPrivateKeyPem,
      signingCertificatePem: cfg.applicationRequestCertificatePem,
      trustedSoapSigningCertFingerprintSha256Hex: cfg.trustedNordeaCertificateFingerprintSha256Hex,
      trustedApplicationResponseCertFingerprintSha256Hex: cfg.trustedNordeaCertificateFingerprintSha256Hex,
      mtlsClientCertificatePem: cfg.mtlsClientCertificatePem,
      mtlsClientPrivateKeyPem: cfg.mtlsClientPrivateKeyPem,
      timeoutMs: cfg.timeoutMs,
    })

    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    const list = await nordeaDownloadFileList(clientCfg, {
      status: 'NEW',
      startDate,
      endDate,
      fileType: cfg.statementFileType,
    })

    const limit = input.limit ?? 25
    const refs = list.fileDescriptors
      .filter((d) => !d.fileType || d.fileType === cfg.statementFileType)
      .slice(0, limit)

    const documents: FetchBankDocumentsOutput['documents'] = []

    for (const d of refs) {
      const dl = await nordeaDownloadFile(clientCfg, {
        fileReference: d.fileReference,
        requestCompressed: cfg.requestCompressed,
        fileType: d.fileType ?? cfg.statementFileType,
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
