import { DanskeBankEdiWebServicesAdapter } from '~~/engine/banking-ingestion/infrastructure/danskebank/danskeBankEdiWebServicesAdapter'
import { loadDanskeBankEdiEnvConfig } from '~~/engine/banking-ingestion/infrastructure/danskebank/danskeBankEdiEnvConfig'
import { loadDanskeBankEnvSecrets } from '~~/engine/banking-ingestion/infrastructure/danskebank/danskeBankEnvSecrets'

import { loadNordeaCorporateAccessEnvConfig } from '~~/engine/banking-ingestion/infrastructure/nordea/nordeaCorporateAccessEnvConfig'
import { loadNordeaEnvSecrets } from '~~/engine/banking-ingestion/infrastructure/nordea/nordeaEnvSecrets'
import { NordeaCorporateAccessWebServicesAdapter } from '~~/engine/banking-ingestion/infrastructure/nordea/nordeaCorporateAccessWebServicesAdapter'

export function createUtcIsoString(value: Date | string | null | undefined): string {
  if (!value) {
    return new Date().toISOString().slice(0, 10)
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new TypeError('Ugyldig dato modtaget i createUtcIsoString')
  }

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export function parseIsoDateToUtcDate(value: string | null | undefined): Date | null {
  const input = String(value ?? '').trim()
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

export function shiftDaysBack(value: Date, daysBack: number): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate() - daysBack, 0, 0, 0, 0))
}

export function normalizeDate(value: Date): Date {
  if (value instanceof Date) return value
  const parsed = value ? new Date(value) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export function inferMimeType(fileExtension: string | null | undefined, filename?: string | null): string | null {
  const ext = (fileExtension ?? filename?.split(".").pop() ?? "").toLowerCase().trim();

  if (!ext) {
    return null;
  }

  switch (ext) {
    case "pdf": return "application/pdf";
    case "csv": return "text/csv";
    case "xml": return "application/xml";
    case "txt": return "text/plain";
    case "json": return "application/json";
    default: return "application/octet-stream";
  }
}

export function buildBankMeta(provider: string): any {
if (!provider) {
    throw new Error(`Ingen provider angivet`)
  }

  if (provider === "nordea") {
    const config = loadNordeaCorporateAccessEnvConfig()
    const secrets = loadNordeaEnvSecrets()

      return new NordeaCorporateAccessWebServicesAdapter({
        endpointUrl: config.NORDEA_CA_WS_ENDPOINT_URL,
        senderId: config.NORDEA_CA_WS_SENDER_ID,
        receiverId: config.NORDEA_CA_WS_RECEIVER_ID,
        userAgent: config.NORDEA_CA_WS_USER_AGENT,
        language: config.NORDEA_CA_WS_LANGUAGE,
        customerId: config.NORDEA_CA_CUSTOMER_ID,
        signerId: config.NORDEA_CA_SIGNER_ID,
        softwareId: config.NORDEA_CA_SOFTWARE_ID,
        environment: config.NORDEA_CA_ENVIRONMENT,
        statementFileType: config.NORDEA_CA_STATEMENT_FILE_TYPE,
        downloadStatus: config.NORDEA_CA_FILE_STATUS,
        lookbackDays: config.NORDEA_CA_LOOKBACK_DAYS,
        maxFilesPerRun: config.NORDEA_CA_MAX_FILES_PER_RUN,
        requestCompressed: config.NORDEA_CA_REQUEST_COMPRESSED === '1',
        applicationRequestPrivateKeyPem: secrets.NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM,
        applicationRequestCertificatePem: secrets.NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM,
        trustedNordeaCertificateFingerprintSha256Hex: secrets.NORDEA_TRUSTED_SIGNING_CERT_SHA256,
        mtlsClientCertificatePem:
          secrets.NORDEA_MTLS_CLIENT_CERTIFICATE_PEM ?? secrets.NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM,
        mtlsClientPrivateKeyPem:
          secrets.NORDEA_MTLS_CLIENT_PRIVATE_KEY_PEM ?? secrets.NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM,
        timeoutMs: 30_000,
      })
    } else if (provider === "danskebank") {
      const config = loadDanskeBankEdiEnvConfig()
      const secrets = loadDanskeBankEnvSecrets()

      return new DanskeBankEdiWebServicesAdapter({
        ediEndpointUrl: config.DANSKE_BANK_EDI_ENDPOINT_URL,
        pkiEndpointUrl: config.DANSKE_BANK_PKI_ENDPOINT_URL,
        senderId: config.DANSKE_BANK_EDI_SENDER_ID,
        receiverId: config.DANSKE_BANK_EDI_RECEIVER_ID,
        language: config.DANSKE_BANK_EDI_LANGUAGE,
        customerId: config.DANSKE_BANK_CUSTOMER_ID,
        signerId: config.DANSKE_BANK_SIGNER_ID,
        softwareId: config.DANSKE_BANK_SOFTWARE_ID,
        environment: config.DANSKE_BANK_ENVIRONMENT,
        downloadStatus: config.DANSKE_BANK_FILE_STATUS,
        lookbackDays: config.DANSKE_BANK_LOOKBACK_DAYS,
        maxFilesPerRun: config.DANSKE_BANK_MAX_FILES_PER_RUN,
        pkiSenderId: config.DANSKE_BANK_PKI_SENDER_ID,
        pkiCustomerId: config.DANSKE_BANK_PKI_CUSTOMER_ID,
        pkiInterfaceVersion: config.DANSKE_BANK_PKI_INTERFACE_VERSION,
        pkiBankRootCertificateSerialNo: config.DANSKE_BANK_PKI_BANK_ROOT_CERT_SERIAL,
        applicationRequestPrivateKeyPem: secrets.applicationRequestPrivateKeyPem,
        applicationRequestCertificatePem: secrets.applicationRequestCertificatePem,
        trustedBankSigningCertFingerprintSha256Hex: secrets.trustedSigningCertificateFingerprintSha256Hex,
        mtlsClientCertificatePem: secrets.mtlsClientCertificatePem,
        mtlsClientPrivateKeyPem: secrets.mtlsClientPrivateKeyPem,
        httpTimeoutMs: 30_000,
      })
  } else {
    throw new Error(`Account discovery ikke implementeret for provider=${provider}`)
  }
}