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
  userAgent: z.string().min(1).optional().default('AutoBankposteringer'),
  language: z.string().min(1).default('EN'),

  // ApplicationRequest
  customerId: z.string().min(1).max(16),
  signerId: z.string().min(1).max(80),
  softwareId: z.string().min(1).max(80),
  environment: z.enum(['TEST', 'PRODUCTION']).default('TEST'),
  downloadStatus: z.enum(['NEW', 'DLD', 'ALL']).default('NEW'),
  lookbackDays: z.number().int().min(1).max(365).default(7),

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

  constructor(private readonly config: DanskeBankEdiWsConfig) {
    danskeBankEdiWsConfigSchema.parse(config)
  }

  async fetchDocuments(input: FetchBankDocumentsInput): Promise<FetchBankDocumentsOutput> {
    const cfg = danskeBankEdiWsConfigSchema.parse(this.config)

    const pkiEnvironment = cfg.environment === 'TEST' ? 'customertest' : 'production'

    // 1) Fetch bank certificates via PKIWS (needed for XMLENC + signature verification)
    const bankCerts = await danskePkiGetBankCertificates({
      endpointUrl: cfg.pkiEndpointUrl,
      senderId: cfg.pkiSenderId,
      customerId: cfg.pkiCustomerId,
      interfaceVersion: cfg.pkiInterfaceVersion,
      environment: pkiEnvironment,
      bankRootCertificateSerialNo: cfg.pkiBankRootCertificateSerialNo,
      trustedBankSigningCertFingerprintSha256Hex: cfg.trustedBankSigningCertFingerprintSha256Hex,
      timeoutMs: cfg.httpTimeoutMs,
      mtlsClientCertificatePem: cfg.mtlsClientCertificatePem,
      mtlsClientPrivateKeyPem: cfg.mtlsClientPrivateKeyPem,
    })

    const ediCfg: DanskeEdiWsConfig = {
      endpointUrl: cfg.ediEndpointUrl,
      senderId: cfg.senderId,
      receiverId: cfg.receiverId,
      userAgent: cfg.userAgent,
      language: cfg.language,
      customerId: cfg.customerId,
      signerId: cfg.signerId,
      softwareId: cfg.softwareId,
      environment: cfg.environment,
      applicationRequestPrivateKeyPem: cfg.applicationRequestPrivateKeyPem,
      applicationRequestCertificatePem: cfg.applicationRequestCertificatePem,
      bankEncryptionCertificatePem: bankCerts.bankEncryptionCertificatePem,
      bankSigningCertificatePem: bankCerts.bankSigningCertificatePem,
      trustedBankSigningCertFingerprintSha256Hex: cfg.trustedBankSigningCertFingerprintSha256Hex,
      timeoutMs: cfg.httpTimeoutMs,
      mtlsClientCertificatePem: cfg.mtlsClientCertificatePem,
      mtlsClientPrivateKeyPem: cfg.mtlsClientPrivateKeyPem,
    }

    // 2) Fetch available file references.
    // Default strategy: pull a rolling window and rely on content hash for idempotency.
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - cfg.lookbackDays * 24 * 60 * 60 * 1000)

    const list = await danskeEdiDownloadFileList(ediCfg, {
      status: cfg.downloadStatus,
      startDate,
      endDate,
    })

    const limit = input.limit ?? 25
    const refs = list.fileReferences.slice(0, limit)

    const documents = [] as FetchBankDocumentsOutput['documents']

    for (const ref of refs) {
      const buf = await danskeEdiDownloadFile(ediCfg, {
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

