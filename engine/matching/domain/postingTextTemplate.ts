import { z } from 'zod/v4'

export const POSTING_TEXT_SOURCE_FIELDS = [
  'bankMessage',
  'txAdditionalInfo',
  'entryAdditionalInfo',
  'remittanceCreditorReference',
  'remittanceUstrd',
  'remittanceAdditional',
  'counterparty',
] as const

export type PostingTextSourceField = typeof POSTING_TEXT_SOURCE_FIELDS[number]

export const postingTextSourceFieldSchema = z.enum(POSTING_TEXT_SOURCE_FIELDS)

const MAX_TEMPLATE_PARTS = 50
const MAX_REGEX_LENGTH = 512

const textPartSchema = z.object({
  type: z.literal('text'),
  value: z.string(),
})

const extractPartSchema = z.object({
  type: z.literal('extract'),
  source: postingTextSourceFieldSchema,
  pattern: z.string().min(1).max(MAX_REGEX_LENGTH),
  captureGroup: z.number().int().min(0).max(20).default(0),
})

export const postingTextTemplateSchema = z.object({
  version: z.literal(1),
  parts: z.array(z.discriminatedUnion('type', [textPartSchema, extractPartSchema]))
    .min(1)
    .max(MAX_TEMPLATE_PARTS),
})

export type PostingTextTemplate = z.infer<typeof postingTextTemplateSchema>
export type PostingTextTemplateValues = Partial<{
  bankMessage: string
  txAdditionalInfo: string
  entryAdditionalInfo: string
  remittanceCreditorReference: string
  remittanceUstrd: string[]
  remittanceAdditional: string[]
  counterparty: string
}>

export function countRegexCaptureGroups(pattern: string): number {
  let count = 0
  let escaped = false
  let inCharacterClass = false
  let quoted = false

  for (let index = 0; index < pattern.length; index++) {
    const character = pattern[index]
    const next = pattern[index + 1]

    if (quoted) {
      if (character === '\\' && next === 'E') {
        quoted = false
        index++
      }
      continue
    }

    if (escaped) {
      if (character === 'Q') quoted = true
      escaped = false
      continue
    }

    if (character === '\\') {
      escaped = true
      continue
    }
    if (inCharacterClass) {
      if (character === ']') inCharacterClass = false
      continue
    }
    if (character === '[') {
      inCharacterClass = true
      continue
    }
    if (character !== '(') continue

    if (next !== '?') {
      count++
    } else if (pattern.startsWith('(?P<', index)) {
      count++
    }
  }

  return count
}
