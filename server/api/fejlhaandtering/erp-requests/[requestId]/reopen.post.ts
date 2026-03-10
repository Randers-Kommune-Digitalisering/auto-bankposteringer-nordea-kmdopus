import { defineEventHandler, createError, readBody } from 'h3'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { erpRequestLine } from '~/lib/db/schema/erp'
import { transactionProcessing } from '~/lib/db/schema/transaction'

export default defineEventHandler(async (event) => {
  const requestId = z.string().min(1).parse(event.context.params?.requestId)
  const body = z
    .object({
      lineNos: z.array(z.number().int().positive()).min(1),
    })
    .parse(await readBody(event))

  const existing = await db.query.erpRequest.findFirst({
    where: (fields, { eq }) => eq(fields.id, requestId),
    columns: { id: true },
  })

  if (!existing?.id) {
    throw createError({ statusCode: 404, statusMessage: 'ERP request blev ikke fundet' })
  }

  const requestedLineNos = Array.from(new Set(body.lineNos)).sort((a, b) => a - b)

  const mappingRows = await db
    .select({
      lineNo: erpRequestLine.lineNo,
      transactionId: erpRequestLine.transactionId,
    })
    .from(erpRequestLine)
    .where(and(eq(erpRequestLine.requestId, requestId), inArray(erpRequestLine.lineNo, requestedLineNos)))

  const foundLineNos = new Set(mappingRows.map((r) => r.lineNo))
  const missingLineNos = requestedLineNos.filter((n) => !foundLineNos.has(n))
  const unmappedLineNos = mappingRows.filter((r) => !r.transactionId).map((r) => r.lineNo)

  const transactionIds = mappingRows
    .map((r) => (r.transactionId ? String(r.transactionId) : null))
    .filter((id): id is string => Boolean(id))

  if (!transactionIds.length) {
    return {
      success: true,
      requestId,
      requestedLineNos,
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
    .where(and(inArray(transactionProcessing.transactionId, transactionIds), eq(transactionProcessing.status, 'bogført')))
    .returning({ transactionId: transactionProcessing.transactionId })

  const reopened = updatedRows.length
  const skippedNotBooked = transactionIds.length - reopened

  return {
    success: true,
    requestId,
    requestedLineNos,
    reopened,
    eligibleTransactions: transactionIds.length,
    missingLineNos,
    unmappedLineNos,
    skippedNotBooked,
  }
})
