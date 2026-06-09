import { join } from 'node:path'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import { account } from '~/lib/db/schema/account'
import type { BankProvider, BankChannel } from '~/lib/db/schema/bankingAgreement'
import { logger } from '~/lib/logger'
import { parseCamt053Xml } from './camt053/parseCamt053Xml'
import { LocalFileBankAdapter } from '../infrastructure/localFileBankAdapter'
import { DanskeBankEdiWebServicesAdapter } from '../infrastructure/danskebank/danskeBankEdiWebServicesAdapter'
import { loadDanskeBankEdiEnvConfig } from '../infrastructure/danskebank/danskeBankEdiEnvConfig'
import { loadDanskeBankEnvSecrets } from '../infrastructure/danskebank/danskeBankEnvSecrets'
import { NordeaCorporateAccessWebServicesAdapter } from '../infrastructure/nordea/nordeaCorporateAccessWebServicesAdapter'
import { loadNordeaCorporateAccessEnvConfig } from '../infrastructure/nordea/nordeaCorporateAccessEnvConfig'
import { loadNordeaEnvSecrets } from '../infrastructure/nordea/nordeaEnvSecrets'
import type { BankAdapter } from '../ports/bankAdapter'

function toDateOnlyUtc(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function shiftDaysUtc(value: Date, daysBack: number): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate() - daysBack, 0, 0, 0, 0))
}

function toAccountId(input: { iban: string | null; currency: string | null }): string | null {
  const iban = String(input.iban ?? '').trim()
  const currency = String(input.currency ?? '').trim()
  if (!iban || !currency) return null
  return `${iban}-${currency}`
}

function buildIso20022Adapter(provider: BankProvider): BankAdapter {
  const adapterKeyOverride = `${process.env.BANK_ADAPTER ?? ''}`.trim()
  if (adapterKeyOverride === 'local-file') {
    return new LocalFileBankAdapter({
      key: 'nordea-example-file',
      filePath: join(process.cwd(), 'resources', 'banking', 'nordea', 'examples', 'camt.053e.xml'),
      filename: 'camt.053e.xml',
    })
  }

  if (provider === 'danskebank') {
    const cfg = loadDanskeBankEdiEnvConfig()
    const secrets = loadDanskeBankEnvSecrets()
    return new DanskeBankEdiWebServicesAdapter({
      ediEndpointUrl: cfg.DANSKE_BANK_EDI_ENDPOINT_URL,
      pkiEndpointUrl: cfg.DANSKE_BANK_PKI_ENDPOINT_URL,
      senderId: cfg.DANSKE_BANK_EDI_SENDER_ID,
      receiverId: cfg.DANSKE_BANK_EDI_RECEIVER_ID,
      language: cfg.DANSKE_BANK_EDI_LANGUAGE,
      customerId: cfg.DANSKE_BANK_CUSTOMER_ID,
      signerId: cfg.DANSKE_BANK_SIGNER_ID,
      softwareId: cfg.DANSKE_BANK_SOFTWARE_ID,
      environment: cfg.DANSKE_BANK_ENVIRONMENT,
      downloadStatus: cfg.DANSKE_BANK_FILE_STATUS,
      lookbackDays: cfg.DANSKE_BANK_LOOKBACK_DAYS,
      maxFilesPerRun: cfg.DANSKE_BANK_MAX_FILES_PER_RUN,
      pkiSenderId: cfg.DANSKE_BANK_PKI_SENDER_ID,
      pkiCustomerId: cfg.DANSKE_BANK_PKI_CUSTOMER_ID,
      pkiInterfaceVersion: cfg.DANSKE_BANK_PKI_INTERFACE_VERSION,
      pkiBankRootCertificateSerialNo: cfg.DANSKE_BANK_PKI_BANK_ROOT_CERT_SERIAL,
      applicationRequestPrivateKeyPem: secrets.applicationRequestPrivateKeyPem,
      applicationRequestCertificatePem: secrets.applicationRequestCertificatePem,
      trustedBankSigningCertFingerprintSha256Hex: secrets.trustedSigningCertificateFingerprintSha256Hex,
      mtlsClientCertificatePem: secrets.mtlsClientCertificatePem,
      mtlsClientPrivateKeyPem: secrets.mtlsClientPrivateKeyPem,
      httpTimeoutMs: 30_000,
    })
  }

  if (provider === 'nordea') {
    const cfg = loadNordeaCorporateAccessEnvConfig()
    const secrets = loadNordeaEnvSecrets()
    return new NordeaCorporateAccessWebServicesAdapter({
      endpointUrl: cfg.NORDEA_CA_WS_ENDPOINT_URL,
      senderId: cfg.NORDEA_CA_WS_SENDER_ID,
      receiverId: cfg.NORDEA_CA_WS_RECEIVER_ID,
      userAgent: cfg.NORDEA_CA_WS_USER_AGENT,
      language: cfg.NORDEA_CA_WS_LANGUAGE,
      customerId: cfg.NORDEA_CA_CUSTOMER_ID,
      signerId: cfg.NORDEA_CA_SIGNER_ID,
      softwareId: cfg.NORDEA_CA_SOFTWARE_ID,
      environment: cfg.NORDEA_CA_ENVIRONMENT,
      statementFileType: cfg.NORDEA_CA_STATEMENT_FILE_TYPE,
      downloadStatus: cfg.NORDEA_CA_FILE_STATUS,
      lookbackDays: cfg.NORDEA_CA_LOOKBACK_DAYS,
      maxFilesPerRun: cfg.NORDEA_CA_MAX_FILES_PER_RUN,
      requestCompressed: cfg.NORDEA_CA_REQUEST_COMPRESSED === '1',
      applicationRequestPrivateKeyPem: secrets.NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM,
      applicationRequestCertificatePem: secrets.NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM,
      trustedNordeaCertificateFingerprintSha256Hex: secrets.NORDEA_TRUSTED_SIGNING_CERT_SHA256,
      mtlsClientCertificatePem: secrets.NORDEA_MTLS_CLIENT_CERTIFICATE_PEM ?? secrets.NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM,
      mtlsClientPrivateKeyPem: secrets.NORDEA_MTLS_CLIENT_PRIVATE_KEY_PEM ?? secrets.NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM,
      timeoutMs: 30_000,
    })
  }

  throw new Error(`Account discovery ikke implementeret for provider=${provider}`)
}

function getProviderLookbackDays(provider: BankProvider): number {
  if (provider === 'danskebank') {
    return loadDanskeBankEdiEnvConfig().DANSKE_BANK_LOOKBACK_DAYS
  }

  if (provider === 'nordea') {
    return loadNordeaCorporateAccessEnvConfig().NORDEA_CA_LOOKBACK_DAYS
  }

  return 1
}

export async function discoverAgreementAccounts(options: {
  provider: BankProvider
  channel: BankChannel
  bookingDate: Date
}): Promise<{ discoveredAccounts: number; inspectedDocuments: number }> {
  const log = logger.child({ scope: 'banking.discoverAgreementAccounts', provider: options.provider, channel: options.channel })

  if (options.channel !== 'iso20022') {
    return { discoveredAccounts: 0, inspectedDocuments: 0 }
  }

  const adapter = buildIso20022Adapter(options.provider)
  const lookbackDays = Math.max(1, getProviderLookbackDays(options.provider))

  const knownIds = new Set<string>()
  let discoveredAccounts = 0
  let inspectedDocuments = 0

  for (let daysBack = 0; daysBack < lookbackDays; daysBack += 1) {
    const bookingDate = toDateOnlyUtc(shiftDaysUtc(options.bookingDate, daysBack))
    const fetched = await adapter.fetchDocuments({
      accountId: `provider:${options.provider}`,
      cursor: null,
      limit: 25,
      bookingDate,
    })

    inspectedDocuments += fetched.documents.length

    for (const doc of fetched.documents) {
      if (doc.format !== 'camt053') continue

      const parsed = parseCamt053Xml(doc.content)
      for (const stmt of parsed.statements) {
        const accountId = toAccountId({ iban: stmt.iban, currency: stmt.currency })
        if (!accountId || knownIds.has(accountId)) continue
        knownIds.add(accountId)

        const [existing] = await db
          .select({ id: account.id })
          .from(account)
          .where(eq(account.id, accountId))
          .limit(1)

        if (!existing) {
          await db.insert(account).values({
            id: accountId,
            provider: options.provider,
            iban: String(stmt.iban ?? '').trim(),
            currency: String(stmt.currency ?? '').trim() || null,
            name: stmt.ownerName,
          })
          discoveredAccounts += 1
        }
      }
    }
  }

  log.info('Account discovery completed', {
    bookingDate: toDateOnlyUtc(options.bookingDate),
    lookbackDays,
    inspectedDocuments,
    discoveredAccounts,
  })

  return {
    discoveredAccounts,
    inspectedDocuments,
  }
}
