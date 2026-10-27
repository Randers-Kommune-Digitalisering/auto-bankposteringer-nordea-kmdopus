import { eq, inArray } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import { z } from 'zod'
import db from '~/lib/db'
import {
  manualBookingGroupDraft,
  manualBookingGroupDraftAttachment,
  manualBookingGroupDraftLine,
  manualBookingGroupDraftLineDimension,
} from '~/lib/db/schema/manualBookingGroupDraft'
import { parseAmount } from '#engine/matching/domain/amount'
import { requireWriteAccessWithIdentity } from '~~/server/auth/requireAppRoles'
import { manualBookingGroupDraftMemberSignature } from '~~/server/utils/manualBookingGroupDraft'
import { verifyTransactionBookingLock } from '~~/server/utils/transactionBookingLock'

export default defineEventHandler(async (event) => {
  const user = await requireWriteAccessWithIdentity(event)
  const transactionId = z.string().uuid().safeParse(event.context.params?.id)
  if (!transactionId.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldigt transaktions-id' })
  }

  const scope = await verifyTransactionBookingLock(transactionId.data, user)
  if (!scope.groupKey || scope.openTransactionIds.length < 2) {
    throw createError({ statusCode: 409, statusMessage: 'Transaktionerne udgør ikke en åben samlepost' })
  }

  const [header] = await db
    .select()
    .from(manualBookingGroupDraft)
    .where(eq(manualBookingGroupDraft.groupKey, scope.groupKey))
    .limit(1)

  if (!header) return { draft: null }

  const currentMemberSignature = manualBookingGroupDraftMemberSignature(scope.openTransactionIds)
  if (header.memberSignature !== currentMemberSignature) {
    await db
      .delete(manualBookingGroupDraft)
      .where(eq(manualBookingGroupDraft.groupKey, scope.groupKey))
    return { draft: null }
  }

  const lines = await db
    .select()
    .from(manualBookingGroupDraftLine)
    .where(eq(manualBookingGroupDraftLine.groupKey, scope.groupKey))
    .orderBy(manualBookingGroupDraftLine.sortOrder)

  const lineIds = lines.map((line) => line.id)
  const dimensions = lineIds.length
    ? await db
        .select()
        .from(manualBookingGroupDraftLineDimension)
        .where(inArray(manualBookingGroupDraftLineDimension.lineId, lineIds))
    : []

  const dimensionsByLineId = new Map<string, Array<{ key: string; value: string }>>()
  for (const dimension of dimensions) {
    const values = dimensionsByLineId.get(dimension.lineId) ?? []
    values.push({ key: dimension.key, value: dimension.value })
    dimensionsByLineId.set(dimension.lineId, values)
  }

  const attachments = await db
    .select()
    .from(manualBookingGroupDraftAttachment)
    .where(eq(manualBookingGroupDraftAttachment.groupKey, scope.groupKey))
    .orderBy(manualBookingGroupDraftAttachment.sortOrder)

  return {
    draft: {
      text: header.text ?? undefined,
      cprType: header.cprType,
      cprNumber: header.cprNumber ?? undefined,
      note: header.note ?? undefined,
      lines: lines.map((line) => ({
        amount: parseAmount(line.amount),
        text: line.text ?? undefined,
        dimensions: dimensionsByLineId.get(line.id) ?? [],
      })),
      attachments: attachments.map((attachment) => ({
        name: attachment.name,
        type: attachment.type,
        data: attachment.data,
      })),
    },
  }
})
