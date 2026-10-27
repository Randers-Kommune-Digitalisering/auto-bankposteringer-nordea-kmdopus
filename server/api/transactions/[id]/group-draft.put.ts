import { eq, inArray } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import db from '~/lib/db'
import {
  manualBookingGroupDraft,
  manualBookingGroupDraftAttachment,
  manualBookingGroupDraftLine,
  manualBookingGroupDraftLineDimension,
} from '~/lib/db/schema/manualBookingGroupDraft'
import { manualBookingPayloadSchema } from '#engine/manual-booking/domain/manualBooking'
import { requireWriteAccessWithIdentity } from '~~/server/auth/requireAppRoles'
import { manualBookingGroupDraftMemberSignature } from '~~/server/utils/manualBookingGroupDraft'
import { verifyTransactionBookingLockInTransaction } from '~~/server/utils/transactionBookingLock'

export default defineEventHandler(async (event) => {
  const user = await requireWriteAccessWithIdentity(event)
  const transactionId = z.string().uuid().safeParse(event.context.params?.id)
  if (!transactionId.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldigt transaktions-id' })
  }

  const payload = manualBookingPayloadSchema.parse(await readBody(event))
  const now = new Date()

  await db.transaction(async (tx) => {
    const scope = await verifyTransactionBookingLockInTransaction(tx, transactionId.data, user)
    if (!scope.groupKey || scope.openTransactionIds.length < 2) {
      throw createError({ statusCode: 409, statusMessage: 'Transaktionerne udgør ikke en åben samlepost' })
    }
    const groupKey = scope.groupKey

    await tx
      .insert(manualBookingGroupDraft)
      .values({
        groupKey,
        memberSignature: manualBookingGroupDraftMemberSignature(scope.openTransactionIds),
        updatedAt: now,
        text: payload.text ?? null,
        cprType: payload.cprType,
        cprNumber: payload.cprNumber ?? null,
        note: payload.note ?? null,
      })
      .onConflictDoUpdate({
        target: manualBookingGroupDraft.groupKey,
        set: {
          memberSignature: manualBookingGroupDraftMemberSignature(scope.openTransactionIds),
          updatedAt: now,
          text: payload.text ?? null,
          cprType: payload.cprType,
          cprNumber: payload.cprNumber ?? null,
          note: payload.note ?? null,
        },
      })

    const existingLines = await tx
      .select({ id: manualBookingGroupDraftLine.id })
      .from(manualBookingGroupDraftLine)
      .where(eq(manualBookingGroupDraftLine.groupKey, groupKey))
    const existingLineIds = existingLines.map((line) => line.id)

    if (existingLineIds.length) {
      await tx
        .delete(manualBookingGroupDraftLineDimension)
        .where(inArray(manualBookingGroupDraftLineDimension.lineId, existingLineIds))
    }

    await tx
      .delete(manualBookingGroupDraftLine)
      .where(eq(manualBookingGroupDraftLine.groupKey, groupKey))
    await tx
      .delete(manualBookingGroupDraftAttachment)
      .where(eq(manualBookingGroupDraftAttachment.groupKey, groupKey))

    const lineRows = payload.lines.map((line, sortOrder) => ({
      id: randomUUID(),
      groupKey,
      sortOrder,
      amount: String(line.amount),
      text: line.text ?? null,
    }))

    if (lineRows.length) {
      await tx.insert(manualBookingGroupDraftLine).values(lineRows)

      const dimensionRows = lineRows.flatMap((lineRow, index) =>
        (payload.lines[index]?.dimensions ?? [])
          .filter((dimension) => dimension.key?.trim() && dimension.value?.trim())
          .map((dimension) => ({
            lineId: lineRow.id,
            key: String(dimension.key).trim(),
            value: String(dimension.value).trim(),
          })),
      )

      if (dimensionRows.length) {
        await tx.insert(manualBookingGroupDraftLineDimension).values(dimensionRows)
      }
    }

    const attachmentRows = (payload.attachments ?? []).map((attachment, sortOrder) => ({
      groupKey,
      sortOrder,
      name: attachment.name,
      type: attachment.type,
      data: attachment.data,
    }))

    if (attachmentRows.length) {
      await tx.insert(manualBookingGroupDraftAttachment).values(attachmentRows)
    }
  })

  return { success: true }
})
