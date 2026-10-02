import { afterEach, describe, expect, it } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

describe('transaction booking locks (integration)', () => {
  let cleanup: (() => Promise<void>) | undefined

  afterEach(async () => {
    await cleanup?.()
    cleanup = undefined
  })

  it('claims a full semantic group, rejects another owner, and allows reclaim after release or expiry', async () => {
    const { default: db } = await import('../../app/lib/db')
    const { account } = await import('../../app/lib/db/schema/account')
    const { bankingDocument, bankingStatement } = await import('../../app/lib/db/schema/statement')
    const { run } = await import('../../app/lib/db/schema/run')
    const { transaction, transactionProcessing } = await import('../../app/lib/db/schema/transaction')
    const { MANUAL_BOOKING_LOCK_LEASE_MS } = await import('../../engine/manual-booking/domain/bookingLease')
    const {
      acquireTransactionBookingLock,
      releaseTransactionBookingLock,
      verifyTransactionBookingLock,
    } = await import('../../server/utils/transactionBookingLock')

    let runId: string | undefined
    let accountId: string | undefined
    let documentId: string | undefined
    let statementId: string | undefined
    const transactionIds = [randomUUID(), randomUUID()]
    const firstUser = { id: 'https://issuer.example:subject-a', displayName: 'Ada Hansen' }
    const secondUser = { id: 'https://issuer.example:subject-b', displayName: 'Bo Jensen' }

    try {
      const bookingDate = new Date(Date.UTC(2091, 0, 2))
      const createdRun = await db.insert(run).values({ bookingDate, status: 'afventer' }).returning({ id: run.id })
      runId = createdRun[0]!.id

      accountId = `booking-lock-${randomUUID()}`
      await db.insert(account).values({
        id: accountId,
        provider: 'nordea',
        iban: `DK${randomUUID().replaceAll('-', '').slice(0, 18)}`,
        currency: 'DKK',
      })

      const createdDocument = await db.insert(bankingDocument).values({
        accountId,
        format: 'camt053',
        content: '<Document/>',
        contentHash: randomUUID(),
      }).returning({ id: bankingDocument.id })
      documentId = createdDocument[0]!.id

      const createdStatement = await db.insert(bankingStatement).values({
        documentId,
        statementId: `booking-lock-${randomUUID()}`,
      }).returning({ id: bankingStatement.id })
      statementId = createdStatement[0]!.id

      await db.insert(transaction).values(transactionIds.map((id, index) => ({
        id,
        runId: runId!,
        accountId: accountId!,
        statementId: statementId!,
        entryIndex: 1,
        entrySubIndex: index + 1,
        amount: '10.00',
        bookingDate,
        creditDebitIndicator: 'CRDT' as const,
        ntryRef: 'Shared batch',
        ntryAcctSvcrRef: 'Shared entry',
      })))

      cleanup = async () => {
        await db.delete(transactionProcessing).where(inArray(transactionProcessing.transactionId, transactionIds))
        await db.delete(transaction).where(eq(transaction.runId, runId!))
        await db.delete(bankingStatement).where(eq(bankingStatement.id, statementId!))
        await db.delete(bankingDocument).where(eq(bankingDocument.id, documentId!))
        await db.delete(account).where(eq(account.id, accountId!))
        await db.delete(run).where(eq(run.id, runId!))
      }

      const claim = await acquireTransactionBookingLock(transactionIds[0]!, firstUser)
      expect(claim.acquired).toBe(true)

      const conflict = await acquireTransactionBookingLock(transactionIds[1]!, secondUser)
      expect(conflict).toEqual({ acquired: false, ownerName: firstUser.displayName })

      await expect(verifyTransactionBookingLock(transactionIds[0]!, secondUser, transactionIds))
        .rejects.toMatchObject({ statusCode: 409 })

      const renewed = await acquireTransactionBookingLock(transactionIds[0]!, firstUser, true)
      expect(renewed.acquired).toBe(true)

      const release = await releaseTransactionBookingLock(transactionIds[0]!, firstUser)
      expect(release.released).toBe(2)
      expect((await acquireTransactionBookingLock(transactionIds[1]!, secondUser)).acquired).toBe(true)

      await db.update(transactionProcessing)
        .set({ lockedAt: new Date(Date.now() - MANUAL_BOOKING_LOCK_LEASE_MS - 1) })
        .where(inArray(transactionProcessing.transactionId, transactionIds))
      expect((await acquireTransactionBookingLock(transactionIds[0]!, firstUser)).acquired).toBe(true)
    } catch (error) {
      if (runId && !cleanup) {
        await db.delete(transactionProcessing).where(inArray(transactionProcessing.transactionId, transactionIds))
        await db.delete(transaction).where(eq(transaction.runId, runId))
        if (statementId) await db.delete(bankingStatement).where(eq(bankingStatement.id, statementId))
        if (documentId) await db.delete(bankingDocument).where(eq(bankingDocument.id, documentId))
        if (accountId) await db.delete(account).where(eq(account.id, accountId))
        await db.delete(run).where(eq(run.id, runId))
      }

      const message = String((error as { message?: unknown })?.message ?? error)
      if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
        throw new Error(`Postgres not reachable for integration test. Start it with: docker compose up -d db\n${message}`)
      }
      throw error
    }
  }, 15_000)
})