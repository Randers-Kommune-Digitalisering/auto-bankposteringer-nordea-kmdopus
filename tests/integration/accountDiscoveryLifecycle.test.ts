import { describe, expect, it } from 'vitest'
import { eq, sql } from 'drizzle-orm'

function isDatabaseReachableError(err: unknown): boolean {
  const message = String((err as any)?.message ?? err)
  return message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')
}

describe('account discovery lifecycle (integration)', () => {
  it('processes started discovery run to completed via worker job', async () => {
    process.env.BANK_ADAPTER = 'local-file'

    const { default: db } = await import('../../app/lib/db')
    const { account } = await import('../../app/lib/db/schema/account')
    const { job } = await import('../../app/lib/db/schema/job')
    const { bankingAgreementDiscoveryRun } = await import('../../app/lib/db/schema/bankingAgreementDiscoveryRun')
    const { enqueueJob } = await import('../../engine/queue/handlers/enqueueJob')
    const { runWorker } = await import('../../engine/queue/handlers/worker')

    try {
      await db.execute(sql`DELETE FROM banking_agreement_discovery_run`)
      await db.execute(sql`DELETE FROM job`)
      await db.execute(sql`DELETE FROM transaction_processing`)
      await db.execute(sql`DELETE FROM "transaction"`)
      await db.execute(sql`DELETE FROM account`)
      await db.execute(sql`DELETE FROM run`)
    } catch (err) {
      if (isDatabaseReachableError(err)) {
        throw new Error(
          `Postgres not reachable for integration test. Start it with: docker compose up -d db\nDATABASE_URL=${process.env.DATABASE_URL}`,
        )
      }
      throw err
    }

    const [created] = await db
      .insert(bankingAgreementDiscoveryRun)
      .values({
        provider: 'nordea',
        channel: 'iso20022',
        status: 'started',
        requestedAt: new Date('2026-07-01T00:00:00.000Z'),
      })
      .returning({ id: bankingAgreementDiscoveryRun.id })

    expect(created?.id).toBeTruthy()

    const jobId = await enqueueJob('banking.accountDiscovery', {
      discoveryRunId: created!.id,
    })

    await db
      .update(bankingAgreementDiscoveryRun)
      .set({ jobId })
      .where(eq(bankingAgreementDiscoveryRun.id, created!.id))

    const workerResult = await runWorker({
      maxJobs: 10,
      maxOutbox: 0,
      processOutbox: false,
      jobTypes: ['banking.accountDiscovery'],
    })

    expect(workerResult.jobs).toBeGreaterThan(0)

    const [runRow] = await db
      .select()
      .from(bankingAgreementDiscoveryRun)
      .where(eq(bankingAgreementDiscoveryRun.id, created!.id))

    expect(runRow).toBeTruthy()
    expect(runRow!.status).toBe('completed')
    expect(runRow!.discoveredAccounts).toBeGreaterThan(0)
    expect(runRow!.inspectedDocuments).toBeGreaterThan(0)
    expect(runRow!.finishedAt).toBeTruthy()

    const [jobRow] = await db
      .select()
      .from(job)
      .where(eq(job.id, jobId))

    expect(jobRow!.status).toBe('succeeded')

    const accounts = await db.select({ id: account.id }).from(account)
    const txCountRes = await db.execute(sql`SELECT count(*)::int AS c FROM "transaction"`)
    const runCountRes = await db.execute(sql`SELECT count(*)::int AS c FROM run`)

    expect(accounts.length).toBeGreaterThan(0)
    expect(Number((txCountRes.rows?.[0] as any)?.c ?? 0)).toBe(0)
    expect(Number((runCountRes.rows?.[0] as any)?.c ?? 0)).toBe(0)
  })

  it('persists failed status when discovery execution throws', async () => {
    process.env.BANK_ADAPTER = ''

    const { default: db } = await import('../../app/lib/db')
    const { job } = await import('../../app/lib/db/schema/job')
    const { bankingAgreementDiscoveryRun } = await import('../../app/lib/db/schema/bankingAgreementDiscoveryRun')
    const { enqueueJob } = await import('../../engine/queue/handlers/enqueueJob')
    const { runWorker } = await import('../../engine/queue/handlers/worker')

    await db.execute(sql`DELETE FROM banking_agreement_discovery_run`)
    await db.execute(sql`DELETE FROM job`)

    const [created] = await db
      .insert(bankingAgreementDiscoveryRun)
      .values({
        provider: 'bankconnect',
        channel: 'iso20022',
        status: 'started',
        requestedAt: new Date('2026-07-01T00:00:00.000Z'),
      })
      .returning({ id: bankingAgreementDiscoveryRun.id })

    const jobId = await enqueueJob('banking.accountDiscovery', {
      discoveryRunId: created!.id,
    })

    await db
      .update(bankingAgreementDiscoveryRun)
      .set({ jobId })
      .where(eq(bankingAgreementDiscoveryRun.id, created!.id))

    const workerResult = await runWorker({
      maxJobs: 1,
      maxOutbox: 0,
      processOutbox: false,
      jobTypes: ['banking.accountDiscovery'],
    })

    expect(workerResult.jobs).toBe(1)

    const [runRow] = await db
      .select()
      .from(bankingAgreementDiscoveryRun)
      .where(eq(bankingAgreementDiscoveryRun.id, created!.id))

    expect(runRow).toBeTruthy()
    expect(runRow!.status).toBe('failed')
    expect(runRow!.errorMessage).toBeTruthy()
    expect(runRow!.finishedAt).toBeTruthy()

    const [jobRow] = await db
      .select()
      .from(job)
      .where(eq(job.id, jobId))

    expect(jobRow).toBeTruthy()
    expect(['pending', 'failed']).toContain(jobRow!.status)
    expect(jobRow!.attempts).toBeGreaterThan(0)
  })
})
