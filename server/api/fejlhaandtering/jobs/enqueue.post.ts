import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { enqueueJob } from '#engine/queue/handlers/enqueueJob'

const bodySchema = z.object({
  type: z.string().min(1),
  payload: z.unknown().optional(),
  runAt: z.string().datetime().optional(),
  runId: z.string().uuid().optional(),
})

export default defineEventHandler(async (event) => {
  const body = bodySchema.parse(await readBody(event))

  // Keep it intentionally conservative; extend as the engine grows.
  const allowedTypes = new Set(['banking.ingest', 'erp.ingestResponses'])
  if (!allowedTypes.has(body.type)) {
    throw createError({
      statusCode: 422,
      statusMessage: `Job-type ikke understøttet: ${body.type}`,
    })
  }

  const runAt = body.runAt ? new Date(body.runAt) : undefined
  const id = await enqueueJob(
    body.type,
    body.payload ?? {},
    {
      ...(runAt ? { runAt } : {}),
      ...(body.runId ? { runId: body.runId } : {}),
    },
  )
  return { success: true, id }
})
