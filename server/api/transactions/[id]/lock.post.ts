import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import {
  requireWriteAccessWithIdentity,
} from '~~/server/auth/requireAppRoles'
import {
  acquireTransactionBookingLock,
  releaseTransactionBookingLock,
} from '~~/server/utils/transactionBookingLock'

const lockRequestSchema = z.object({
  action: z.enum(['acquire', 'renew', 'release']),
})

export default defineEventHandler(async (event) => {
  const user = await requireWriteAccessWithIdentity(event)
  const parsedId = z.string().uuid().safeParse(event.context.params?.id)
  if (!parsedId.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldigt transaktions-id' })
  }

  const parsedBody = lockRequestSchema.safeParse(await readBody(event))
  if (!parsedBody.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldig bookinglås-handling' })
  }

  if (parsedBody.data.action === 'release') {
    return releaseTransactionBookingLock(parsedId.data, user)
  }

  return acquireTransactionBookingLock(parsedId.data, user, parsedBody.data.action === 'renew')
})