import { afterEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { defineEventHandler } from 'h3'

vi.mock('../../server/auth/requireAppRoles', () => ({
  requireErrorHandlingWriteIdentity: async () => ({ id: 'test-actor', displayName: 'Test' }),
}))

describe('run continuation endpoint (integration)', () => {
  let cleanup: (() => Promise<void>) | undefined

  afterEach(async () => {
    await cleanup?.()
    cleanup = undefined
    vi.unstubAllGlobals()
  })

  it('queues a new bank continuation for a failed stage even when its job succeeded, then rejects a duplicate', async () => {
    const { default: db } = await import('../../app/lib/db')
    const { job } = await import('../../app/lib/db/schema/job')
    const { run } = await import('../../app/lib/db/schema/run')
    const { runTimelineEvent } = await import('../../app/lib/db/schema/runTimelineEvent')

    const [createdRun] = await db.insert(run).values({
      bookingDate: new Date(Date.UTC(2096, 0, Math.floor(Math.random() * 28) + 1)),
      status: 'fejl',
    }).returning({ id: run.id })
    const runId = createdRun!.id

    cleanup = async () => {
      await db.delete(runTimelineEvent).where(eq(runTimelineEvent.runId, runId))
      await db.delete(job).where(eq(job.runId, runId))
      await db.delete(run).where(eq(run.id, runId))
    }

    await db.insert(job).values({
      type: 'banking.ingest',
      status: 'succeeded',
      runId,
      payload: { runId },
      attempts: 0,
      maxAttempts: 1,
    })
    await db.insert(runTimelineEvent).values({
      runId,
      stage: 'banking',
      eventType: 'completed_with_errors',
      status: 'failed',
      detail: 'Bankkilde fejlede.',
    })

    vi.stubGlobal('defineEventHandler', defineEventHandler)
    const { default: continueRun } = await import('../../server/api/runs/[runId]/continue.post')
    const event = { context: { params: { runId } } } as any

    await expect(continueRun(event)).resolves.toMatchObject({
      success: true,
      action: { kind: 'continue-run', stage: 'banking' },
    })

    const jobs = await db.select({ status: job.status }).from(job).where(eq(job.runId, runId))
    expect(jobs.map(row => row.status).sort()).toEqual(['pending', 'succeeded'])

    await expect(continueRun(event)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('retries a failed ERP transport outbox item only once', async () => {
    const { default: db } = await import('../../app/lib/db')
    const { outbox } = await import('../../app/lib/db/schema/outbox')
    const { run } = await import('../../app/lib/db/schema/run')
    const { runTimelineEvent } = await import('../../app/lib/db/schema/runTimelineEvent')

    const [createdRun] = await db.insert(run).values({
      bookingDate: new Date(Date.UTC(2097, 0, Math.floor(Math.random() * 28) + 1)),
      status: 'udført',
    }).returning({ id: run.id })
    const runId = createdRun!.id

    cleanup = async () => {
      await db.delete(runTimelineEvent).where(eq(runTimelineEvent.runId, runId))
      await db.delete(outbox).where(eq(outbox.runId, runId))
      await db.delete(run).where(eq(run.id, runId))
    }

    await db.insert(runTimelineEvent).values([
      { runId, stage: 'banking', eventType: 'completed', status: 'succeeded' },
      { runId, stage: 'matching', eventType: 'completed', status: 'succeeded' },
    ])
    const [failedDelivery] = await db.insert(outbox).values({
      topic: 'erp.uploadPostingXml',
      status: 'failed',
      runId,
      payload: {},
      attempts: 1,
      lastError: 'Connection failed',
    }).returning({ id: outbox.id })

    vi.stubGlobal('defineEventHandler', defineEventHandler)
    const { default: continueRun } = await import('../../server/api/runs/[runId]/continue.post')
    const event = { context: { params: { runId } } } as any

    await expect(continueRun(event)).resolves.toMatchObject({
      success: true,
      action: { kind: 'retry-outbox', outboxId: failedDelivery!.id },
    })

    const [retriedDelivery] = await db
      .select({ status: outbox.status })
      .from(outbox)
      .where(eq(outbox.id, failedDelivery!.id))
    expect(retriedDelivery?.status).toBe('pending')
    await expect(continueRun(event)).rejects.toMatchObject({ statusCode: 409 })
  })
})