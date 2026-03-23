import type {
  BankAdapter,
  FetchBankDocumentsInput,
  FetchBankDocumentsOutput,
} from '../../ports/bankAdapter'
import { z } from 'zod'

/**
 * Skeleton adapter for Nordea Corporate Access Web Services (SOAP) focused on CAMT.053 ingestion.
 *
 * Scope:
 * - DownloadFileList + DownloadFile
 * - Parsing ApplicationResponse and extracting CAMT.053 XML
 *
 * Out of scope (intentionally not planned here):
 * - UploadFile, payments, confirmations, etc.
 *
 * Why this is intentionally incomplete:
 * - Nordea WSDL downloads are sometimes access-controlled (HTTP 403).
 * - The SOAP envelope requires WS-Security timestamp + signature of SOAP:Body.
 * - We should generate SOAP stubs from the bank-provided WSDL once we can fetch it reliably.
 */

export const nordeaCorporateAccessWsConfigSchema = z.object({
  senderId: z.string().min(1),
  receiverId: z.string().min(1),
  userAgent: z.string().min(1),

  /** SOAP endpoint URL (production differs from certificate service). */
  endpointUrl: z.string().url(),

  /** The Secure Envelope signing material (content signing certificate). */
  applicationRequestPrivateKeyPem: z.string().min(1),
  applicationRequestCertificatePem: z.string().min(1),

  /** Nordea CA / cert pinning for response verification. */
  trustedNordeaCertificateFingerprintSha256Hex: z.string().min(64).max(64).optional(),
})

export type NordeaCorporateAccessWsConfig = z.infer<typeof nordeaCorporateAccessWsConfigSchema>

export class NordeaCorporateAccessWebServicesAdapter implements BankAdapter {
  public readonly key = 'nordea-corporate-access-ws'

  constructor(private readonly config: NordeaCorporateAccessWsConfig) {
    nordeaCorporateAccessWsConfigSchema.parse(config)
  }

  async fetchDocuments(
    _input: FetchBankDocumentsInput,
  ): Promise<FetchBankDocumentsOutput> {
    // The future implementation will likely be:
    // 1) SOAP DownloadFileList
    // 2) SOAP DownloadFile for CAMT.053
    // 3) Verify SOAP signature + Secure Envelope signature
    // 4) Decode Base64, gunzip if needed, emit CAMT.053 XML documents
    throw new Error(
      'NordeaCorporateAccessWebServicesAdapter is a skeleton: SOAP transport + WS-Security signing not implemented yet. Use Secure Envelope helpers in secureEnvelope.ts as a building block.',
    )
  }
}
