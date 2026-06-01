import crypto from 'node:crypto'
import { join } from 'node:path'
import { asc, eq } from 'drizzle-orm'
import db from '~/lib/db'
import { run } from '~/lib/db/schema/run'
import { errorLog } from '~/lib/db/schema/error'
import { logger } from '~/lib/logger'
import { LocalFileBankAdapter } from '../infrastructure/localFileBankAdapter'
import { DanskeBankEdiWebServicesAdapter } from '../infrastructure/danskebank/danskeBankEdiWebServicesAdapter'
import { loadDanskeBankEdiEnvConfig } from '../infrastructure/danskebank/danskeBankEdiEnvConfig'
import { loadDanskeBankEnvSecrets } from '../infrastructure/danskebank/danskeBankEnvSecrets'
import { NordeaCorporateAccessWebServicesAdapter } from '../infrastructure/nordea/nordeaCorporateAccessWebServicesAdapter'
import { loadNordeaCorporateAccessEnvConfig } from '../infrastructure/nordea/nordeaCorporateAccessEnvConfig'
import { loadNordeaEnvSecrets } from '../infrastructure/nordea/nordeaEnvSecrets'
import { ingestCamt053Document } from './ingestCamt053Document'
import { bankingAgreement } from '~/lib/db/schema/bankingAgreement'
import type { BankProvider, BankChannel } from '~/lib/db/schema/bankingAgreement'
import { getAgreementCursor, setAgreementCursor } from './bankingAgreementCursorStore'
import { runNordeaRestIngestion } from '../infrastructure/nordea/rest/ingest'

export async function runTransactionBatch(options: { runId?: string; bookingDate?: Date } = {}): Promise<{ runId: string; insertedCount: number }> {
  const log = logger.child({ scope: 'banking.runTransactionBatch' })

  const runId = options.runId ?? crypto.randomUUID()
  const bookingDate = options.bookingDate ?? new Date()

  const agreements = await db
    .select()
    .from(bankingAgreement)
    .where(eq(bankingAgreement.enabled, true))
    .orderBy(asc(bankingAgreement.provider))

  // Temporary: ingest the bundled Nordea CAMT.053 example.
  // This is intentionally deterministic and idempotent via banking_document.content_hash.
  const examplePath = join(
    process.cwd(),
    'resources',
    'banking',
    'nordea',
    'examples',
    'camt.053e.xml',
  )

  const adapterKeyOverride = `${process.env.BANK_ADAPTER ?? ''}`.trim() || null

  const overrideRun: Array<{ provider: BankProvider; channel: BankChannel }> = adapterKeyOverride
    ? (
        adapterKeyOverride === 'danskebank-edi-ws'
          ? [{ provider: 'danskebank' as const, channel: 'iso20022' as const }]
          : adapterKeyOverride === 'nordea-corporate-access-ws' || adapterKeyOverride === 'local-file'
            ? [{ provider: 'nordea' as const, channel: 'iso20022' as const }]
            : []
      )
    : []

  const runs: Array<{ provider: BankProvider; channel: BankChannel }> = agreements.length
    ? agreements.map((a) => ({ provider: a.provider as BankProvider, channel: a.channel as BankChannel }))
    : overrideRun

  const result = await db.transaction(async (trx) => {
    // Ensure agreement rows exist for any provider we might persist cursor for.
    if (runs.length) {
      await trx
        .insert(bankingAgreement)
        .values(runs.map((r) => ({ provider: r.provider, enabled: false })))
        .onConflictDoNothing({ target: bankingAgreement.provider })
    }
    await trx
      .insert(run)
      .values({ id: runId, bookingDate, status: 'indlæser' })
      .onConflictDoUpdate({
        target: run.id,
        set: { bookingDate, status: 'indlæser' },
      })

    let insertedStatements = 0
    let insertedBalances = 0
    let insertedTransactions = 0
    let deduplicated = false
    let providerErrors = 0

    for (const r of runs) {
      try {
        if (r.channel === 'rest') {
          if (r.provider !== 'nordea') {
            throw new Error(`REST kanal er ikke implementeret endnu for provider=${r.provider}`)
          }

          const nordea = await runNordeaRestIngestion(trx as any, { runId, bookingDate })
          insertedStatements += nordea.insertedStatements
          insertedBalances += nordea.insertedBalances
          insertedTransactions += nordea.insertedTransactions
          deduplicated = deduplicated || nordea.deduplicated
          continue
        }

        const adapter = (() => {
          if (adapterKeyOverride === 'danskebank-edi-ws') {
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

          if (adapterKeyOverride === 'local-file') {
            return new LocalFileBankAdapter({
              key: 'nordea-example-file',
              filePath: examplePath,
              filename: 'camt.053e.xml',
            })
          }

          if (adapterKeyOverride === 'nordea-corporate-access-ws') {
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
              mtlsClientCertificatePem:
                secrets.NORDEA_MTLS_CLIENT_CERTIFICATE_PEM ?? secrets.NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM,
              mtlsClientPrivateKeyPem:
                secrets.NORDEA_MTLS_CLIENT_PRIVATE_KEY_PEM ?? secrets.NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM,
              timeoutMs: 30_000,
            })
          }

          if (r.provider === 'danskebank') {
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

          if (r.provider === 'nordea') {
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
              mtlsClientCertificatePem:
                secrets.NORDEA_MTLS_CLIENT_CERTIFICATE_PEM ?? secrets.NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM,
              mtlsClientPrivateKeyPem:
                secrets.NORDEA_MTLS_CLIENT_PRIVATE_KEY_PEM ?? secrets.NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM,
              timeoutMs: 30_000,
            })
          }

          if (r.provider === 'bankconnect') {
            throw new Error('BankConnect adapter er ikke implementeret endnu')
          }

          throw new Error(`Ingen adapter implementeret for provider=${r.provider}`)
        })()

        const persistedCursor = await getAgreementCursor(trx as any, {
          provider: r.provider,
          adapterKey: adapter.key,
        })

        const fetched = await adapter.fetchDocuments({
          // accountId is not used for agreement-scoped adapters; keep stable for tracing.
          accountId: `provider:${r.provider}`,
          cursor: persistedCursor,
          limit: 25,
        })

        for (const doc of fetched.documents) {
          if (doc.format !== 'camt053') continue

          const ingestResult = await ingestCamt053Document(trx as any, {
            runId,
            provider: r.provider,
            filename: doc.filename ?? null,
            xml: doc.content,
          })

          insertedStatements += ingestResult.insertedStatements
          insertedBalances += ingestResult.insertedBalances
          insertedTransactions += ingestResult.insertedTransactions
          deduplicated = deduplicated || ingestResult.deduplicated
        }

        if (fetched.nextCursor) {
          await setAgreementCursor(trx as any, {
            provider: r.provider,
            adapterKey: adapter.key,
            cursor: fetched.nextCursor,
          })
        }
      } catch (err) {
        providerErrors += 1
        const message = String((err as any)?.message ?? err)
        log.error('Bank ingestion fejlede for provider', {
          runId,
          provider: r.provider,
          channel: r.channel,
          message,
        })
        await trx
          .insert(errorLog)
          .values({
            runId,
            source: 'banking',
            errorString: `provider=${r.provider} channel=${r.channel}: ${message}`,
          })
          .catch(() => {})
        continue
      }
    }

    await trx
      .update(run)
      .set({ status: providerErrors > 0 ? 'fejl' : 'udført' })
      .where(eq(run.id, runId))

    return {
      insertedStatements,
      insertedBalances,
      insertedTransactions,
      deduplicated,
    }
  })

  log.info('CAMT.053 dokument indlæst', {
    runId,
    insertedStatements: result.insertedStatements,
    insertedBalances: result.insertedBalances,
    insertedTransactions: result.insertedTransactions,
    deduplicated: result.deduplicated,
  })

  return { runId, insertedCount: result.insertedTransactions }
}
