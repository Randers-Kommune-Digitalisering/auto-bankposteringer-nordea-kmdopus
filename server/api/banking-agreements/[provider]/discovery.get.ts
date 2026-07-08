import { and, desc, eq } from 'drizzle-orm'
import { createError, defineEventHandler, getQuery, setHeader } from 'h3'
import db from '~/lib/db'
import { bankProviderValues } from '~/lib/db/schema/bankingAgreement'
import { bankingAgreementDiscoveryRun } from '~/lib/db/schema/bankingAgreementDiscoveryRun'
import { job } from '~/lib/db/schema/job'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const provider = String(event.context.params?.provider ?? '')
  if (!provider || !bankProviderValues.includes(provider as any)) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldig provider' })
  }

  const query = getQuery(event)
  const runId = typeof query.id === 'string' ? query.id.trim() : ''

  const row = runId
    ? await db
        .select()
        .from(bankingAgreementDiscoveryRun)
        .where(and(
          eq(bankingAgreementDiscoveryRun.provider, provider as any),
          eq(bankingAgreementDiscoveryRun.id, runId),
        ))
        .limit(1)
        .then((rows) => rows[0] ?? null)
    : await db
        .select()
        .from(bankingAgreementDiscoveryRun)
        .where(eq(bankingAgreementDiscoveryRun.provider, provider as any))
        .orderBy(desc(bankingAgreementDiscoveryRun.requestedAt))
        .limit(1)
        .then((rows) => rows[0] ?? null)

  if (!row) {
    return null
  }

  const jobRow = row.jobId
    ? await db
        .select({
          status: job.status,
          attempts: job.attempts,
          maxAttempts: job.maxAttempts,
          runAt: job.runAt,
          lockedAt: job.lockedAt,
          lockedBy: job.lockedBy,
          lastError: job.lastError,
          updatedAt: job.updatedAt,
        })
        .from(job)
        .where(eq(job.id, row.jobId))
        .limit(1)
        .then((rows) => rows[0] ?? null)
    : null

  const queuedMs = Date.now() - new Date(row.requestedAt).getTime()
  const workerLikelyMissing = row.status === 'started' && queuedMs > 15_000 && !!jobRow && jobRow.status === 'pending' && !jobRow.lockedAt

  return {
    id: row.id,
    provider: row.provider,
    channel: row.channel,
    status: row.status,
    jobId: row.jobId,
    requestedAt: row.requestedAt?.toISOString() ?? null,
    startedAt: row.startedAt?.toISOString() ?? null,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
    discoveredAccounts: row.discoveredAccounts,
    inspectedDocuments: row.inspectedDocuments,
    skippedDays: row.skippedDays,
    errorMessage: row.errorMessage,
    triggerSource: row.triggerSource,
    diagnostics: {
      queuedMs,
      workerLikelyMissing,
      workerHint: workerLikelyMissing
        ? 'Discovery-job er stadig pending og ikke claimed af en worker. Start worker-service og check worker-logs.'
        : null,
      job: jobRow
        ? {
            status: jobRow.status,
            attempts: jobRow.attempts,
            maxAttempts: jobRow.maxAttempts,
            runAt: jobRow.runAt?.toISOString() ?? null,
            lockedAt: jobRow.lockedAt?.toISOString() ?? null,
            lockedBy: jobRow.lockedBy ?? null,
            lastError: jobRow.lastError ?? null,
            updatedAt: jobRow.updatedAt?.toISOString() ?? null,
          }
        : null,
    },
  }
})
