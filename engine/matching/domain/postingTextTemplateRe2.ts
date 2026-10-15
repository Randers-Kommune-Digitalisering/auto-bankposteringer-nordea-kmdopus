import { RE2 } from 're2-wasm'
import { z } from 'zod/v4'
import {
  countRegexCaptureGroups,
  postingTextTemplateSchema,
} from './postingTextTemplate'
import type {
  PostingTextTemplate,
  PostingTextTemplateValues,
} from './postingTextTemplate'

export const postingTextTemplateRe2Schema = postingTextTemplateSchema.superRefine((template, ctx) => {
  template.parts.forEach((part, index) => {
    if (part.type !== 'extract') return

    try {
      new RE2(part.pattern, 'u')
      if (part.captureGroup > countRegexCaptureGroups(part.pattern)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['parts', index, 'captureGroup'],
          message: 'Fangstgruppen findes ikke i regex-mønstret',
        })
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['parts', index, 'pattern'],
        message: 'Ugyldigt regex-mønster',
      })
    }
  })
})

export function evaluatePostingTextTemplate(
  template: PostingTextTemplate,
  values: PostingTextTemplateValues,
): string {
  return template.parts.map((part) => {
    if (part.type === 'text') return part.value

    const sourceValue = values[part.source]
    const candidates = Array.isArray(sourceValue) ? sourceValue : [sourceValue]
    const expression = new RE2(part.pattern, 'u')

    for (const candidate of candidates) {
      if (!candidate) continue
      const match = expression.exec(candidate)
      if (match) return match[part.captureGroup] ?? ''
    }

    return ''
  }).join('')
}
