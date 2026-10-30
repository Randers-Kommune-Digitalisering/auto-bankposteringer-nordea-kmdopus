import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { eq, sql } from 'drizzle-orm'

function isDatabaseReachableError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')
}

describe('worker lease recovery (integration)', () => {
  const jobIds: string[] = []
  const outboxIds: string[] = []
  let db: typeof import('../../app/lib/db').default
  let job: typeof import('../../app/lib/db/schema/job').job
  let outbox: typeof import('../../app/lib/db/schema/outbox').outbox

  beforeAll(async () => {
    try {
      ;[db, { job }, { outbox }] = await Promise.all([
        import('../../app/lib/db').then((module) => module.default),
        import('../../app/lib/db/schema/job'),
        import('../../app/lib/db/schema/outbox'),
      ])
      await db.execute(sql`select 1`)
    } catch (err) {
      if (isDatabaseReachableError(err)) {
        throw new Error(
          `Postgres not reachable for integration test. Start it with: docker compose up -d db\nDATABASE_URL=${process.env.DATABASE_URL}`,
        )
      }
      throw err
    }
  })

  afterEach(async () => {
    if (!db) return
    for (const id of jobIds.splice(0)) await db.delete(job).where(eq(job.id, id))
    for (const id of outboxIds.splice(0)) await db.delete(outbox).where(eq(outbox.id, id))
  })

  it('requeues a job whose worker lease expired', async () => {
    const oldLock = new Date(Date.now() - 20 * 60 * 1000)
    const [created] = await db.insert(job).values({
      type: 'banking.ingest',
      status: 'in_progress',
      payload: {},
      attempts: 0,
      maxAttempts: 3,
      runAt: oldLock,
      lockedAt: oldLock,
      lockedBy: `test-expired-${crypto.randomUUID()}`,
    }).returning({ id: job.id })
    jobIds.push(created!.id)

    const { runWorker } = await import('../../engine/queue/handlers/worker')
    await runWorker({ maxJobs: 0, processOutbox: false, jobTypes: ['banking.ingest'] })

    const [recovered] = await db.select().from(job).where(eq(job.id, created!.id))
    expect(recovered).toMatchObject({
      status: 'pending',
      attempts: 1,
      lockedAt: null,
      lockedBy: null,
      lastError: 'Worker lease expired before job completion',
    })
  })

  it('marks an expired outbox lease failed for retry', async () => {
    const oldLock = new Date(Date.now() - 20 * 60 * 1000)
    const [created] = await db.insert(outbox).values({
      topic: 'erp.uploadRequestPayload',
      status: 'processing',
      payload: { requestId: crypto.randomUUID() },
      attempts: 0,
      nextAttemptAt: oldLock,
      lockedAt: oldLock,
      lockedBy: `test-expired-${crypto.randomUUID()}`,
    }).returning({ id: outbox.id })
    outboxIds.push(created!.id)

    const { runWorker } = await import('../../engine/queue/handlers/worker')
    await runWorker({ maxJobs: 0, maxOutbox: 0, processJobs: false })

    const [recovered] = await db.select().from(outbox).where(eq(outbox.id, created!.id))
    expect(recovered).toMatchObject({
      status: 'failed',
      attempts: 1,
      lockedAt: null,
      lockedBy: null,
      lastError: 'Worker lease expired before outbox processing completed',
    })
  })
})
