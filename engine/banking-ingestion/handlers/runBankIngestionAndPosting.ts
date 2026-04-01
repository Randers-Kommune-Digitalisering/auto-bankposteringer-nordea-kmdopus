import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import { run } from '~/lib/db/schema/run'
import env from '~/lib/env/env'
import { logger } from '~/lib/logger'
import { matchRun } from '../../matching/handlers/matchRun'
import { submitPostingViaOutbox } from '../../erp-integration/handlers/submitPosting'
import { sendNotificationsForRun } from '../../notifications/handlers/sendNotifications'
import { runTransactionBatch } from './runTransactionBatch'

export async function runBankIngestionAndPosting(options: {
  runId?: string
  bookingDate?: Date
} = {}): Promise<{ runId: string; insertedCount: number; notificationCount: number }> {
  const log = logger.child({ scope: 'banking.runBankIngestionAndPosting' })

  const ingest = await runTransactionBatch({ runId: options.runId, bookingDate: options.bookingDate })

  // After ingestion, perform matching (deterministic, DB-driven)
  const summary = await matchRun(ingest.runId)

  // Submit ERP posting via outbox (already robust/retry-safe)
  if (summary.postings.length) {
    await submitPostingViaOutbox({
      runId: ingest.runId,
      postings: summary.postings,
      bookingDate: options.bookingDate ?? new Date(),
      erpSupplier: env.ERP_SUPPLIER,
    })
  }

  // Notifications are also sent via outbox/SMTP (synchronous submit)
  const notifications = await sendNotificationsForRun({ runId: ingest.runId, summary })

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
