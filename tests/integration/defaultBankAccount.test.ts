import { afterEach, describe, expect, it, vi } from 'vitest'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { createApp, createRouter, defineEventHandler, toNodeListener } from 'h3'
import { createServer } from 'node:http'

vi.mock('~~/server/auth/requireAppRoles', () => ({
  requireWriteAccess: vi.fn(async () => undefined),
}))

vi.mock('~~/server/utils/recovery/retryRunsAfterAccountChange', () => ({
  retryRunsAfterAccountChange: vi.fn(async () => undefined),
}))

describe('default bank account settings (integration)', () => {
  let cleanup: (() => Promise<void>) | undefined

  afterEach(async () => {
    await cleanup?.()
    cleanup = undefined
    vi.unstubAllGlobals()
  })

  it('allows selecting, validating, reading, and clearing the default account', async () => {
    const { default: db } = await import('../../app/lib/db')
    const { account } = await import('../../app/lib/db/schema/account')
    const { bankingAgreement } = await import('../../app/lib/db/schema/bankingAgreement')
    const { bankingAgreementAccountDimension } = await import('../../app/lib/db/schema/bankingAgreementAccountDimension')
    const { tenantConfiguration } = await import('../../app/lib/db/schema/rule')
    const accountId = `test-default-${randomUUID()}`
    const ignoredAccountId = `test-ignored-${randomUUID()}`
    const accountIban = `DK${randomUUID().replaceAll('-', '').slice(0, 16)}`
    const ignoredIban = `DK${randomUUID().replaceAll('-', '').slice(0, 16)}`
    const [configuration] = await db
      .select({ defaultBankAccountId: tenantConfiguration.defaultBankAccountId })
      .from(tenantConfiguration)
      .where(eq(tenantConfiguration.id, 1))
      .limit(1)

    if (!configuration) throw new Error('Tenant configuration missing; initialize the integration database first')

    const previousDefault = configuration.defaultBankAccountId
    const [createdAgreement] = await db.insert(bankingAgreement)
      .values({ provider: 'nordea', enabled: false, channel: 'iso20022' })
      .onConflictDoNothing()
      .returning({ provider: bankingAgreement.provider })
    await db.insert(account).values([
      { id: accountId, provider: 'nordea', iban: accountIban, currency: 'DKK', name: 'Default test account' },
      { id: ignoredAccountId, provider: 'nordea', iban: ignoredIban, currency: 'DKK', name: 'Ignored test account' },
    ])
    await db.insert(bankingAgreementAccountDimension).values({
      provider: 'nordea',
      iban: ignoredIban,
      dimensionKey: 'ignore_ingestion',
      dimensionValue: 'true',
    })

    cleanup = async () => {
      await db.update(tenantConfiguration)
        .set({ defaultBankAccountId: previousDefault })
        .where(eq(tenantConfiguration.id, 1))
      await db.delete(bankingAgreementAccountDimension).where(and(
        eq(bankingAgreementAccountDimension.provider, 'nordea'),
        inArray(bankingAgreementAccountDimension.iban, [accountIban, ignoredIban]),
      ))
      await db.delete(account).where(eq(account.id, accountId))
      await db.delete(account).where(eq(account.id, ignoredAccountId))
      if (createdAgreement) {
        await db.delete(bankingAgreement).where(eq(bankingAgreement.provider, 'nordea'))
      }
    }

    vi.stubGlobal('defineEventHandler', defineEventHandler)
    vi.stubGlobal('useStorage', () => ({ removeItem: async () => undefined }))

    const { default: getHandler } = await import('../../server/api/settings/default-bank-account.get')
    const { default: putHandler } = await import('../../server/api/settings/default-bank-account.put')
    const { default: updateAccountHandler } = await import('../../server/api/bank-accounts/[id].put')
    const app = createApp()
    const router = createRouter()
    router.get('/api/settings/default-bank-account', getHandler)
    router.put('/api/settings/default-bank-account', putHandler)
    router.put('/api/bank-accounts/:id', updateAccountHandler)
    app.use(router)

    const server = createServer(toNodeListener(app))
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')

    try {
      const address = server.address()
      if (!address || typeof address === 'string') throw new Error('Test server did not bind a TCP port')
      const baseUrl = `http://127.0.0.1:${address.port}`

      const saveResponse = await fetch(`${baseUrl}/api/settings/default-bank-account`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ defaultBankAccountId: accountId }),
      })
      expect(saveResponse.status).toBe(200)
      expect(await saveResponse.json()).toEqual({ defaultBankAccountId: accountId })

      const readResponse = await fetch(`${baseUrl}/api/settings/default-bank-account`)
      expect(readResponse.status).toBe(200)
      expect(await readResponse.json()).toEqual({ defaultBankAccountId: accountId })

      const unknownResponse = await fetch(`${baseUrl}/api/settings/default-bank-account`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ defaultBankAccountId: 'not-an-account' }),
      })
      expect(unknownResponse.status).toBe(400)

      const ignoreResponse = await fetch(`${baseUrl}/api/bank-accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ignoreIngestion: true }),
      })
      expect(ignoreResponse.status).toBe(200)

      const clearedByIgnoreResponse = await fetch(`${baseUrl}/api/settings/default-bank-account`)
      expect(clearedByIgnoreResponse.status).toBe(200)
      expect(await clearedByIgnoreResponse.json()).toEqual({ defaultBankAccountId: null })

      const ignoredResponse = await fetch(`${baseUrl}/api/settings/default-bank-account`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ defaultBankAccountId: ignoredAccountId }),
      })
      expect(ignoredResponse.status).toBe(400)

      const clearResponse = await fetch(`${baseUrl}/api/settings/default-bank-account`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ defaultBankAccountId: null }),
      })
      expect(clearResponse.status).toBe(200)
      expect(await clearResponse.json()).toEqual({ defaultBankAccountId: null })
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
      })
    }
  }, 15_000)
})