import { defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { runWorker } from '#engine/queue/handlers/worker'

const bodySchema = z.object({
  maxJobs: z.number().int().positive().optional(),
  maxOutbox: z.number().int().positive().optional(),
})

export default defineEventHandler(async (event) => {
  const body = bodySchema.safeParse(await readBody(event).catch(() => ({})))
  const options = body.success ? body.data : {}
  const result = await runWorker(options)
  return { success: true, ...result }
})
