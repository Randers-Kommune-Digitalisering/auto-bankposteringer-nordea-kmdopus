import { afterEach, describe, expect, it } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { createApp, createRouter, toNodeListener } from 'h3'

describe('paginated transaction keys (integration)', () => {
  let cleanup: (() => Promise<void>) | undefined

  afterEach(async () => {
    await cleanup?.()
    cleanup = undefined
  })

  it('keeps a batch intact across a stack page boundary and counts filtered stacks', async () => {
    const { randomUUID } = await import('node:crypto')
    const { default: db } = await import('../../app/lib/db')
    const { account } = await import('../../app/lib/db/schema/account')
    const { transactionCodeCatalog } = await import('../../app/lib/db/schema/transactionCodeCatalog')
    const { bankingDocument, bankingStatement, bankingStatementBalance } = await import('../../app/lib/db/schema/statement')
    const { run } = await import('../../app/lib/db/schema/run')
    const { transaction } = await import('../../app/lib/db/schema/transaction')
    const { selectPaginatedTransactionKeys } = await import('../../server/utils/transactions/selectPaginatedTransactionKeys')

    let runId: string | undefined
    let accountId: string | undefined
    let documentId: string | undefined
    let statementId: string | undefined
    const idPrefix = randomUUID().replaceAll('-', '').slice(0, 20)
    const typeCodeA = `PRTRY:${idPrefix}A`
    const typeCodeB = `PRTRY:${idPrefix}B`
    const typeCodeZ = `PRTRY:${idPrefix}Z`
    const ids = [10, 9, 8].map((suffix) => {
      const hex = `${idPrefix}${suffix.toString(16).padStart(12, '0')}`
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    })

    try {
      const bookingDate = new Date(Date.UTC(2090, 0, 1 + Math.floor(Math.random() * 20000)))
      const createdRun = await db.insert(run).values({ bookingDate, status: 'afventer' }).returning({ id: run.id })
      runId = createdRun[0]!.id

      accountId = `pagination-test-${randomUUID()}`
      await db.insert(account).values({
        id: accountId,
        provider: 'nordea',
        iban: `DK${randomUUID().replaceAll('-', '').slice(0, 18)}`,
        currency: 'DKK',
      })
      await db.insert(transactionCodeCatalog).values([
        { provider: 'nordea', codeKey: typeCodeA, displayName: 'Aardvark' },
        { provider: 'nordea', codeKey: typeCodeB, displayName: 'Beta' },
        { provider: 'nordea', codeKey: typeCodeZ, displayName: 'Zulu' },
      ])

      const createdDocument = await db.insert(bankingDocument).values({
        accountId,
        format: 'camt053',
        content: '<Document/>',
        contentHash: randomUUID(),
      }).returning({ id: bankingDocument.id })
      documentId = createdDocument[0]!.id

      const createdStatement = await db.insert(bankingStatement).values({
        documentId,
        statementId: `pagination-${randomUUID()}`,
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
          id: ids[0], runId, accountId, statementId, entryIndex: 1, entrySubIndex: 1,
          amount: '10.00', bookingDate, creditDebitIndicator: 'CRDT',
          ntryRef: 'Batch A', ntryAcctSvcrRef: 'Entry A', debtorName: 'Match only first batch row Zulu',
          bkTxCdProprietary: typeCodeZ.slice('PRTRY:'.length),
        },
        {
          id: ids[1], runId, accountId, statementId, entryIndex: 2, entrySubIndex: 1,
          amount: '5.00', bookingDate, creditDebitIndicator: 'DBIT', ntryRef: 'Single B',
          creditorName: 'Beta', bkTxCdProprietary: typeCodeB.slice('PRTRY:'.length),
        },
        {
          id: ids[2], runId, accountId, statementId, entryIndex: 1, entrySubIndex: 2,
          amount: '20.00', bookingDate, creditDebitIndicator: 'CRDT',
          ntryRef: ' Batch   A ', ntryAcctSvcrRef: 'Entry A', debtorName: 'Aardvark non-representative',
          bkTxCdProprietary: typeCodeA.slice('PRTRY:'.length),
        },
      ])

      cleanup = async () => {
        await db.delete(transaction).where(eq(transaction.runId, runId!))
        await db.delete(transactionCodeCatalog).where(inArray(transactionCodeCatalog.codeKey, [typeCodeA, typeCodeB, typeCodeZ]))
        await db.delete(bankingStatementBalance).where(eq(bankingStatementBalance.statementId, statementId!))
        await db.delete(bankingStatement).where(eq(bankingStatement.id, statementId!))
        await db.delete(bankingDocument).where(eq(bankingDocument.id, documentId!))
        await db.delete(account).where(eq(account.id, accountId!))
        await db.delete(run).where(eq(run.id, runId!))
      }

      const firstPage = await selectPaginatedTransactionKeys({
        whereClause: eq(transaction.runId, runId!),
        pageSize: 1,
        offset: 0,
      })
      expect(firstPage.totalTransactions).toBe(3)
      expect(firstPage.totalSamleposter).toBe(2)
      expect(firstPage.rows.map(row => row.id)).toEqual([ids[0], ids[2]])
      expect(new Set(firstPage.rows.map(row => row.samlepostId)).size).toBe(1)

      const secondPage = await selectPaginatedTransactionKeys({
        whereClause: eq(transaction.runId, runId!),
        pageSize: 1,
        offset: 1,
      })
      expect(secondPage.rows.map(row => row.id)).toEqual([ids[1]])

      const filteredBatchMember = await selectPaginatedTransactionKeys({
        whereClause: eq(transaction.id, ids[0]!),
        pageSize: 10,
        offset: 0,
      })
      expect(filteredBatchMember.totalTransactions).toBe(1)
      expect(filteredBatchMember.totalSamleposter).toBe(1)
      expect(filteredBatchMember.rows[0]?.samlepostId).toBe(`single:${ids[0]}`)

      const counterpartFirstPage = await selectPaginatedTransactionKeys({
        whereClause: eq(transaction.runId, runId!),
        pageSize: 1,
        offset: 0,
        sortKey: 'counterpart',
        sortDirection: 'asc',
      })
      expect(counterpartFirstPage.rows.map(row => row.id)).toEqual([ids[1]])
      expect(counterpartFirstPage.transactionTypeValues).toHaveLength(2)
      expect(counterpartFirstPage.transactionTypeValues).toEqual(expect.arrayContaining(['Beta', 'Zulu']))

      const counterpartSecondPage = await selectPaginatedTransactionKeys({
        whereClause: eq(transaction.runId, runId!),
        pageSize: 1,
        offset: 1,
        sortKey: 'counterpart',
        sortDirection: 'asc',
      })
      expect(counterpartSecondPage.rows.map(row => row.id)).toEqual([ids[0], ids[2]])

      const counterpartDescending = await selectPaginatedTransactionKeys({
        whereClause: eq(transaction.runId, runId!),
        pageSize: 1,
        offset: 0,
        sortKey: 'counterpart',
        sortDirection: 'desc',
      })
      expect(counterpartDescending.rows.map(row => row.id)).toEqual([ids[0], ids[2]])

      const transactionTypeFirstPage = await selectPaginatedTransactionKeys({
        whereClause: eq(transaction.runId, runId!),
        pageSize: 1,
        offset: 0,
        sortKey: 'transactionType',
        sortDirection: 'asc',
      })
      expect(transactionTypeFirstPage.rows.map(row => row.id)).toEqual([ids[1]])

      const transactionTypeDescending = await selectPaginatedTransactionKeys({
        whereClause: eq(transaction.runId, runId!),
        pageSize: 1,
        offset: 0,
        sortKey: 'transactionType',
        sortDirection: 'desc',
      })
      expect(transactionTypeDescending.rows.map(row => row.id)).toEqual([ids[0], ids[2]])

      const filteredToSingleType = await selectPaginatedTransactionKeys({
        whereClause: eq(transaction.runId, runId!),
        pageSize: 1,
        offset: 0,
        transactionTypeFilter: ['Beta'],
      })
      expect(filteredToSingleType.totalTransactions).toBe(1)
      expect(filteredToSingleType.totalSamleposter).toBe(1)
      expect(filteredToSingleType.rows.map(row => row.id)).toEqual([ids[1]])

      const filteredToBatchType = await selectPaginatedTransactionKeys({
        whereClause: eq(transaction.runId, runId!),
        pageSize: 1,
        offset: 0,
        transactionTypeFilter: ['Zulu'],
      })
      expect(filteredToBatchType.totalTransactions).toBe(2)
      expect(filteredToBatchType.totalSamleposter).toBe(1)
      expect(filteredToBatchType.rows.map(row => row.id)).toEqual([ids[0], ids[2]])

      const filteredToNonRepresentativeType = await selectPaginatedTransactionKeys({
        whereClause: eq(transaction.runId, runId!),
        pageSize: 1,
        offset: 0,
        transactionTypeFilter: ['Aardvark'],
      })
      expect(filteredToNonRepresentativeType.totalTransactions).toBe(0)
      expect(filteredToNonRepresentativeType.totalSamleposter).toBe(0)

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

        const accountFilter = `accountIds=${encodeURIComponent(accountId!)}`
        const sortedStatementPageOne = await fetch(`${baseUrl}?mode=statement&page=1&pageSize=1&${accountFilter}&sortBy=counterpart&sortDirection=asc`)
        const sortedStatementPageOneBody = await sortedStatementPageOne.json() as {
          rows: Array<{ id: string }>
          total: number
          transactionTypeValues: string[]
        }
        expect(sortedStatementPageOneBody.rows.map(row => row.id)).toEqual([ids[1]])
        expect(sortedStatementPageOneBody.total).toBe(2)
        expect(sortedStatementPageOneBody.transactionTypeValues).toEqual(expect.arrayContaining(['Beta', 'Zulu']))

        const sortedStatementPageTwo = await fetch(`${baseUrl}?mode=statement&page=2&pageSize=1&${accountFilter}&sortBy=counterpart&sortDirection=asc`)
        const sortedStatementPageTwoBody = await sortedStatementPageTwo.json() as {
          rows: Array<{ id: string }>
          total: number
        }
        expect(sortedStatementPageTwoBody.rows.map(row => row.id)).toEqual([ids[0], ids[2]])
        expect(sortedStatementPageTwoBody.total).toBe(2)

        const typeFilteredStatement = await fetch(`${baseUrl}?mode=statement&page=1&pageSize=1&${accountFilter}&transactionTypes=Beta`)
        const typeFilteredStatementBody = await typeFilteredStatement.json() as {
          rows: Array<{ id: string }>
          total: number
          totalSamleposter: number
        }
        expect(typeFilteredStatementBody.rows.map(row => row.id)).toEqual([ids[1]])
        expect(typeFilteredStatementBody.total).toBe(1)
        expect(typeFilteredStatementBody.totalSamleposter).toBe(1)

        const statementPageOne = await fetch(`${baseUrl}?mode=statement&page=1&pageSize=1&${accountFilter}`)
        expect(statementPageOne.status).toBe(200)
        const statementPageOneBody = await statementPageOne.json() as {
          rows: Array<{ id: string; samlepostId: string; runningBalance: string | null }>
          total: number
          totalSamleposter: number
        }
        expect(statementPageOneBody.total).toBe(2)
        expect(statementPageOneBody.totalSamleposter).toBe(2)
        expect(statementPageOneBody.rows.map(row => row.id)).toEqual([ids[0], ids[2]])
        expect(new Set(statementPageOneBody.rows.map(row => row.samlepostId)).size).toBe(1)
        expect(statementPageOneBody.rows.map(row => row.runningBalance)).toEqual(['110', '130'])

        const statementPageTwo = await fetch(`${baseUrl}?mode=statement&page=2&pageSize=1&${accountFilter}`)
        const statementPageTwoBody = await statementPageTwo.json() as {
          rows: Array<{ id: string; runningBalance: string | null }>
          total: number
        }
        expect(statementPageTwoBody.total).toBe(2)
        expect(statementPageTwoBody.rows.map(row => row.id)).toEqual([ids[1]])
        expect(statementPageTwoBody.rows[0]?.runningBalance).toBe('125')

        const openItems = await fetch(`${baseUrl}?mode=open-items&limit=1&${accountFilter}`)
        const openItemsBody = await openItems.json() as {
          items: Array<{ id: string }>
          stacks: Array<{ items: Array<{ id: string }> }>
          total: number
          limit: number
          totalSamleposter: number
        }
        expect(openItemsBody.total).toBe(3)
        expect(openItemsBody.limit).toBe(1)
        expect(openItemsBody.totalSamleposter).toBe(2)
        expect(openItemsBody.items.map(row => row.id)).toEqual([ids[0], ids[2]])
        expect(openItemsBody.stacks).toHaveLength(1)

        const filtered = await fetch(`${baseUrl}?mode=statement&pageSize=10&${accountFilter}&search=Match%20only%20first`)
        const filteredBody = await filtered.json() as {
          rows: Array<{ id: string; samlepostId: string }>
          total: number
          totalSamleposter: number
        }
        expect(filteredBody.total).toBe(1)
        expect(filteredBody.totalSamleposter).toBe(1)
        expect(filteredBody.rows).toHaveLength(1)
        expect(filteredBody.rows[0]?.id).toBe(ids[0])
        expect(filteredBody.rows[0]?.samlepostId).toBe(`single:${ids[0]}`)
      } finally {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => error ? reject(error) : resolve())
        })
      }
    } catch (error) {
      if (runId && !cleanup) {
        await db.delete(transaction).where(eq(transaction.runId, runId))
        await db.delete(transactionCodeCatalog).where(inArray(transactionCodeCatalog.codeKey, [typeCodeA, typeCodeB, typeCodeZ]))
        if (statementId) {
          await db.delete(bankingStatementBalance).where(eq(bankingStatementBalance.statementId, statementId))
          await db.delete(bankingStatement).where(eq(bankingStatement.id, statementId))
        }
        if (documentId) await db.delete(bankingDocument).where(eq(bankingDocument.id, documentId))
        if (accountId) await db.delete(account).where(eq(account.id, accountId))
        await db.delete(run).where(eq(run.id, runId))
      }
      const message = String((error as any)?.message ?? error)
      if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
        throw new Error(`Postgres not reachable for integration test. Start it with: docker compose up -d db\n${message}`)
      }
      throw error
    }
  }, 30_000)
})