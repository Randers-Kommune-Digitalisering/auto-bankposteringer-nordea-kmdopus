import { once } from 'node:events'
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { createApp, createRouter, toNodeListener } from 'h3'
import { describe, expect, it } from 'vitest'
import { eq, inArray } from 'drizzle-orm'

import { selectPaginatedTransactionKeys } from '../../server/utils/transactions/selectPaginatedTransactionKeys'

describe('aggregate transaction pagination (integration)', () => {
  it('paginates CAMT entries without exposing or grouping underlying transactions', async () => {
    const { default: db } = await import('../../app/lib/db/index')
    const { run } = await import('../../app/lib/db/schema/run')
    const { account } = await import('../../app/lib/db/schema/account')
    const { bankingDocument, bankingStatement, bankingStatementBalance } = await import(
      '../../app/lib/db/schema/statement'
    )
    const { transaction, transactionProcessing, transactionCodeCatalog } = await import(
      '../../app/lib/db/schema/transaction'
    )

    const suffix = randomUUID()
    const accountId = `pagination-${suffix}`
    const runId = randomUUID()
    const ids = [randomUUID(), randomUUID(), randomUUID()]
    const typeCodes = [`PRTRY:${suffix}-Zulu`, `PRTRY:${suffix}-Beta`, `PRTRY:${suffix}-Aardvark`]
    const testYear = 2200 + Number.parseInt(suffix.slice(0, 3), 16) % 1000
    const bookingDates = [
      new Date(Date.UTC(testYear, 0, 3)),
      new Date(Date.UTC(testYear, 0, 4)),
      new Date(Date.UTC(testYear, 0, 5)),
    ]

    let documentId: number | undefined
    let statementId: number | undefined
    let cleanup: (() => Promise<void>) | undefined
    let databaseInitialized = false

    try {
      await db.insert(run).values({ id: runId, bookingDate: bookingDates[0]!, status: 'indlæser' })
      databaseInitialized = true
      await db.insert(account).values({
        id: accountId,
        provider: 'nordea',
        iban: `DK${suffix.replaceAll('-', '').slice(0, 18)}`,
        currency: 'DKK',
      })
      await db.insert(transactionCodeCatalog).values([
        { provider: 'nordea', codeKey: typeCodes[0]!, displayName: 'Zulu' },
        { provider: 'nordea', codeKey: typeCodes[1]!, displayName: 'Beta' },
        { provider: 'nordea', codeKey: typeCodes[2]!, displayName: 'Aardvark' },
      ])

      const createdDocument = await db.insert(bankingDocument).values({
        accountId,
        format: 'camt053',
        contentHash: randomUUID(),
      }).returning({ id: bankingDocument.id })
      documentId = createdDocument[0]!.id

      const createdStatement = await db.insert(bankingStatement).values({
        documentId,
        statementId: `pagination-${suffix}`,
      }).returning({ id: bankingStatement.id })
      statementId = createdStatement[0]!.id
      await db.insert(bankingStatementBalance).values({
        statementId,
        typeCode: 'OPBD',
        amount: '100.00',
        creditDebitIndicator: 'CRDT',
      })

      await db.insert(transaction).values([
        {
          id: ids[0]!, runId, accountId, statementId, entryIndex: 1,
          amount: '10.00', bookingDate: bookingDates[0]!, creditDebitIndicator: 'CRDT',
          ntryRef: 'Entry A', underlyingTransactionCount: 9444,
          bkTxCdProprietary: typeCodes[0]!.slice('PRTRY:'.length),
        },
        {
          id: ids[1]!, runId, accountId, statementId, entryIndex: 2,
          amount: '5.00', bookingDate: bookingDates[1]!, creditDebitIndicator: 'DBIT',
          ntryRef: 'Entry B', underlyingTransactionCount: 0,
          bkTxCdProprietary: typeCodes[1]!.slice('PRTRY:'.length),
        },
        {
          id: ids[2]!, runId, accountId, statementId, entryIndex: 3,
          amount: '20.00', bookingDate: bookingDates[2]!, creditDebitIndicator: 'CRDT',
          ntryRef: 'Entry C', underlyingTransactionCount: 2,
          bkTxCdProprietary: typeCodes[2]!.slice('PRTRY:'.length),
        },
      ])

      cleanup = async () => {
        await db.delete(transactionProcessing).where(inArray(transactionProcessing.transactionId, ids))
        await db.delete(transaction).where(eq(transaction.runId, runId))
        await db.delete(transactionCodeCatalog).where(inArray(transactionCodeCatalog.codeKey, typeCodes))
        await db.delete(bankingStatementBalance).where(eq(bankingStatementBalance.statementId, statementId!))
        await db.delete(bankingStatement).where(eq(bankingStatement.id, statementId!))
        await db.delete(bankingDocument).where(eq(bankingDocument.id, documentId!))
        await db.delete(account).where(eq(account.id, accountId))
        await db.delete(run).where(eq(run.id, runId))
      }

      const firstPage = await selectPaginatedTransactionKeys({
        whereClause: eq(transaction.runId, runId),
        pageSize: 2,
        offset: 0,
      })
      expect(firstPage.totalTransactions).toBe(3)
      expect(firstPage.totalSamleposter).toBe(3)
      expect(firstPage.rows.map(row => row.id)).toEqual([ids[2], ids[1]])

      const secondPage = await selectPaginatedTransactionKeys({
        whereClause: eq(transaction.runId, runId),
        pageSize: 2,
        offset: 2,
      })
      expect(secondPage.rows.map(row => row.id)).toEqual([ids[0]])

      const filteredEntry = await selectPaginatedTransactionKeys({
        whereClause: eq(transaction.runId, runId),
        pageSize: 10,
        offset: 0,
        transactionTypeFilter: ['Beta'],
      })
      expect(filteredEntry.totalTransactions).toBe(1)
      expect(filteredEntry.totalSamleposter).toBe(1)
      expect(filteredEntry.rows.map(row => row.id)).toEqual([ids[1]])

      const sortedByType = await selectPaginatedTransactionKeys({
        whereClause: eq(transaction.runId, runId),
        pageSize: 10,
        offset: 0,
        sortKey: 'transactionType',
        sortDirection: 'asc',
      })
      expect(sortedByType.rows.map(row => row.id)).toEqual([ids[2], ids[1], ids[0]])

      const { default: transactionsHandler } = await import('../../server/api/transactions/index.get')
      const app = createApp()
      const router = createRouter()
      router.get('/api/transactions', transactionsHandler)
      app.use(router)
      const server = createServer(toNodeListener(app))
      server.listen(0, '127.0.0.1')
      await once(server, 'listening')

      try {
        const address = server.address()
        if (!address || typeof address === 'string') throw new Error('Test server did not bind a TCP port')
        const baseUrl = `http://127.0.0.1:${address.port}/api/transactions`
        const accountFilter = `accountIds=${encodeURIComponent(accountId)}`

        const statementPage = await fetch(`${baseUrl}?mode=statement&page=1&pageSize=2&${accountFilter}`)
        expect(statementPage.status).toBe(200)
        const statementBody = await statementPage.json() as {
          rows: Array<{ id: string; underlyingTransactionCount: number; runningBalance: string | null }>
          total: number
          totalSamleposter: number
        }
        expect(statementBody.total).toBe(3)
        expect(statementBody.totalSamleposter).toBe(3)
        expect(statementBody.rows.map(row => row.id)).toEqual([ids[2], ids[1]])
        expect(statementBody.rows[0]?.underlyingTransactionCount).toBe(2)

        const openItems = await fetch(`${baseUrl}?mode=open-items&limit=2&${accountFilter}`)
        const openItemsBody = await openItems.json() as {
          items: Array<{ id: string; underlyingTransactionCount: number }>
          total: number
          totalSamleposter: number
        }
        expect(openItemsBody.total).toBe(3)
        expect(openItemsBody.totalSamleposter).toBe(3)
        expect(openItemsBody.items.map(row => row.id)).toEqual([ids[2], ids[1]])
        expect(openItemsBody.items[0]?.underlyingTransactionCount).toBe(2)
      } finally {
        server.close()
        await once(server, 'close')
      }
    } finally {
      if (databaseInitialized) {
        if (cleanup) await cleanup()
        else {
          await db.delete(transaction).where(eq(transaction.runId, runId))
          await db.delete(transactionCodeCatalog).where(inArray(transactionCodeCatalog.codeKey, typeCodes))
          if (statementId !== undefined) {
            await db.delete(bankingStatementBalance).where(eq(bankingStatementBalance.statementId, statementId))
            await db.delete(bankingStatement).where(eq(bankingStatement.id, statementId))
          }
          if (documentId !== undefined) await db.delete(bankingDocument).where(eq(bankingDocument.id, documentId))
          await db.delete(account).where(eq(account.id, accountId))
          await db.delete(run).where(eq(run.id, runId))
        }
      }
    }
  })
})
