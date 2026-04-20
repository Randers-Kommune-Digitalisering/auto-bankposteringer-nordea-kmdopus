import { and, eq, inArray } from 'drizzle-orm'
import db from '~/lib/db'
import { run } from '~/lib/db/schema/run'
import { errorLog } from '~/lib/db/schema/error'
import { transaction } from '~/lib/db/schema/transaction'
import { account } from '~/lib/db/schema/account'
import { bankingAgreementAccountDimension } from '~/lib/db/schema/bankingAgreementAccountDimension'
import env from '~/lib/env/env'
import { logger } from '~/lib/logger'
import { matchRun } from '../../matching/handlers/matchRun'
import { submitPostingViaOutbox } from '../../erp-integration/handlers/submitPosting'
import { sendNotificationsForRun } from '../../notifications/handlers/sendNotifications'
import { sendCertificateExpiryAlertsForRun } from '../../notifications/handlers/sendCertificateExpiryAlerts'
import { runTransactionBatch } from './runTransactionBatch'

const REQUIRED_ACCOUNT_DIMENSION_KEY = 'statuskonto'
const LEGACY_REQUIRED_ACCOUNT_DIMENSION_KEY = 'artskonto'

async function pauseRunIfMissingAccountMappings(runId: string): Promise<{
  paused: boolean
  missingIbans: string[]
}> {
  const rows = await db
    .select({
      iban: account.iban,
      provider: account.provider,
    })
    .from(transaction)
    .leftJoin(account, eq(account.id, transaction.accountId))
    .where(eq(transaction.runId, runId))

  const providers = Array.from(new Set(rows.map((r) => (r.provider ? String(r.provider) : '')).filter(Boolean)))
  const ibans = Array.from(new Set(rows.map((r) => (r.iban ? String(r.iban) : '')).filter(Boolean)))

  const dims = providers.length && ibans.length
    ? await db
        .select({
          provider: bankingAgreementAccountDimension.provider,
          iban: bankingAgreementAccountDimension.iban,
          key: bankingAgreementAccountDimension.dimensionKey,
          value: bankingAgreementAccountDimension.dimensionValue,
        })
        .from(bankingAgreementAccountDimension)
        .where(and(
          inArray(bankingAgreementAccountDimension.provider, providers as any),
          inArray(bankingAgreementAccountDimension.iban, ibans),
          inArray(bankingAgreementAccountDimension.dimensionKey, [
            REQUIRED_ACCOUNT_DIMENSION_KEY,
            LEGACY_REQUIRED_ACCOUNT_DIMENSION_KEY,
          ]),
        ))
    : []

  const mapped = new Map<string, string>()
  for (const d of dims) {
    const k = `${String(d.provider)}:${String(d.iban)}`
    if (String(d.key) === REQUIRED_ACCOUNT_DIMENSION_KEY) {
      mapped.set(k, String(d.value))
      continue
    }
    if (!mapped.has(k)) mapped.set(k, String(d.value))
  }

  const missing = rows
    .map((r) => `${String(r.provider ?? '')}:${String(r.iban ?? '')}`)
    .filter((k) => k !== ':' && !mapped.has(k))

  const missingUnique = Array.from(new Set(missing)).sort((a, b) => a.localeCompare(b))

  if (!missingUnique.length) return { paused: false, missingIbans: [] }

  await db.transaction(async (trx) => {
    await trx.update(run).set({ status: 'afventer' }).where(eq(run.id, runId))
    await trx.insert(errorLog).values({
      runId,
      source: 'application',
      errorCode: 409,
      errorString: `Mangler konterings-mapping (${REQUIRED_ACCOUNT_DIMENSION_KEY}) for bankkonto: ${missingUnique.join(', ')}`,
    } as any)
  })

  return { paused: true, missingIbans: missingUnique }
}

export async function runBankIngestionAndPosting(options: {
  runId?: string
  bookingDate?: Date
} = {}): Promise<{ runId: string; insertedCount: number; notificationCount: number }> {
  const log = logger.child({ scope: 'banking.runBankIngestionAndPosting' })

  const ingest = await runTransactionBatch({ runId: options.runId, bookingDate: options.bookingDate })

  const pauseCheck = await pauseRunIfMissingAccountMappings(ingest.runId)
  if (pauseCheck.paused) {
    log.warn('Run sat på pause pga. manglende konto-kontering', { runId: ingest.runId, missing: pauseCheck.missingIbans })
    // Still run system alerts (e.g., expiring bank certificates)
    await sendCertificateExpiryAlertsForRun({ runId: ingest.runId })
    return { runId: ingest.runId, insertedCount: ingest.insertedCount, notificationCount: 0 }
  }

  // After ingestion, perform matching (deterministic, DB-driven)
  const summary = await matchRun(ingest.runId)

  // Submit ERP posting via outbox (already robust/retry-safe)
  if (summary.postings.length) {
    try {
      await submitPostingViaOutbox({
        runId: ingest.runId,
        postings: summary.postings,
        bookingDate: options.bookingDate ?? new Date(),
        erpSupplier: env.ERP_SUPPLIER,
      })
    } catch (err) {
      const message = String((err as any)?.message ?? err)
      log.error('ERP aflevering fejlede (outbox vil retry)', { runId: ingest.runId, message })
      // Surface the error in the run timeline under the ERP step.
      await db
        .insert(errorLog)
        .values({
          runId: ingest.runId,
          source: 'erp',
          errorCode: 502,
          errorString: message,
        } as any)
        .catch(() => {})
      // Do NOT throw: outbox will retry; run should still be considered completed.
    }
  }

  // Notifications are also sent via outbox/SMTP (synchronous submit)
  const notifications = await sendNotificationsForRun({ runId: ingest.runId, summary })

  // System alerts (e.g., expiring bank certificates)
  await sendCertificateExpiryAlertsForRun({ runId: ingest.runId })

  // Mark run as completed (ingestion sets 'udført'; keep it consistent)
  await db.update(run).set({ status: 'udført' }).where(eq(run.id, ingest.runId))

  log.info('Run udført (ingestion+matching+posting+notifications)', {
    runId: ingest.runId,
    insertedCount: ingest.insertedCount,
    postingLines: summary.postings.length,
    notifications: notifications.sent,
  })

  return { runId: ingest.runId, insertedCount: ingest.insertedCount, notificationCount: notifications.sent }
}
