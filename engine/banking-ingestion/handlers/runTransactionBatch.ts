import crypto from 'node:crypto'
import { join } from 'node:path'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import db from '~/lib/db'
import { run } from '~/lib/db/schema/run'
import { errorLog } from '~/lib/db/schema/error'
import { runTimelineEvent } from '~/lib/db/schema/runTimelineEvent'
import { logger } from '~/lib/logger'
import { LocalFileBankAdapter } from '../infrastructure/localFileBankAdapter'
import type { FetchedBankDocument } from '../ports/bankAdapter'
import { buildBankMeta } from '~~/utils/function'
import { bankingAgreement } from '~/lib/db/schema/bankingAgreement'
import { transaction } from '~/lib/db/schema/transaction'
import type { BankProvider, BankChannel } from '~/lib/db/schema/bankingAgreement'
import { getAgreementCursor, setAgreementCursor } from './bankingAgreementCursorStore'
import {
  persistPreparedCamt053Document,
  prepareCamt053Document,
} from './ingestCamt053Document'
import { runNordeaRestIngestion } from '../infrastructure/nordea/rest/ingest'

function toDateOnlyUtc(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function toDateOnly(value: Date | string): string {
  return value instanceof Date
    ? toDateOnlyUtc(value)
    : /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value
      : toDateOnlyUtc(new Date(value))
}

export function shouldFetchBankDocuments(
  existingRunTransactionCount: number,
  latestBankingCompletion?: { eventType: string; status: string | null },
): boolean {
  return existingRunTransactionCount === 0
    || !latestBankingCompletion
    || latestBankingCompletion.eventType === 'completed_with_errors'
    || latestBankingCompletion.status === 'failed'
}

function extractErrorDetails(err: unknown): {
  message: string
  name?: string
  code?: string
  causeMessage?: string
} {
  const anyErr = err as {
    message?: unknown
    name?: unknown
    code?: unknown
    cause?: { message?: unknown } | unknown
  }

  const message = String(anyErr?.message ?? err)
  const name = typeof anyErr?.name === 'string' ? anyErr.name : undefined
  const code = typeof anyErr?.code === 'string' ? anyErr.code : undefined
  const causeMessage = typeof (anyErr?.cause as any)?.message === 'string'
    ? String((anyErr.cause as any).message)
    : undefined

  return { message, name, code, causeMessage }
}

function createBankAdapter(
  input: {
    provider: BankProvider
    adapterKeyOverride: string | null
    examplePath: string
  },
) {
  if (input.adapterKeyOverride === 'local-file') {
    return new LocalFileBankAdapter({
      key: 'nordea-example-file',
      filePath: input.examplePath,
      filename: 'camt.053e.xml',
    })
  }
  if (input.adapterKeyOverride === 'danskebank-edi-ws' || input.provider === 'danskebank') {
    return buildBankMeta('danskebank')
  }
  if (input.adapterKeyOverride === 'nordea-corporate-access-ws' || input.provider === 'nordea') {
    return buildBankMeta('nordea')
  }
  if (input.provider === 'bankconnect') {
    throw new Error('BankConnect adapter er ikke implementeret endnu')
  }
  throw new Error(`Ingen adapter implementeret for provider=${input.provider}`)
}

async function recordProviderFailure(input: {
  runId: string
  provider: BankProvider
  channel: BankChannel
  error: unknown
}): Promise<void> {
  const errorDetails = extractErrorDetails(input.error)
  const diagnosticParts = [
    errorDetails.message,
    errorDetails.name ? `name=${errorDetails.name}` : null,
    errorDetails.code ? `code=${errorDetails.code}` : null,
    errorDetails.causeMessage ? `cause=${errorDetails.causeMessage}` : null,
  ].filter(Boolean)

  await db.transaction(async (trx) => {
    await trx.insert(errorLog).values({
      runId: input.runId,
      source: 'banking',
      errorString: `provider=${input.provider} channel=${input.channel}: ${diagnosticParts.join(' | ')}`,
    })
    await trx.insert(runTimelineEvent).values({
      runId: input.runId,
      stage: 'banking',
      eventType: 'provider_failed',
      detail: 'Hentning fra en bankkilde fejlede.',
      createdAt: sql`clock_timestamp()`,
    })
  })

  logger.child({ scope: 'banking.runTransactionBatch' }).error('Bank ingestion fejlede for provider', {
    runId: input.runId,
    provider: input.provider,
    channel: input.channel,
    message: errorDetails.message,
    errorName: errorDetails.name,
    errorCode: errorDetails.code,
    errorCauseMessage: errorDetails.causeMessage,
    error: input.error,
  })
}

export async function runTransactionBatch(
  options: { runId?: string; bookingDate?: Date } = {},
): Promise<{ runId: string; insertedCount: number }> {
  const log = logger.child({ scope: 'banking.runTransactionBatch' })
  const runId = options.runId ?? crypto.randomUUID()
  const bookingDate = options.bookingDate ?? new Date()
  const bookingDateOnly = toDateOnlyUtc(bookingDate)

  const agreements = await db
    .select()
    .from(bankingAgreement)
    .where(eq(bankingAgreement.enabled, true))
    .orderBy(asc(bankingAgreement.provider))

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
    ? adapterKeyOverride === 'danskebank-edi-ws'
      ? [{ provider: 'danskebank', channel: 'iso20022' }]
      : adapterKeyOverride === 'nordea-corporate-access-ws' || adapterKeyOverride === 'local-file'
        ? [{ provider: 'nordea', channel: 'iso20022' }]
        : []
    : []
  const runs: Array<{ provider: BankProvider; channel: BankChannel }> = agreements.length
    ? agreements.map((agreement) => ({
        provider: agreement.provider as BankProvider,
        channel: agreement.channel as BankChannel,
      }))
    : overrideRun

  await db.transaction(async (trx) => {
    if (runs.length) {
      await trx
        .insert(bankingAgreement)
        .values(runs.map((entry) => ({ provider: entry.provider, enabled: false })))
        .onConflictDoNothing({ target: bankingAgreement.provider })
    }

    await trx
      .insert(run)
      .values({ id: runId, bookingDate, status: 'indlæser' })
      .onConflictDoUpdate({
        target: run.id,
        set: { bookingDate, status: 'indlæser' },
      })

    await trx.insert(runTimelineEvent).values({
      runId,
      stage: 'banking',
      eventType: 'started',
      status: 'in_progress',
      detail: 'Bankhentning startet.',
      createdAt: sql`clock_timestamp()`,
    })
  })

  const existingRunTxCountRows = await db
    .select({ total: sql<number>`count(*)` })
    .from(transaction)
    .where(eq(transaction.runId, runId))
    .limit(1)
  const existingRunTxCount = Number(existingRunTxCountRows[0]?.total ?? 0)
  const existingBookingDateTxCountRows = await db.execute(sql`
    select count(*)::int as total
    from "transaction" t
    inner join run r on r.id = t.run_id
    where r.booking_date = ${bookingDateOnly}::date
  `)
  const existingBookingDateTxCount = Number((existingBookingDateTxCountRows.rows?.[0] as any)?.total ?? 0)
  const latestBankingCompletion = await db
    .select({ eventType: runTimelineEvent.eventType, status: runTimelineEvent.status })
    .from(runTimelineEvent)
    .where(and(
      eq(runTimelineEvent.runId, runId),
      eq(runTimelineEvent.stage, 'banking'),
      inArray(runTimelineEvent.eventType, ['completed', 'completed_with_errors']),
    ))
    .orderBy(desc(runTimelineEvent.createdAt), desc(runTimelineEvent.sequence))
    .limit(1)
  const shouldFetchFromBank = shouldFetchBankDocuments(existingRunTxCount, latestBankingCompletion[0])

  let insertedStatements = 0
  let insertedBalances = 0
  let insertedTransactions = 0
  let deduplicated = false
  let providerErrors = 0

  if (!shouldFetchFromBank) {
    deduplicated = true
    await db.transaction(async (trx) => {
      await trx.insert(errorLog).values({
        runId,
        source: 'banking',
        errorCode: 208,
        errorString: `Genbruger eksisterende bankdata i DB for bogføringsdato ${bookingDateOnly}. Bankkald er sprunget over.`,
      } as any)
      await trx.insert(runTimelineEvent).values({
        runId,
        stage: 'banking',
        eventType: 'existing_data_reused',
        detail: 'Eksisterende bankdata genbrugt; bankkald sprunget over.',
        createdAt: sql`clock_timestamp()`,
      })
    })
    log.info('Genbruger eksisterende transaktioner i DB for run - springer bankkald over', {
      runId,
      bookingDate: bookingDateOnly,
      existingRunTxCount,
      existingBookingDateTxCount,
    })
  }

  for (const entry of shouldFetchFromBank ? runs : []) {
    try {
      if (entry.channel === 'rest') {
        if (entry.provider !== 'nordea') {
          throw new Error(`REST-kanalen er ikke implementeret endnu for ${entry.provider}`)
        }
        const nordea = await runNordeaRestIngestion({ runId, bookingDate })
        insertedStatements += nordea.insertedStatements
        insertedBalances += nordea.insertedBalances
        insertedTransactions += nordea.insertedTransactions
        deduplicated = deduplicated || nordea.deduplicated
        continue
      }

      const adapter = createBankAdapter({
        provider: entry.provider,
        adapterKeyOverride,
        examplePath,
      })
      const persistedCursor = await getAgreementCursor(db as any, {
        provider: entry.provider,
        adapterKey: adapter.key,
      })
      const fetched = await adapter.fetchDocuments({
        accountId: `provider:${entry.provider}`,
        cursor: persistedCursor,
        limit: 25,
        bookingDate: bookingDateOnly,
      })
      const preparedDocuments = fetched.documents
        .filter((document: FetchedBankDocument) => document.format === 'camt053')
        .map((document: FetchedBankDocument) => prepareCamt053Document({
          filename: document.filename ?? null,
          xml: document.content,
        }))

      await db.transaction(async (trx) => {
        for (const prepared of preparedDocuments) {
          const result = await persistPreparedCamt053Document(trx as any, {
            runId,
            provider: entry.provider,
            prepared,
          })
          insertedStatements += result.insertedStatements
          insertedBalances += result.insertedBalances
          insertedTransactions += result.insertedTransactions
          deduplicated = deduplicated || result.deduplicated
        }

        if (fetched.nextCursor) {
          await setAgreementCursor(trx as any, {
            provider: entry.provider,
            adapterKey: adapter.key,
            cursor: fetched.nextCursor,
          })
        }
      })
    } catch (error) {
      providerErrors += 1
      await recordProviderFailure({
        runId,
        provider: entry.provider,
        channel: entry.channel,
        error,
      })
    }
  }

  const result = await db.transaction(async (trx) => {
    const offDateRows = await trx
      .select({ id: transaction.id, bookingDate: transaction.bookingDate })
      .from(transaction)
      .where(and(
        eq(transaction.runId, runId),
        sql`${transaction.bookingDate} <> ${bookingDateOnly}::date`,
      ))

    if (offDateRows.length > 0) {
      if (options.bookingDate) {
        const offDateIds = offDateRows.map((row) => row.id)
        if (offDateIds.length) {
          await trx.delete(transaction).where(inArray(transaction.id, offDateIds))
          log.info('Fjernede transaktioner uden for valgt bogføringsdato', {
            runId,
            selectedBookingDate: bookingDateOnly,
            removedTransactions: offDateIds.length,
          })
        }
      } else {
        const txIdsByBookingDate = new Map<string, string[]>()
        for (const row of offDateRows) {
          const dateOnly = toDateOnly(row.bookingDate)
          const txIds = txIdsByBookingDate.get(dateOnly) ?? []
          txIds.push(row.id)
          txIdsByBookingDate.set(dateOnly, txIds)
        }

        for (const [dateOnly, txIds] of txIdsByBookingDate) {
          const existingRun = await trx
            .select({ id: run.id })
            .from(run)
            .where(sql`${run.bookingDate} = ${dateOnly}::date`)
            .limit(1)
          const targetRunId = existingRun[0]?.id ?? crypto.randomUUID()
          if (!existingRun[0]?.id) {
            await trx.insert(run).values({
              id: targetRunId,
              bookingDate: new Date(`${dateOnly}T00:00:00.000Z`),
              status: 'udført',
            })
          }
          await trx.update(transaction).set({ runId: targetRunId }).where(inArray(transaction.id, txIds))
          log.info('Flyttede transaktioner til matchende bogføringsdato-run', {
            sourceRunId: runId,
            targetRunId,
            bookingDate: dateOnly,
            movedTransactions: txIds.length,
          })
        }
      }
    }

    const runTxCountRows = await trx
      .select({ total: sql<number>`count(*)` })
      .from(transaction)
      .where(eq(transaction.runId, runId))
      .limit(1)
    const runInsertedCount = Number(runTxCountRows[0]?.total ?? 0)

    await trx
      .update(run)
      .set({ status: providerErrors > 0 ? 'fejl' : 'udført' })
      .where(eq(run.id, runId))
    await trx.insert(runTimelineEvent).values({
      runId,
      stage: 'banking',
      eventType: providerErrors > 0 ? 'completed_with_errors' : 'completed',
      status: providerErrors > 0 ? 'failed' : 'succeeded',
      detail: providerErrors > 0
        ? `Bankhentning afsluttet med ${providerErrors} fejl.`
        : `Bankhentning afsluttet. ${runInsertedCount} transaktioner tilgængelige.`,
      createdAt: sql`clock_timestamp()`,
    })

    return {
      insertedStatements,
      insertedBalances,
      insertedTransactions: runInsertedCount,
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
