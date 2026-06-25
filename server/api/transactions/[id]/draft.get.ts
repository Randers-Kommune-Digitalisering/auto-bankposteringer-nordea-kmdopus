import { eq, inArray } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import { z } from 'zod'
import db from '~/lib/db'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'
import {
  manualBookingDraft,
  manualBookingDraftAttachment,
  manualBookingDraftLine,
  manualBookingDraftLineDimension,
} from '~/lib/db/schema/manualBookingDraft'
import { parseAmount } from '#engine/matching/domain/amount'

export default defineEventHandler(async (event) => {
  const transactionIdParam = event.context.params?.id
  if (!transactionIdParam) {
    throw createError({ statusCode: 400, statusMessage: 'Mangler transaktions-id' })
  }

  const transactionIdResult = z.string().uuid().safeParse(transactionIdParam)
  if (!transactionIdResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ugyldigt transaktions-id',
    })
  }

  const transactionId = transactionIdResult.data

  const [tx] = await db
    .select({
      id: transaction.id,
      processingStatus: transactionProcessing.status,
    })
    .from(transaction)
    .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
    .where(eq(transaction.id, transactionId))
    .limit(1)

  if (!tx?.id) {
    throw createError({ statusCode: 404, statusMessage: 'Transaktion blev ikke fundet' })
  }

  if (tx.processingStatus && tx.processingStatus !== 'åben') {
    throw createError({ statusCode: 409, statusMessage: 'Transaktionen er allerede behandlet' })
  }

  const [header] = await db
    .select()
    .from(manualBookingDraft)
    .where(eq(manualBookingDraft.transactionId, transactionId))
    .limit(1)

  if (!header) {
    return { draft: null }
  }

  const lines = await db
    .select()
    .from(manualBookingDraftLine)
    .where(eq(manualBookingDraftLine.transactionId, transactionId))
    .orderBy(manualBookingDraftLine.sortOrder)

  const lineIds = lines.map((l) => l.id).filter(Boolean) as string[]

  const dimensions = lineIds.length
    ? await db
        .select()
        .from(manualBookingDraftLineDimension)
        .where(inArray(manualBookingDraftLineDimension.lineId, lineIds))
    : []

  const byLineId = new Map<string, Array<{ key: string; value: string }>>()
  for (const d of dimensions) {
    const bucket = byLineId.get(d.lineId) ?? []
    bucket.push({ key: d.key, value: d.value })
    byLineId.set(d.lineId, bucket)
  }

  const attachments = await db
    .select()
    .from(manualBookingDraftAttachment)
    .where(eq(manualBookingDraftAttachment.transactionId, transactionId))
    .orderBy(manualBookingDraftAttachment.sortOrder)

  return {
    draft: {
      text: header.text ?? undefined,
      cprType: header.cprType,
      cprNumber: header.cprNumber ?? undefined,
      note: header.note ?? undefined,
      lines: lines.map((l) => ({
        amount: parseNumeric(l.amount),
        text: l.text ?? undefined,
        dimensions: byLineId.get(l.id) ?? [],
      })),
      attachments: attachments.map((a) => ({ name: a.name, type: a.type, data: a.data })),
    },
  }
})

function parseNumeric(value: unknown): number {
  return parseAmount(value)
}
