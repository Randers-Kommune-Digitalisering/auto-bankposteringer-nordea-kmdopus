import { and, eq } from 'drizzle-orm'
import db from '~/lib/db'
import { bankingAgreementDiscoveryRun } from '~/lib/db/schema/bankingAgreementDiscoveryRun'
import { discoverAgreementAccounts } from './discoverAgreementAccounts'
import { logger } from '~/lib/logger'

export async function runAgreementAccountDiscovery(options: { discoveryRunId: string }): Promise<void> {
  const log = logger.child({ scope: 'banking.runAgreementAccountDiscovery', discoveryRunId: options.discoveryRunId })

  const row = await db
    .select()
    .from(bankingAgreementDiscoveryRun)
    .where(eq(bankingAgreementDiscoveryRun.id, options.discoveryRunId))
    .limit(1)
    .then((rows) => rows[0] ?? null)

  if (!row) {
    throw new Error(`Discovery run not found: ${options.discoveryRunId}`)
  }

  if (row.status === 'completed' || row.status === 'failed') {
    log.info('Discovery run already in terminal state, skipping', { status: row.status })
    return
  }

  const now = new Date()
  await db
    .update(bankingAgreementDiscoveryRun)
    .set({
      status: 'running',
      startedAt: row.startedAt ?? now,
      updatedAt: now,
      errorMessage: null,
    })
    .where(and(
      eq(bankingAgreementDiscoveryRun.id, row.id),
      eq(bankingAgreementDiscoveryRun.status, row.status),
    ))

  try {
    const result = await discoverAgreementAccounts({
      provider: row.provider,
      channel: row.channel,
      bookingDate: row.requestedAt,
    })

    await db
      .update(bankingAgreementDiscoveryRun)
      .set({
        status: 'completed',
        finishedAt: new Date(),
        updatedAt: new Date(),
        discoveredAccounts: result.discoveredAccounts,
        inspectedDocuments: result.inspectedDocuments,
        skippedDays: result.skippedDays,
        errorMessage: null,
      })
      .where(eq(bankingAgreementDiscoveryRun.id, row.id))

    log.info('Discovery run completed', {
      discoveredAccounts: result.discoveredAccounts,
      inspectedDocuments: result.inspectedDocuments,
      skippedDays: result.skippedDays,
    })
  } catch (error: any) {
    const message = String(error?.message ?? error)

    await db
      .update(bankingAgreementDiscoveryRun)
      .set({
        status: 'failed',
        finishedAt: new Date(),
        updatedAt: new Date(),
        errorMessage: message,
      })
      .where(eq(bankingAgreementDiscoveryRun.id, row.id))

    log.warn('Discovery run failed', { message })
    throw error
  }
}
