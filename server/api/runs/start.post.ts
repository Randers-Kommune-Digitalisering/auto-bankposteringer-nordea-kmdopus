import { defineEventHandler, createError, readBody } from 'h3'
import crypto from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import db from '~/lib/db'
import { createUtcIsoString, parseIsoDateToUtcDate } from '~~/utils/function'
import { run, runInsertSchema } from '~/lib/db/schema/run'
import { job } from '~/lib/db/schema/job'
import { bankingAgreement } from '~/lib/db/schema/bankingAgreement'
import { withPgAdvisoryLock } from '~/lib/db/advisoryLock'
import { runBankIngestionAndPosting } from '#engine/banking-ingestion/handlers/runBankIngestionAndPosting'

export default defineEventHandler(async (event) => {
  const body = runInsertSchema.safeParse(await readBody(event).catch(() => ({})))

  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldig request body' })
  }

  const bookingDate = parseIsoDateToUtcDate(body.data.bookingDate)
  const bookingDateIso = bookingDate ? createUtcIsoString(bookingDate) : ''

  if (!bookingDate) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldig bookingDate' })
  }

  const enabledAgreements = await db
    .select({ provider: bankingAgreement.provider, channel: bankingAgreement.channel })
    .from(bankingAgreement)
    .where(eq(bankingAgreement.enabled, true))
    .limit(1)

  if (!enabledAgreements.length) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ingen aktive bankaftaler. Aktivér mindst én bankaftale før du starter en kørsel.',
    })
  }

  const lock = await withPgAdvisoryLock(`run:start:${bookingDateIso}`, async () => {
    // Guard against duplicate runs per booking date.
    const existing = await db
      .select({ id: run.id })
      .from(run)
      .where(sql`${run.bookingDate} = ${bookingDateIso}::date`)
      .limit(1)

    if (existing?.[0]?.id) {
      throw createError({
        statusCode: 409,
        statusMessage: `Der findes allerede en kørsel for ${bookingDateIso}`,
      })
    }

    const runId = crypto.randomUUID()
    const jobId = crypto.randomUUID()

    // Pre-create run + job records for observability (timeline timestamps).
    await db.transaction(async (trx) => {
      await trx
        .insert(run)
        .values({ id: runId, bookingDate, status: 'afventer' } as any)
        .onConflictDoNothing({ target: run.id })

      await trx
        .insert(job)
        .values({
          id: jobId,
          type: 'banking.ingest',
          status: 'in_progress',
          runId,
          payload: { bookingDate: bookingDateIso, source: 'manual' },
          attempts: 0,
          maxAttempts: 1,
          runAt: new Date(),
          updatedAt: new Date(),
        } as any)
        .onConflictDoNothing({ target: job.id })
    })

    try {
      const result = await runBankIngestionAndPosting({ runId, bookingDate })

      await db
        .update(job)
        .set({ status: 'succeeded', updatedAt: new Date(), lastError: null } as any)
        .where(eq(job.id, jobId))

      return {
        success: true,
        runId: result.runId,
        bookingDate: bookingDateIso,
        insertedCount: result.insertedCount,
      }
    } catch (err: any) {
      await db
        .update(job)
        .set({ status: 'failed', updatedAt: new Date(), lastError: String(err?.message ?? err) } as any)
        .where(eq(job.id, jobId))

      throw err
    }
  })

  if (!lock.acquired) {
    throw createError({
      statusCode: 409,
      statusMessage: `Kørsel er allerede ved at blive startet for ${bookingDateIso}`,
    })
  }

  return lock.result
})