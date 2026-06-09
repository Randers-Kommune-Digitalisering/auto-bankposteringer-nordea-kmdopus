import { describe, expect, it } from 'vitest'
import { sql } from 'drizzle-orm'

function isDatabaseReachableError(err: unknown): boolean {
  const message = String((err as any)?.message ?? err)
  return message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')
}

describe('discoverAgreementAccounts (integration)', () => {
  it('discovers accounts without ingesting transactions', async () => {
    process.env.BANK_ADAPTER = 'local-file'

    const { default: db } = await import('../../app/lib/db')
    const { account } = await import('../../app/lib/db/schema/account')
    const { discoverAgreementAccounts } = await import('../../engine/banking-ingestion/handlers/discoverAgreementAccounts')

    try {
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

    const result = await discoverAgreementAccounts({
      provider: 'nordea',
      channel: 'iso20022',
      bookingDate: new Date('2026-06-03T00:00:00.000Z'),
    })

    const accounts = await db.select({ id: account.id }).from(account)
    const txCountRes = await db.execute(sql`SELECT count(*)::int AS c FROM "transaction"`)
    const runCountRes = await db.execute(sql`SELECT count(*)::int AS c FROM run`)

    expect(result.inspectedDocuments).toBeGreaterThan(0)
    expect(result.discoveredAccounts).toBeGreaterThan(0)
    expect(accounts.length).toBeGreaterThan(0)
    expect(Number((txCountRes.rows?.[0] as any)?.c ?? 0)).toBe(0)
    expect(Number((runCountRes.rows?.[0] as any)?.c ?? 0)).toBe(0)
  })
})
