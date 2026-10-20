import { afterEach, describe, expect, it } from 'vitest'
import { eq, inArray, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

describe('ERP request overview (integration)', () => {
  let cleanup: (() => Promise<void>) | undefined

  afterEach(async () => {
    await cleanup?.()
    cleanup = undefined
  })

  it('filters and paginates by runs while collapsing resend attempts to latest document status', async ({ skip }) => {
    const { default: db } = await import('../../app/lib/db')
    const { account } = await import('../../app/lib/db/schema/account')
    const { erpDocument, erpDocumentTransaction, erpRequest, erpRequestLine, erpResponse } = await import('../../app/lib/db/schema/erp')
    const { outbox } = await import('../../app/lib/db/schema/outbox')
    const { run } = await import('../../app/lib/db/schema/run')
    const { transaction } = await import('../../app/lib/db/schema/transaction')
    const { listErpRequestOverview } = await import('../../server/api/fejlhaandtering/erp-requests/failed.get')

    const accountId = `erp-overview-${randomUUID()}`
    const runDates = [new Date(Date.UTC(2092, 2, 4)), new Date(Date.UTC(2092, 2, 5))]
    const transactionIds = [randomUUID(), randomUUID(), randomUUID()]
    const documentIds = [`ERP-OVERVIEW-A-${randomUUID()}`, `ERP-OVERVIEW-M-${randomUUID()}`, `ERP-OVERVIEW-B-${randomUUID()}`]
    const requestIds = [`erp-overview-initial-${randomUUID()}`, `erp-overview-resend-${randomUUID()}`, `erp-overview-manual-${randomUUID()}`, `erp-overview-batch-${randomUUID()}`]
    const runIds: string[] = []

    const schemaCheck = await db.execute(sql`
      select
        to_regclass('public.erp_document_transaction') is not null
        and to_regclass('public.run_timeline_event') is not null as ready
    `)
    if (!(schemaCheck.rows[0] as { ready?: boolean } | undefined)?.ready) {
      skip('Apply the regenerated single baseline migration before running ERP overview integration tests.')
    }

    try {
      const createdRuns = await db.insert(run).values(runDates.map(bookingDate => ({
        bookingDate,
        status: 'udført' as const,
      }))).returning({ id: run.id })
      runIds.push(...createdRuns.map(row => row.id))

      await db.insert(account).values({
        id: accountId,
        provider: 'nordea',
        iban: `DK${randomUUID().replaceAll('-', '').slice(0, 18)}`,
        currency: 'DKK',
      })
      await db.insert(transaction).values(transactionIds.map((id, index) => ({
        id,
        runId: index < 2 ? runIds[0]! : runIds[1]!,
        accountId,
        amount: '10.00',
        bookingDate: runDates[index < 2 ? 0 : 1]!,
        creditDebitIndicator: 'CRDT' as const,
      })))
      await db.insert(erpDocument).values([
        { id: documentIds[0]!, runId: runIds[0]!, origin: 'batch' },
        { id: documentIds[1]!, runId: runIds[0]!, origin: 'manual' },
        { id: documentIds[2]!, runId: runIds[1]!, origin: 'batch' },
      ])
      await db.insert(erpDocumentTransaction).values([
        { documentId: documentIds[0]!, transactionId: transactionIds[0]! },
        { documentId: documentIds[1]!, transactionId: transactionIds[1]! },
        { documentId: documentIds[2]!, transactionId: transactionIds[2]! },
      ])
      await db.insert(erpRequest).values([
        { id: requestIds[0]!, runId: runIds[0]!, documentId: documentIds[0]! },
        { id: requestIds[1]!, runId: runIds[0]!, sourceRequestId: requestIds[0]!, documentId: documentIds[0]! },
        { id: requestIds[2]!, runId: runIds[0]!, documentId: documentIds[1]! },
        { id: requestIds[3]!, runId: runIds[1]!, documentId: documentIds[2]! },
      ])
      await db.insert(erpRequestLine).values([
        { requestId: requestIds[0]!, lineNo: 1, transactionId: transactionIds[0]! },
        { requestId: requestIds[1]!, lineNo: 1, transactionId: transactionIds[0]! },
        { requestId: requestIds[2]!, lineNo: 1, transactionId: null, postingText: 'Manuel testpostering' },
        { requestId: requestIds[3]!, lineNo: 1, transactionId: transactionIds[2]! },
      ])
      await db.insert(erpResponse).values([
        { id: `erp-overview-error-${randomUUID()}`, requestId: requestIds[0]!, statusText: 'FEJL - oprindeligt svar' },
        { id: `erp-overview-ok-${randomUUID()}`, requestId: requestIds[2]!, statusText: 'OK' },
      ])
      await db.insert(outbox).values([
        {
          topic: 'erp.uploadRequestPayload',
          runId: runIds[0]!,
          dedupeKey: `erp.upload:${requestIds[0]}`,
          payload: { requestId: requestIds[0]! },
          status: 'sent',
          createdAt: new Date('2092-03-04T10:00:00.000Z'),
        },
        {
          topic: 'erp.uploadRequestPayload',
          runId: runIds[0]!,
          dedupeKey: `erp.upload:${requestIds[1]}`,
          payload: { requestId: requestIds[1]! },
          status: 'pending',
          createdAt: new Date('2092-03-04T11:00:00.000Z'),
        },
        {
          topic: 'erp.uploadRequestPayload',
          runId: runIds[0]!,
          dedupeKey: `erp.upload:${requestIds[2]}`,
          payload: { requestId: requestIds[2]! },
          status: 'sent',
          createdAt: new Date('2092-03-04T10:30:00.000Z'),
        },
        {
          topic: 'erp.uploadRequestPayload',
          runId: runIds[1]!,
          dedupeKey: `erp.upload:${requestIds[3]}`,
          payload: { requestId: requestIds[3]! },
          status: 'sent',
          createdAt: new Date('2092-03-05T10:00:00.000Z'),
        },
      ])

      cleanup = async () => {
        await db.delete(outbox).where(inArray(outbox.dedupeKey, requestIds.map(id => `erp.upload:${id}`)))
        await db.delete(erpResponse).where(inArray(erpResponse.requestId, requestIds))
        await db.delete(erpRequestLine).where(inArray(erpRequestLine.requestId, requestIds))
        await db.delete(erpRequest).where(inArray(erpRequest.id, requestIds))
        await db.delete(erpDocumentTransaction).where(inArray(erpDocumentTransaction.documentId, documentIds))
        await db.delete(erpDocument).where(inArray(erpDocument.id, documentIds))
        await db.delete(transaction).where(inArray(transaction.id, transactionIds))
        await db.delete(account).where(eq(account.id, accountId))
        await db.delete(run).where(inArray(run.id, runIds))
      }

      const latestPage = await listErpRequestOverview({
        start: '2092-03-04',
        end: '2092-03-05',
        page: 1,
        pageSize: 1,
      })
      expect(latestPage.total).toBe(2)
      expect(latestPage.items.map(item => item.requestId)).toEqual([requestIds[3]])
      expect(latestPage.items[0]?.group.transactionCount).toBe(1)
      expect(latestPage.items[0]?.group.childCount).toBe(0)

      const earlierPage = await listErpRequestOverview({
        start: '2092-03-04',
        end: '2092-03-05',
        page: 2,
        pageSize: 1,
      })
      expect(earlierPage.total).toBe(2)
      expect(earlierPage.items.map(item => item.requestId)).toEqual([requestIds[2]])
      expect(earlierPage.items[0]?.statusLabel).toBe('Accepteret')
      expect(earlierPage.items[0]?.group.requestId).toBe(requestIds[1])
      expect(earlierPage.items[0]?.group.groupLabel).toBe('Batchpostering')
      expect(earlierPage.items[0]?.group.transactionCount).toBe(2)
      expect(earlierPage.items[0]?.group.childCount).toBe(1)
      expect(earlierPage.items[0]?.transactionCount).toBe(1)
      expect(earlierPage.items[0]?.group.statusLabel).toBe('Afventer')

      const filteredPage = await listErpRequestOverview({
        start: '2092-03-04',
        end: '2092-03-04',
        page: 1,
        pageSize: 25,
      })
      expect(filteredPage.total).toBe(1)
      expect(filteredPage.items).toHaveLength(1)
    } catch (error) {
      if (!cleanup && runIds.length) {
        await db.delete(outbox).where(inArray(outbox.dedupeKey, requestIds.map(id => `erp.upload:${id}`)))
        await db.delete(erpResponse).where(inArray(erpResponse.requestId, requestIds))
        await db.delete(erpRequestLine).where(inArray(erpRequestLine.requestId, requestIds))
        await db.delete(erpRequest).where(inArray(erpRequest.id, requestIds))
        await db.delete(erpDocumentTransaction).where(inArray(erpDocumentTransaction.documentId, documentIds))
        await db.delete(erpDocument).where(inArray(erpDocument.id, documentIds))
        await db.delete(transaction).where(inArray(transaction.id, transactionIds))
        await db.delete(account).where(eq(account.id, accountId))
        await db.delete(run).where(inArray(run.id, runIds))
      }
      throw error
    }
  }, 20_000)
})
