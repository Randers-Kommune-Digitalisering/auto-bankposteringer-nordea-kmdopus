import { defineEventHandler, createError, readBody } from 'h3'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { erpRequestLine } from '~/lib/db/schema/erp'
import { transactionProcessing } from '~/lib/db/schema/transaction'
import { requireErrorHandlingWriteAccess } from '~~/server/auth/requireAppRoles'

export default defineEventHandler(async (event) => {
  await requireErrorHandlingWriteAccess(event)

  const requestId = z.string().min(1).parse(event.context.params?.requestId)
  const body = z
    .object({
      transactionIds: z.array(z.string().uuid()).optional().default([]),
      lineNos: z.array(z.number().int().positive()).optional().default([]),
    })
    .parse(await readBody(event))

  const existing = await db.query.erpRequest.findFirst({
    where: (fields, { eq }) => eq(fields.id, requestId),
    columns: { id: true },
  })

  if (!existing?.id) {
    throw createError({ statusCode: 404, statusMessage: 'ERP request blev ikke fundet' })
  }

  const requestedTransactionIds = Array.from(new Set(body.transactionIds))
  const requestedLineNos = Array.from(new Set(body.lineNos)).sort((a, b) => a - b)

  if (!requestedTransactionIds.length && !requestedLineNos.length) {
    throw createError({ statusCode: 422, statusMessage: 'Der skal vælges mindst én transaktion' })
  }

  const mappingRows = requestedTransactionIds.length
    ? await db
        .select({
          lineNo: erpRequestLine.lineNo,
          transactionId: erpRequestLine.transactionId,
        })
        .from(erpRequestLine)
        .where(and(eq(erpRequestLine.requestId, requestId), inArray(erpRequestLine.transactionId, requestedTransactionIds)))
    : await db
        .select({
          lineNo: erpRequestLine.lineNo,
          transactionId: erpRequestLine.transactionId,
        })
        .from(erpRequestLine)
        .where(and(eq(erpRequestLine.requestId, requestId), inArray(erpRequestLine.lineNo, requestedLineNos)))

  const foundLineNos = new Set(mappingRows.map((r) => r.lineNo))
  const missingLineNos = requestedLineNos.filter((n) => !foundLineNos.has(n))
  const unmappedLineNos = mappingRows.filter((r) => !r.transactionId).map((r) => r.lineNo)

  const eligibleTransactionIds = Array.from(
    new Set(
      mappingRows
        .map((r) => (r.transactionId ? String(r.transactionId) : null))
        .filter((id): id is string => Boolean(id)),
    ),
  )

  const foundTransactionIds = new Set(eligibleTransactionIds)
  const missingTransactionIds = requestedTransactionIds.filter((id) => !foundTransactionIds.has(id))

  if (!eligibleTransactionIds.length) {
    return {
      success: true,
      requestId,
      requestedTransactionIds,
      requestedLineNos,
      missingTransactionIds,
      reopened: 0,
      eligibleTransactions: 0,
      missingLineNos,
      unmappedLineNos,
      skippedNotBooked: 0,
    }
  }

  const updatedRows = await db
    .update(transactionProcessing)
    .set({
      status: 'åben',
      ruleApplied: null,
      lockedAt: null,
      lockedBy: null,
    })
    .where(and(inArray(transactionProcessing.transactionId, eligibleTransactionIds), eq(transactionProcessing.status, 'bogført')))
    .returning({ transactionId: transactionProcessing.transactionId })

  const reopened = updatedRows.length
  const skippedNotBooked = eligibleTransactionIds.length - reopened

  return {
    success: true,
    requestId,
    requestedTransactionIds,
    requestedLineNos,
    missingTransactionIds,
    reopened,
    eligibleTransactions: eligibleTransactionIds.length,
    missingLineNos,
    unmappedLineNos,
    skippedNotBooked,
  }
})
