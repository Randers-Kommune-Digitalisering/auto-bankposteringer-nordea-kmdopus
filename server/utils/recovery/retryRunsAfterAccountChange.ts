import { and, eq, inArray, sql } from 'drizzle-orm'
import db from '~/lib/db'
import { job } from '~/lib/db/schema/job'
import { errorLog } from '~/lib/db/schema/error'
import { enqueueJob } from '#engine/queue/handlers/enqueueJob'
import { logger } from '~/lib/logger'

type SupportedProvider = 'danskebank' | 'nordea' | 'bankconnect'
export type AccountRecoveryReason = 'account-mapping' | 'account-ignored'

export type RetryRunsAfterAccountChangeInput = {
  provider: SupportedProvider
  iban: string
  reason: AccountRecoveryReason
}

export type RetryRunsAfterAccountChangeResult = {
  provider: SupportedProvider
  iban: string
  candidates: string[]
  skippedExistingInFlight: string[]
  enqueuedRunIds: string[]
}

function normalizeIban(value: string): string {
  return String(value ?? '').replace(/\s+/g, '').toUpperCase()
}

function normalizeProvider(value: string): SupportedProvider {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'danskebank' || normalized === 'nordea' || normalized === 'bankconnect') {
    return normalized
  }
  throw new Error(`Ukendt provider for retry-flow: ${value}`)
}

export async function retryRunsAfterAccountChange(input: RetryRunsAfterAccountChangeInput): Promise<RetryRunsAfterAccountChangeResult> {
  const provider = normalizeProvider(input.provider)
  const iban = normalizeIban(input.iban)
  const reason = input.reason
  const log = logger.child({ scope: 'recovery.retryRunsAfterAccountChange', provider, reason })

  if (!iban) {
    return { provider, iban, candidates: [], skippedExistingInFlight: [], enqueuedRunIds: [] }
  }

  const candidateResult = await db.execute(sql`
    select distinct r.id
    from run r
    where r.status = 'afventer'::run_status
      and exists (
        select 1
        from error e
        cross join lateral regexp_split_to_table(
          split_part(e.error_string, 'for bankkonto:', 2),
          ','
        ) as missing_account(value)
        where e.run_id = r.id
          and e.source = 'application'::run_error_source
          and (
            e.error_string ilike 'Mangler konterings-mapping (artskonto)%'
            or e.error_string ilike 'Mangler konterings-mapping (statuskonto)%'
          )
          and lower(btrim(split_part(missing_account.value, ':', 1))) = ${provider}
          and upper(regexp_replace(btrim(split_part(missing_account.value, ':', 2)), '\\s', '', 'g')) = ${iban}
      )
  `)

  const candidates = Array.from(
    new Set(
      (candidateResult.rows ?? [])
        .map((row: any) => String(row.id ?? '').trim())
        .filter(Boolean),
    ),
  )

  if (!candidates.length) {
    log.info('Ingen pauserede mapping-runs fundet til auto-retry')
    return { provider, iban, candidates: [], skippedExistingInFlight: [], enqueuedRunIds: [] }
  }

  const inFlightRows = await db
    .select({ runId: job.runId })
    .from(job)
    .where(and(
      inArray(job.runId, candidates as any),
      eq(job.type, 'banking.ingest'),
      inArray(job.status, ['pending', 'in_progress']),
    ))

  const inFlight = new Set(
    (inFlightRows ?? [])
      .map((row) => String(row.runId ?? '').trim())
      .filter(Boolean),
  )

  const skippedExistingInFlight: string[] = []
  const enqueuedRunIds: string[] = []
  const recoveryMessage = reason === 'account-ignored'
    ? 'Bankkonto markeret til ignorering. Automatisk genkørsel planlagt.'
    : 'Statuskonto-mapping oprettet. Automatisk genkørsel planlagt.'

  for (const runId of candidates) {
    if (inFlight.has(runId)) {
      skippedExistingInFlight.push(runId)
      continue
    }

    await enqueueJob('banking.ingest', { source: 'auto-recovery', recoveryReason: reason }, { runId })
    await db.insert(errorLog).values({
      runId,
      source: 'application',
      errorCode: 202,
      errorString: recoveryMessage,
    } as any).catch(() => {})
    enqueuedRunIds.push(runId)
  }

  log.info('Auto-retry evalueret for kontoændring', {
    candidates: candidates.length,
    skippedExistingInFlight: skippedExistingInFlight.length,
    enqueued: enqueuedRunIds.length,
  })

  return {
    provider,
    iban,
    candidates,
    skippedExistingInFlight,
    enqueuedRunIds,
  }
}