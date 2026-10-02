import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { requireWriteAccessWithIdentity } from '~~/server/auth/requireAppRoles'
import { acquireRuleEditLock, releaseRuleEditLock } from '~~/server/utils/ruleEditLock'

const lockRequestSchema = z.object({
  action: z.enum(['acquire', 'renew', 'release']),
})

export default defineEventHandler(async (event) => {
  const user = await requireWriteAccessWithIdentity(event)
  const ruleId = Number(event.context.params?.id)
  if (!Number.isInteger(ruleId) || ruleId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldigt regel-id' })
  }

  const parsedBody = lockRequestSchema.safeParse(await readBody(event))
  if (!parsedBody.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldig regellås-handling' })
  }

  if (parsedBody.data.action === 'release') {
    return releaseRuleEditLock(ruleId, user)
  }

  return acquireRuleEditLock(ruleId, user, parsedBody.data.action === 'renew')
})