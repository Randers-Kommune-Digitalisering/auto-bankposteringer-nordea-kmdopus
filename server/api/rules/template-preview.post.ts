import { defineEventHandler, readBody } from 'h3'
import { z } from 'zod/v4'
import { postingTextTemplateSchema } from '#engine/matching/domain/postingTextTemplate'
import {
  evaluatePostingTextTemplate,
  postingTextTemplateRe2Schema,
} from '#engine/matching/domain/postingTextTemplateRe2'
import type { PostingTextTemplateValues } from '#engine/matching/domain/postingTextTemplate'
import { requireAnyAppRole } from '~~/server/auth/requireAppRoles'

const previewRequestSchema = z.object({
  template: postingTextTemplateSchema,
  samples: z.array(z.string().max(512)).max(50),
}).superRefine((request, ctx) => {
  if (request.samples.length !== request.template.parts.length) {
    ctx.addIssue({
      code: 'custom',
      path: ['samples'],
      message: 'Eksempelværdierne passer ikke til skabelonens dele',
    })
  }
})

export default defineEventHandler(async (event) => {
  await requireAnyAppRole(event, ['rule_admin', 'dev'])

  const request = previewRequestSchema.safeParse(await readBody(event))
  if (!request.success) {
    return {
      preview: '',
      validationMessage: request.error.issues[0]?.message ?? 'Ugyldig skabelon',
    }
  }

  const validatedTemplate = postingTextTemplateRe2Schema.safeParse(request.data.template)
  if (!validatedTemplate.success) {
    return {
      preview: '',
      validationMessage: validatedTemplate.error.issues[0]?.message ?? 'Ugyldig regex',
    }
  }

  const preview = validatedTemplate.data.parts.map((part, index) => {
    if (part.type === 'text') return part.value

    const sample = request.data.samples[index] ?? ''
    const value = part.source === 'remittanceUstrd' || part.source === 'remittanceAdditional'
      ? sample.split('\n')
      : sample

    return evaluatePostingTextTemplate(
      { version: 1, parts: [part] },
      { [part.source]: value } as PostingTextTemplateValues,
    )
  }).join('').slice(0, 50)

  return { preview, validationMessage: '' }
})
