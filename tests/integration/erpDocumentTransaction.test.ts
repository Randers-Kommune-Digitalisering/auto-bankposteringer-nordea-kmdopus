import { afterEach, describe, expect, it } from 'vitest'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

describe('grouped ERP document transaction membership (integration)', () => {
  let cleanup: (() => Promise<void>) | undefined

  afterEach(async () => {
    await cleanup?.()
    cleanup = undefined
  })

  it('links one bilag to all source transactions without assigning its lines to one transaction', async ({ skip }) => {
    const { default: db } = await import('../../app/lib/db')
    const { account } = await import('../../app/lib/db/schema/account')
    const { erpDocument, erpDocumentTransaction, erpRequest, erpRequestLine } = await import('../../app/lib/db/schema/erp')
    const { run } = await import('../../app/lib/db/schema/run')
    const { transaction, transactionProcessing } = await import('../../app/lib/db/schema/transaction')
    const { loadErpRequestView } = await import('../../server/api/fejlhaandtering/erp-requests/[requestId]/view.get')

    let runId: string | undefined
    const accountId = `erp-group-${randomUUID()}`
    const documentId = `ERP-GROUP-${randomUUID()}`
    const requestId = `ERP-REQUEST-${randomUUID()}`
    const transactionIds = [randomUUID(), randomUUID()]
    const bookingDate = new Date(Date.UTC(2092, 2, 4))

    const schemaCheck = await db.execute(sql`
      select to_regclass('public.erp_document_transaction') is not null as ready
    `)
    if (!(schemaCheck.rows[0] as { ready?: boolean } | undefined)?.ready) {
      skip('Apply the regenerated single baseline migration before running grouped ERP recovery integration tests.')
    }

    try {
      const [createdRun] = await db.insert(run).values({ bookingDate, status: 'udført' }).returning({ id: run.id })
      runId = createdRun!.id

      await db.insert(account).values({
        id: accountId,
        provider: 'nordea',
        iban: `DK${randomUUID().replaceAll('-', '').slice(0, 18)}`,
        currency: 'DKK',
      })
      await db.insert(transaction).values(transactionIds.map(id => ({
        id,
        runId: runId!,
        accountId,
        amount: '10.00',
        bookingDate,
        creditDebitIndicator: 'CRDT' as const,
      })))
      await db.insert(transactionProcessing).values(transactionIds.map(transactionId => ({
        transactionId,
        status: 'bogført' as const,
        source: 'manuel' as const,
      })))
      await db.insert(erpDocument).values({ id: documentId, runId: runId!, origin: 'manual' })
      await db.insert(erpRequest).values({ id: requestId, runId: runId!, documentId, payload: '<Request/>' })
      await db.insert(erpRequestLine).values([
        {
          requestId,
          lineNo: 1,
          transactionId: null,
          amount: '20.00',
          debetOrCredit: 'Debet',
          dimensions: { account: '123' },
          postingText: 'Gruppe debet',
        },
        {
          requestId,
          lineNo: 2,
          transactionId: null,
          amount: '20.00',
          debetOrCredit: 'Kredit',
          dimensions: { account: '456' },
          postingText: 'Gruppe kredit',
        },
      ])
      await db.insert(erpDocumentTransaction).values(transactionIds.map(transactionId => ({ documentId, transactionId })))

      const [document] = await db
        .select({ origin: erpDocument.origin })
        .from(erpDocument)
        .where(eq(erpDocument.id, documentId))
      expect(document?.origin).toBe('manual')

      cleanup = async () => {
        await db.delete(erpRequestLine).where(eq(erpRequestLine.requestId, requestId))
        await db.delete(erpRequest).where(eq(erpRequest.id, requestId))
        await db.delete(erpDocumentTransaction).where(eq(erpDocumentTransaction.documentId, documentId))
        await db.delete(erpDocument).where(eq(erpDocument.id, documentId))
        await db.delete(transactionProcessing).where(inArray(transactionProcessing.transactionId, transactionIds))
        await db.delete(transaction).where(inArray(transaction.id, transactionIds))
        await db.delete(account).where(eq(account.id, accountId))
        await db.delete(run).where(eq(run.id, runId!))
      }

      const memberships = await db
        .select({ transactionId: erpDocumentTransaction.transactionId })
        .from(erpDocumentTransaction)
        .where(eq(erpDocumentTransaction.documentId, documentId))

      const lines = await db
        .select({ lineNo: erpRequestLine.lineNo, transactionId: erpRequestLine.transactionId })
        .from(erpRequestLine)
        .where(eq(erpRequestLine.requestId, requestId))

      expect(new Set(memberships.map(row => row.transactionId))).toEqual(new Set(transactionIds))
      expect(lines).toHaveLength(2)
      expect(lines.every(line => line.transactionId === null)).toBe(true)

      const manualView = await loadErpRequestView(requestId)
      expect(manualView.transactions).toEqual([])
      expect(manualView.header.transactionCount).toBe(0)
      expect(manualView.manualPostings).toEqual([
        {
          lineNo: 1,
          amount: '20.00',
          debetOrCredit: 'Debet',
          dimensions: { account: '123' },
          postingText: 'Gruppe debet',
        },
        {
          lineNo: 2,
          amount: '20.00',
          debetOrCredit: 'Kredit',
          dimensions: { account: '456' },
          postingText: 'Gruppe kredit',
        },
      ])

      const [selectedTransactionId] = transactionIds
      const reopened = await db.update(transactionProcessing)
        .set({ status: 'åben' })
        .where(and(
          inArray(transactionProcessing.transactionId, memberships.map(row => row.transactionId)),
          eq(transactionProcessing.transactionId, selectedTransactionId!),
          eq(transactionProcessing.status, 'bogført'),
        ))
        .returning({ transactionId: transactionProcessing.transactionId })

      expect(reopened.map(row => row.transactionId)).toEqual([selectedTransactionId])
      const remaining = await db.select({ status: transactionProcessing.status })
        .from(transactionProcessing)
        .where(eq(transactionProcessing.transactionId, transactionIds[1]!))
      expect(remaining[0]?.status).toBe('bogført')
    } catch (error) {
      if (runId && !cleanup) {
        await db.delete(erpRequestLine).where(eq(erpRequestLine.requestId, requestId))
        await db.delete(erpRequest).where(eq(erpRequest.id, requestId))
        await db.delete(erpDocumentTransaction).where(eq(erpDocumentTransaction.documentId, documentId))
        await db.delete(erpDocument).where(eq(erpDocument.id, documentId))
        await db.delete(transactionProcessing).where(inArray(transactionProcessing.transactionId, transactionIds))
        await db.delete(transaction).where(inArray(transaction.id, transactionIds))
        await db.delete(account).where(eq(account.id, accountId))
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