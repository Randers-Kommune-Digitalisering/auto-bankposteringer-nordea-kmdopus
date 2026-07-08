import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { erpRequest, erpResponse } from '~/lib/db/schema/erp'
import { requireErrorHandlingReadAccess } from '~~/server/auth/requireAppRoles'

export default defineEventHandler(async (event) => {
  await requireErrorHandlingReadAccess(event)

  const requestId = z.string().min(1).parse(event.context.params?.requestId)

  const [row] = await db
    .select({
      requestId: erpRequest.id,
      runId: erpRequest.runId,
      requestPayload: erpRequest.payload,
      responseId: erpResponse.id,
      responsePayload: erpResponse.payload,
      responseStatusText: erpResponse.statusText,
    })
    .from(erpRequest)
    .leftJoin(erpResponse, eq(erpResponse.requestId, erpRequest.id))
    .where(eq(erpRequest.id, requestId))
    .limit(1)

  if (!row?.requestId) {
    throw createError({ statusCode: 404, statusMessage: 'ERP request blev ikke fundet' })
  }

  return {
    requestId: String(row.requestId),
    runId: String(row.runId),
    requestPayload: row.requestPayload ?? null,
    response: row.responseId
      ? {
          id: String(row.responseId),
          statusText: row.responseStatusText ?? null,
          payload: row.responsePayload ?? null,
        }
      : null,
  }
})
