import { and, desc, eq } from 'drizzle-orm'
import { createError, defineEventHandler, getQuery, setHeader } from 'h3'
import db from '~/lib/db'
import { bankProviderValues } from '~/lib/db/schema/bankingAgreement'
import { bankingAgreementDiscoveryRun } from '~/lib/db/schema/bankingAgreementDiscoveryRun'

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
  }
})
