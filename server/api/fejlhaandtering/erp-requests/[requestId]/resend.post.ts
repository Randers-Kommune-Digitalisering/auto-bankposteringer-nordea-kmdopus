import crypto from 'node:crypto'
import { defineEventHandler, createError, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { erpRequest, erpRequestLine } from '~/lib/db/schema/erp'
import { outbox } from '~/lib/db/schema/outbox'
import { erpIntegrationMetadata } from '~/lib/env/env'
import { buildKmdFileName } from '~/engine/erp-integration/infrastructure/adapters/kmd/postingXmlBuilder'

export default defineEventHandler(async (event) => {
  const requestId = z.string().min(1).parse(event.context.params?.requestId)

  const bodySchema = z
    .object({ payload: z.string().min(1).optional() })
    .optional()
    .default({})
  const body = bodySchema.parse(await readBody(event).catch(() => ({})))

  const existing = await db.query.erpRequest.findFirst({
    where: (fields, { eq }) => eq(fields.id, requestId),
    columns: { id: true, runId: true, payload: true },
  })

  if (!existing?.id) {
    throw createError({ statusCode: 404, statusMessage: 'ERP request blev ikke fundet' })
  }

  const payload = (body.payload ?? existing.payload ?? '').trim()
  if (!payload) {
    throw createError({ statusCode: 422, statusMessage: 'ERP request payload mangler (kan ikke genfremsende)' })
  }

  const newRequestId = `${requestId}__retry__${crypto.randomUUID()}`
  const newDedupeKey = `erp.upload:${newRequestId}`
  const retryFilename = buildRetryFilename()

  await db.transaction(async (tx) => {
    await tx.insert(erpRequest).values({
      id: newRequestId,
      runId: existing.runId,
      payload,
    })

    const lines = await tx
      .select({
        lineNo: erpRequestLine.lineNo,
        transactionId: erpRequestLine.transactionId,
      })
      .from(erpRequestLine)
      .where(eq(erpRequestLine.requestId, requestId))

    if (lines.length) {
      await tx.insert(erpRequestLine).values(
        lines.map((line) => ({
          requestId: newRequestId,
          lineNo: line.lineNo,
          transactionId: line.transactionId,
        })),
      )
    }

    await tx
      .insert(outbox)
      .values({
        topic: 'erp.uploadRequestPayload',
        runId: existing.runId,
        dedupeKey: newDedupeKey,
        payload: { requestId: newRequestId, sourceRequestId: requestId, filename: retryFilename },
        status: 'pending',
        nextAttemptAt: new Date(),
      })
      .onConflictDoNothing({ target: outbox.dedupeKey })
  })

  return { success: true, requestId: newRequestId, sourceRequestId: requestId, filename: retryFilename }
})

function buildRetryFilename(): string {
  if (erpIntegrationMetadata.erpSupplier !== 'kmd') {
    throw createError({
      statusCode: 409,
      statusMessage: `ERP resend filnavn ikke understøttet for leverandør: ${erpIntegrationMetadata.erpSupplier}`,
    })
  }

  const now = new Date()
  const docDate = formatDateCompact(now)
  const docTime = formatTimeCompact(now)

  return buildKmdFileName(
    erpIntegrationMetadata.integrationFileNameMask,
    erpIntegrationMetadata.municipalityCode,
    erpIntegrationMetadata.integrationId,
    docDate,
    docTime,
  )
}

function formatDateCompact(input: Date): string {
  const year = input.getFullYear()
  const month = String(input.getMonth() + 1).padStart(2, '0')
  const day = String(input.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function formatTimeCompact(input: Date): string {
  const hours = String(input.getHours()).padStart(2, '0')
  const minutes = String(input.getMinutes()).padStart(2, '0')
  const seconds = String(input.getSeconds()).padStart(2, '0')
  return `${hours}${minutes}${seconds}`
}
