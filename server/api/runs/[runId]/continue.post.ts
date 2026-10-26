import { defineEventHandler, createError } from 'h3'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { job } from '~/lib/db/schema/job'
import { outbox } from '~/lib/db/schema/outbox'
import { run } from '~/lib/db/schema/run'
import { runTimelineEvent } from '~/lib/db/schema/runTimelineEvent'
import { resolveRunContinuation } from '~/lib/presenters/runContinuation'
import { withPgAdvisoryLock } from '~/lib/db/advisoryLock'
import { requireErrorHandlingWriteIdentity } from '~~/server/auth/requireAppRoles'
import { createUtcDateTimeString } from '~~/utils/function'

const RETRYABLE_OUTBOX_TOPICS = ['erp.uploadRequestPayload', 'erp.uploadPostingXml']

export default defineEventHandler(async (event) => {
  const actor = await requireErrorHandlingWriteIdentity(event)

  const runId = z.string().uuid().parse(event.context.params?.runId)
  const lock = await withPgAdvisoryLock(`run:continue:${runId}`, async () => {
    return await db.transaction(async (trx) => {
      const [runRow] = await trx
        .select({ id: run.id })
        .from(run)
        .where(eq(run.id, runId))
        .limit(1)
        .for('update')

      if (!runRow) throw createError({ statusCode: 404, statusMessage: 'Kørsel ikke fundet' })

      const jobRows = await trx
        .select({ type: job.type, status: job.status, updatedAt: job.updatedAt })
        .from(job)
        .where(eq(job.runId, runId))
        .orderBy(desc(job.updatedAt))
        .limit(200)

      const outboxRows = await trx
        .select({ id: outbox.id, topic: outbox.topic, status: outbox.status, createdAt: outbox.createdAt })
        .from(outbox)
        .where(eq(outbox.runId, runId))
        .orderBy(desc(outbox.createdAt))
        .limit(500)

      const eventRows = await trx
        .select({
          sequence: runTimelineEvent.sequence,
          stage: runTimelineEvent.stage,
          status: runTimelineEvent.status,
          createdAt: runTimelineEvent.createdAt,
        })
        .from(runTimelineEvent)
        .where(eq(runTimelineEvent.runId, runId))
        .orderBy(desc(runTimelineEvent.createdAt), desc(runTimelineEvent.sequence))
        .limit(500)

      const action = resolveRunContinuation({
        jobs: jobRows.map(row => ({
          type: String(row.type),
          status: String(row.status),
          updatedAt: createUtcDateTimeString(row.updatedAt),
        })),
        outbox: outboxRows.map(row => ({
          id: String(row.id),
          topic: String(row.topic),
          status: String(row.status),
          createdAt: createUtcDateTimeString(row.createdAt),
        })),
        events: eventRows
          .filter((row): row is typeof row & { stage: 'banking' | 'matching' | 'manual' | 'erp' } => (
            row.stage === 'banking' || row.stage === 'matching' || row.stage === 'manual' || row.stage === 'erp'
          ))
          .map(row => ({
            sequence: Number(row.sequence),
            stage: row.stage,
            status: row.status ? String(row.status) : null,
            createdAt: createUtcDateTimeString(row.createdAt),
          })),
      })

      if (!action) {
        throw createError({ statusCode: 409, statusMessage: 'Kørslen har ikke et teknisk trin, der kan genoptages' })
      }

      if (action.kind === 'continue-run') {
        const [failedJob] = await trx
          .select({ id: job.id })
          .from(job)
          .where(and(eq(job.runId, runId), eq(job.type, 'banking.ingest'), eq(job.status, 'failed')))
          .orderBy(desc(job.updatedAt))
          .limit(1)

        let jobId: string
        if (failedJob) {
          const [updatedJob] = await trx
            .update(job)
            .set({ status: 'pending', lockedAt: null, lockedBy: null, runAt: new Date(), updatedAt: new Date() })
            .where(and(eq(job.id, failedJob.id), eq(job.status, 'failed')))
            .returning({ id: job.id })

          if (!updatedJob) {
            throw createError({ statusCode: 409, statusMessage: 'Jobbet er allerede ændret eller genoptaget' })
          }
          jobId = String(updatedJob.id)
        } else {
          const [createdJob] = await trx
            .insert(job)
            .values({
              type: 'banking.ingest',
              status: 'pending',
              runId,
              payload: { runId, source: 'run-continuation' },
              attempts: 0,
              maxAttempts: 1,
              runAt: new Date(),
              updatedAt: new Date(),
            })
            .returning({ id: job.id })

          jobId = String(createdJob!.id)
        }

        await trx.update(run).set({ status: 'afventer' }).where(eq(run.id, runId))
        await trx.insert(runTimelineEvent).values({
          runId,
          stage: action.stage,
          eventType: 'continuation_requested',
          status: 'pending',
          detail: 'Kørslen er sat i kø til fortsættelse.',
          actorId: actor.id,
        })

        return { success: true, action, jobId }
      }

      const [retriedOutbox] = await trx
        .update(outbox)
        .set({ status: 'pending', lockedAt: null, lockedBy: null, nextAttemptAt: new Date() })
        .where(and(
          eq(outbox.id, action.outboxId),
          eq(outbox.runId, runId),
          eq(outbox.status, 'failed'),
          inArray(outbox.topic, RETRYABLE_OUTBOX_TOPICS),
        ))
        .returning({ id: outbox.id })

      if (!retriedOutbox) {
        throw createError({ statusCode: 409, statusMessage: 'ERP-afleveringen er allerede ændret eller genoptaget' })
      }

      await trx.insert(runTimelineEvent).values({
        runId,
        stage: 'erp',
        eventType: 'upload_retry_requested',
        status: 'pending',
        detail: 'ERP-afleveringen er sat i kø til genforsøg.',
        outboxId: retriedOutbox.id,
        actorId: actor.id,
      })

      return { success: true, action, outboxId: String(retriedOutbox.id) }
    })
  })

  if (!lock.acquired) {
    throw createError({ statusCode: 409, statusMessage: 'Kørslen er allerede ved at blive genoptaget' })
  }

  return lock.result
})