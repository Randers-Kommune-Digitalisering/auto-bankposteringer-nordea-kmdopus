import { z } from 'zod/v4'
import { ruleDraftSchema } from '~/lib/db/schema/rule'
import { postingTextTemplateRe2Schema } from '#engine/matching/domain/postingTextTemplateRe2'

export const ruleDraftApiSchema = ruleDraftSchema.superRefine((draft, ctx) => {
  if (!draft.accountingTextTemplate) return

  const result = postingTextTemplateRe2Schema.safeParse(draft.accountingTextTemplate)
  if (result.success) return

  for (const issue of result.error.issues) {
    ctx.addIssue({
      code: 'custom',
      path: ['accountingTextTemplate', ...issue.path],
      message: issue.message,
    })
  }
})
