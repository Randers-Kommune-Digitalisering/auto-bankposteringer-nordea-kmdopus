import { defineEventHandler, createError } from 'h3'
import { eq, asc } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { erpRequestLine } from '~/lib/db/schema/erp'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'

export default defineEventHandler(async (event) => {
  const requestId = z.string().min(1).parse(event.context.params?.requestId)

  const existing = await db.query.erpRequest.findFirst({
    where: (fields, { eq }) => eq(fields.id, requestId),
    columns: { id: true },
  })

  if (!existing?.id) {
    throw createError({ statusCode: 404, statusMessage: 'ERP request blev ikke fundet' })
  }

  const rows = await db
    .select({
      lineNo: erpRequestLine.lineNo,
      transactionId: erpRequestLine.transactionId,
      transactionAmount: transaction.amount,
      transactionCurrency: transaction.currency,
      transactionBookingDate: transaction.bookingDate,
      transactionAccountId: transaction.accountId,
      creditorName: transaction.creditorName,
      debtorName: transaction.debtorName,
      remittanceUstrd: transaction.remittanceUstrd,
      processingStatus: transactionProcessing.status,
      ruleApplied: transactionProcessing.ruleApplied,
    })
    .from(erpRequestLine)
    .leftJoin(transaction, eq(transaction.id, erpRequestLine.transactionId))
    .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
    .where(eq(erpRequestLine.requestId, requestId))
    .orderBy(asc(erpRequestLine.lineNo))

  return {
    requestId: existing.id,
    lines: rows.map((row) => ({
      lineNo: row.lineNo,
      transactionId: row.transactionId ? String(row.transactionId) : null,
      transaction: row.transactionId
        ? {
            amount: row.transactionAmount,
            currency: row.transactionCurrency,
            bookingDate: row.transactionBookingDate,
            accountId: row.transactionAccountId,
            creditorName: row.creditorName,
            debtorName: row.debtorName,
            remittanceUstrd: row.remittanceUstrd,
            processing: {
              status: row.processingStatus ?? null,
              ruleApplied: row.ruleApplied ?? null,
            },
          }
        : null,
    })),
  }
})
