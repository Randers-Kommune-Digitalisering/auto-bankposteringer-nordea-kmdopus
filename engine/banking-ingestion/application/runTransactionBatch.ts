import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import { bankingPayload } from '~/lib/db/schema/banking'
import { run } from '~/lib/db/schema/run'
import { transaction } from '~/lib/db/schema/transaction'
import { logger } from '~/lib/logger'
import { fetchBankTransactions } from '../infrastructure/fetchBankTransactions'

export async function runTransactionBatch(): Promise<{ runId: string; insertedCount: number }> {
  const log = logger.child({ scope: 'banking.runTransactionBatch' })

  const runId = crypto.randomUUID()
  const now = new Date()

  const rawTransactions = await fetchBankTransactions()
  if (!rawTransactions.length) {
    await db.insert(run).values({ id: runId, bookingDate: now, status: 'udført' })
    return { runId, insertedCount: 0 }
  }

  const payloadRows = rawTransactions.map(raw => ({
    id: crypto.randomUUID(),
    raw,
  }))

  const txRows = rawTransactions.map((raw, index) => {
    const bookingDateRaw = raw?.date?.bookingDate
    const bookingDate = bookingDateRaw ? new Date(String(bookingDateRaw)) : now
    const safeBookingDate = Number.isNaN(bookingDate.getTime()) ? now : bookingDate

    return {
      id: crypto.randomUUID(),
      runId,
      payloadId: payloadRows[index]!.id,
      accountId: raw.accountId ?? null,
      amount: String(raw.amount),
      bookingDate: safeBookingDate,
    }
  })

  await db.transaction(async trx => {
    await trx.insert(run).values({ id: runId, bookingDate: now, status: 'indlæser' })
    await trx.insert(bankingPayload).values(payloadRows)
    await trx.insert(transaction).values(txRows)
    await trx.update(run).set({ status: 'udført' }).where(eq(run.id, runId))
  })

  log.info('Bank-transaktioner indlæst', { runId, insertedCount: txRows.length })
  return { runId, insertedCount: txRows.length }
}
