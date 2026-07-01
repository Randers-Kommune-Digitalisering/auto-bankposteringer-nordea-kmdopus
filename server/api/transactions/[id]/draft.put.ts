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
  const now = new Date()
  const parsedBody = manualBookingPayloadSchema.parse(await readBody(event))

  const txId = event.context.params?.id
  if (!txId) {
    throw createError({ statusCode: 400, statusMessage: 'Mangler transaktions-id' })
  }

  const parsedTxId = z.uuid().safeParse(txId)
  if (!parsedTxId.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldigt transaktions-id' })
  }
  const transactionId = parsedTxId.data

  // Check transaction state
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

  await db.transaction(async (tx) => {
    await tx
      .insert(manualBookingDraft)
      .values({
        transactionId,
        updatedAt: now,
        text: parsedBody.text ?? null,
        cprType: parsedBody.cprType,
        cprNumber: parsedBody.cprNumber ?? null,
        note: parsedBody.note ?? null,
      })
      .onConflictDoUpdate({
        target: manualBookingDraft.transactionId,
        set: {
          updatedAt: now,
          text: parsedBody.text ?? null,
          cprType: parsedBody.cprType,
          cprNumber: parsedBody.cprNumber ?? null,
          note: parsedBody.note ?? null,
        },
      })

    // Delete existing content
    const existingLines = await tx
      .select({ id: manualBookingDraftLine.id })
      .from(manualBookingDraftLine)
      .where(eq(manualBookingDraftLine.transactionId, transactionId))

    const existingLineIds = existingLines.map((l) => l.id)

    if (existingLineIds.length) {
      await tx
        .delete(manualBookingDraftLineDimension)
        .where(inArray(manualBookingDraftLineDimension.lineId, existingLineIds))
    }

    await tx.delete(manualBookingDraftLine).where(eq(manualBookingDraftLine.transactionId, transactionId))
    await tx
      .delete(manualBookingDraftAttachment)
      .where(eq(manualBookingDraftAttachment.transactionId, transactionId))

    const lineRows = parsedBody.lines.map((line, index) => ({
      id: randomUUID(),
      transactionId,
      sortOrder: index,
      amount: String(line.amount),
      text: line.text ?? null,
    }))

    // Write new content
    if (lineRows.length) {
      await tx.insert(manualBookingDraftLine).values(lineRows)

      const dimRows = lineRows.flatMap((lineRow, index) => {
        const dims = parsedBody.lines[index]?.dimensions ?? []
        return dims
          .filter((d) => d.key?.trim() && d.value?.trim())
          .map((d) => ({
            lineId: lineRow.id,
            key: String(d.key).trim(),
            value: String(d.value).trim(),
          }))
      })

      if (dimRows.length) {
        await tx.insert(manualBookingDraftLineDimension).values(dimRows)
      }
    }

    // Write attachments
    const attachmentRows = (parsedBody.attachments ?? []).map((a, index) => ({
      transactionId,
      sortOrder: index,
      name: a.name,
      type: a.type,
      data: a.data,
    }))

    if (attachmentRows.length) {
      await tx.insert(manualBookingDraftAttachment).values(attachmentRows)
    }
  })

  return { success: true }
})
