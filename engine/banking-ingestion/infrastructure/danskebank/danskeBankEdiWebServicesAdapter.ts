import { z } from 'zod'

import type {
  BankAdapter,
  FetchBankDocumentsInput,
  FetchBankDocumentsOutput,
} from '../../ports/bankAdapter'
import { danskePkiGetBankCertificates } from './pkiWsClient'
import { danskeEdiDownloadFile, danskeEdiDownloadFileList, type DanskeEdiWsConfig } from './ediWsClient'

/**
 * Danske Bank Web Services (EDI Web Service) adapter skeleton.
 *
 * Observed from the published WSDL in `WS Examples and Schemas (zip)`:
 * - EDI endpoint (prod): https://businessws.danskebank.com/financialservice/edifileservice.asmx
 * - PKI endpoint (prod): https://businessws.danskebank.com/ra/pkiservice.asmx
 *
 * Important: EDIWS represents ApplicationRequest/ApplicationResponse as `base64Binary`.
 * The examples show message-level encryption/signing (XMLENC/XMLDSig) before base64.
 *
 * This adapter is intentionally a skeleton until we implement:
 * - PKIWS: certificate lifecycle (GetBankCertificate/CreateCertificate/RenewCertificate)
 * - EDIWS: SOAP transport + message-level encryption/signing + base64 marshalling
 */

export const danskeBankEdiWsConfigSchema = z.object({
  // Endpoints
  ediEndpointUrl: z.string().url().default('https://businessws.danskebank.com/financialservice/edifileservice.asmx'),
  pkiEndpointUrl: z.string().url().default('https://businessws.danskebank.com/ra/pkiservice.asmx'),

  // EDI RequestHeader
  senderId: z.string().min(1),
  receiverId: z.string().min(1).default('Danske Bank'),
  language: z.string().min(1).default('EN'),

  // ApplicationRequest
  customerId: z.string().min(1).max(16),
  signerId: z.string().min(1).max(80),
  softwareId: z.string().min(1).max(80),
  environment: z.enum(['TEST', 'PRODUCTION']).default('TEST'),
  downloadStatus: z.enum(['NEW', 'DLD', 'ALL']).default('NEW'),
  lookbackDays: z.number().int().min(1).max(31).default(7),
  maxFilesPerRun: z.number().int().min(1).max(100).default(25),

  // PKIWS RequestHeader (often equals customer id)
  pkiSenderId: z.string().min(1),
  pkiCustomerId: z.string().min(1),
  pkiInterfaceVersion: z.string().min(1).default('1'),
  pkiBankRootCertificateSerialNo: z.string().min(1).default('1111110003'),

  // Our signing material (certificate typically created/renewed via PKIWS).
  applicationRequestPrivateKeyPem: z.string().min(1),
  applicationRequestCertificatePem: z.string().min(1),

  // Optional trust pinning (recommended): pins bank signing certificate.
  trustedBankSigningCertFingerprintSha256Hex: z.string().length(64).optional(),

  // Optional mTLS (TLS-layer client cert), if required by the bank.
  mtlsClientCertificatePem: z.string().min(1).optional(),
  mtlsClientPrivateKeyPem: z.string().min(1).optional(),

  httpTimeoutMs: z.number().int().min(1).max(120_000).default(30_000),
})

export type DanskeBankEdiWsConfig = z.infer<typeof danskeBankEdiWsConfigSchema>

export class DanskeBankEdiWebServicesAdapter implements BankAdapter {
  public readonly key = 'danskebank-edi-ws'
  public readonly lookbackDays: number

  constructor(private readonly config: DanskeBankEdiWsConfig) {
    const parsed = danskeBankEdiWsConfigSchema.parse(config)
    this.lookbackDays = parsed.lookbackDays
  }

  async fetchDocuments(input: FetchBankDocumentsInput): Promise<FetchBankDocumentsOutput> {
    const config = danskeBankEdiWsConfigSchema.parse(this.config)

    const pkiEnvironment = config.environment === 'TEST' ? 'customertest' : 'production'

    // 1) Fetch bank certificates via PKIWS (needed for XMLENC + signature verification)
    const bankCerts = await danskePkiGetBankCertificates({
      endpointUrl: config.pkiEndpointUrl,
      senderId: config.pkiSenderId,
      customerId: config.pkiCustomerId,
      interfaceVersion: config.pkiInterfaceVersion,
      environment: pkiEnvironment,
      bankRootCertificateSerialNo: config.pkiBankRootCertificateSerialNo,
      trustedBankSigningCertFingerprintSha256Hex: config.trustedBankSigningCertFingerprintSha256Hex,
      timeoutMs: config.httpTimeoutMs,
      mtlsClientCertificatePem: config.mtlsClientCertificatePem,
      mtlsClientPrivateKeyPem: config.mtlsClientPrivateKeyPem,
    })

    const ediConfig: DanskeEdiWsConfig = {
      endpointUrl: config.ediEndpointUrl,
      senderId: config.senderId,
      receiverId: config.receiverId,
      language: config.language,
      customerId: config.customerId,
      signerId: config.signerId,
      softwareId: config.softwareId,
      environment: config.environment,
      applicationRequestPrivateKeyPem: config.applicationRequestPrivateKeyPem,
      applicationRequestCertificatePem: config.applicationRequestCertificatePem,
      bankEncryptionCertificatePem: bankCerts.bankEncryptionCertificatePem,
      bankSigningCertificatePem: bankCerts.bankSigningCertificatePem,
      trustedBankSigningCertFingerprintSha256Hex: config.trustedBankSigningCertFingerprintSha256Hex,
      timeoutMs: config.httpTimeoutMs,
      mtlsClientCertificatePem: config.mtlsClientCertificatePem,
      mtlsClientPrivateKeyPem: config.mtlsClientPrivateKeyPem,
    }

    // Daily default: query NEW files and let the bank decide unread set.
    // Date window is only used for explicit backfill modes (DLD/ALL).
    const listInput: Parameters<typeof danskeEdiDownloadFileList>[1] = {
      status: config.downloadStatus,
    }

    const requestedBookingDate = input.bookingDate.trim()
    const startDate = new Date(`${requestedBookingDate}T00:00:00.000Z`)
    const endDate = new Date(`${requestedBookingDate}T23:59:59.999Z`)
    listInput.status = 'ALL'
    listInput.startDate = startDate
    listInput.endDate = endDate

    const list = await danskeEdiDownloadFileList(ediConfig, listInput)

    const requestedLimit = input.limit ?? config.maxFilesPerRun
    const limit = Math.max(1, Math.min(requestedLimit, config.maxFilesPerRun))
    const refs = list.fileReferences.slice(0, limit)

    const documents = [] as FetchBankDocumentsOutput['documents']

    for (const ref of refs) {
      const buf = await danskeEdiDownloadFile(ediConfig, {
        fileReference: ref,
        requestCompressed: true,
      })

      const content = buf.toString('utf8')

      documents.push({
        format: 'camt053',
        filename: `${ref}.xml`,
        content,
        receivedAt: new Date(),
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

