import { eq, inArray } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import db from '~/lib/db'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'
import {
  manualBookingDraft,
  manualBookingDraftAttachment,
  manualBookingDraftLine,
  manualBookingDraftLineDimension,
} from '~/lib/db/schema/manualBookingDraft'
import { manualBookingPayloadSchema } from '#engine/manual-booking/domain/manualBooking'
import { requireWriteAccess } from '~~/server/auth/requireAppRoles'

export default defineEventHandler(async (event) => {
  await requireWriteAccess(event)
  const transactionIdParam = event.context.params?.id
  if (!transactionIdParam) {
    throw createError({ statusCode: 400, statusMessage: 'Mangler transaktions-id' })
  }

  const transactionIdResult = z.string().uuid().safeParse(transactionIdParam)
  if (!transactionIdResult.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldigt transaktions-id' })
  }
  const transactionId = transactionIdResult.data

  const body = manualBookingPayloadSchema.parse(await readBody(event))

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

  const now = new Date()

  await db.transaction(async (trx) => {
    await trx
      .insert(manualBookingDraft)
      .values({
        transactionId,
        updatedAt: now,
        text: body.text ?? null,
        cprType: body.cprType,
        cprNumber: body.cprNumber ?? null,
        notifyTo: body.notifyTo ?? null,
        note: body.note ?? null,
      })
      .onConflictDoUpdate({
        target: manualBookingDraft.transactionId,
        set: {
          updatedAt: now,
          text: body.text ?? null,
          cprType: body.cprType,
          cprNumber: body.cprNumber ?? null,
          notifyTo: body.notifyTo ?? null,
          note: body.note ?? null,
        },
      })

    const existingLines = await trx
      .select({ id: manualBookingDraftLine.id })
      .from(manualBookingDraftLine)
      .where(eq(manualBookingDraftLine.transactionId, transactionId))

    const existingLineIds = existingLines.map((l) => l.id)

    if (existingLineIds.length) {
      await trx
        .delete(manualBookingDraftLineDimension)
        .where(inArray(manualBookingDraftLineDimension.lineId, existingLineIds))
    }

    await trx.delete(manualBookingDraftLine).where(eq(manualBookingDraftLine.transactionId, transactionId))
    await trx
      .delete(manualBookingDraftAttachment)
      .where(eq(manualBookingDraftAttachment.transactionId, transactionId))

    const lineRows = body.lines.map((line, index) => ({
      id: randomUUID(),
      transactionId,
      sortOrder: index,
      amount: String(line.amount),
    text: line.text ?? null,
    }))

    if (lineRows.length) {
      await trx.insert(manualBookingDraftLine).values(lineRows)

      const dimRows = lineRows.flatMap((lineRow, index) => {
        const dims = body.lines[index]?.dimensions ?? []
        return dims
          .filter((d) => d.key?.trim() && d.value?.trim())
          .map((d) => ({
            lineId: lineRow.id,
            key: String(d.key).trim(),
            value: String(d.value).trim(),
          }))
      })

      if (dimRows.length) {
        await trx.insert(manualBookingDraftLineDimension).values(dimRows)
      }
    }

    const attachmentRows = (body.attachments ?? []).map((a, index) => ({
      transactionId,
      sortOrder: index,
      name: a.name,
      type: a.type,
      data: a.data,
    }))

    if (attachmentRows.length) {
      await trx.insert(manualBookingDraftAttachment).values(attachmentRows)
    }
  })

  return { success: true }
})
