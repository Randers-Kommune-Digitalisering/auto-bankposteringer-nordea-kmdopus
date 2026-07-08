import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { runWorker } from '#engine/queue/handlers/worker'
import { requireErrorHandlingWriteAccess } from '~~/server/auth/requireAppRoles'
import { getAppRole } from '~~/server/utils/appRole'

const bodySchema = z.object({
  maxJobs: z.number().int().positive().optional(),
  maxOutbox: z.number().int().positive().optional(),
})

export default defineEventHandler(async (event) => {
  await requireErrorHandlingWriteAccess(event)

  if (getAppRole() !== 'worker') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Manual worker-kørsel er kun tilladt i worker deployment',
    })
  }

  const body = bodySchema.safeParse(await readBody(event).catch(() => ({})))
  const options = body.success ? body.data : {}
  const result = await runWorker(options)
  return { success: true, ...result }
})
