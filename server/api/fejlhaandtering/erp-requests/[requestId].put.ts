import { defineEventHandler, createError, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { erpRequest } from '~/lib/db/schema/erp'

const bodySchema = z.object({
  payload: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const requestId = z.string().min(1).parse(event.context.params?.requestId)
  const body = bodySchema.parse(await readBody(event))

  const [updated] = await db
    .update(erpRequest)
    .set({ payload: body.payload })
    .where(eq(erpRequest.id, requestId))
    .returning({ id: erpRequest.id })

  if (!updated?.id) {
    throw createError({ statusCode: 404, statusMessage: 'ERP request blev ikke fundet' })
  }

  return { success: true, requestId: updated.id }
})
