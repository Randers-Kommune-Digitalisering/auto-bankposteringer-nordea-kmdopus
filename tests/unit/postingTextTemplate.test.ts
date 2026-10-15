import { describe, expect, it } from 'vitest'
import {
  evaluatePostingTextTemplate,
  postingTextTemplateRe2Schema,
} from '../../engine/matching/domain/postingTextTemplateRe2'
import { postingTextTemplateSchema } from '../../engine/matching/domain/postingTextTemplate'
import { countRegexCaptureGroups } from '../../engine/matching/domain/postingTextTemplate'
import { ruleAccountingSchema, ruleDraftSchema } from '../../app/lib/db/schema/rule'
import { compileRuleDraftToDb } from '../../server/utils/rules/compileRuleDraftToDb'
import { ruleDraftApiSchema } from '../../server/utils/rules/ruleDraftApiSchema'

describe('posting text templates', () => {
  it('counts only capture groups, not non-capturing groups or parentheses in a character class', () => {
    expect(countRegexCaptureGroups(String.raw`(?:BDP)-([()])-(?P<year>\\d+)`)).toBe(2)
  })

  it('combines literal text with a selected capture group', () => {
    const template = postingTextTemplateSchema.parse({
      version: 1,
      parts: [
        { type: 'text', value: 'KSD' },
        { type: 'extract', source: 'txAdditionalInfo', pattern: 'KSD(\\d+)', captureGroup: 1 },
        { type: 'text', value: ' Kommune' },
      ],
    })

    expect(evaluatePostingTextTemplate(template, {
      txAdditionalInfo: 'Indbetaling KSD123456789 slut',
    })).toBe('KSD123456789 Kommune')
  })

  it('uses the full match by default and scans array fields in order', () => {
    const template = postingTextTemplateSchema.parse({
      version: 1,
      parts: [{ type: 'extract', source: 'remittanceUstrd', pattern: 'REF-\\d+' }],
    })

    expect(evaluatePostingTextTemplate(template, {
      remittanceUstrd: ['ingen reference', 'REF-123', 'REF-456'],
    })).toBe('REF-123')
  })

  it('omits only extraction parts without a match', () => {
    const template = postingTextTemplateSchema.parse({
      version: 1,
      parts: [
        { type: 'text', value: 'Reference: ' },
        { type: 'extract', source: 'bankMessage', pattern: 'KSD(\\d+)', captureGroup: 1 },
        { type: 'text', value: ' fra bank' },
      ],
    })

    expect(evaluatePostingTextTemplate(template, { bankMessage: 'ingen match' }))
      .toBe('Reference:  fra bank')
  })

  it('rejects invalid regex and overlong patterns', () => {
    expect(postingTextTemplateRe2Schema.safeParse({
      version: 1,
      parts: [{ type: 'extract', source: 'bankMessage', pattern: '(' }],
    }).success).toBe(false)
    expect(postingTextTemplateRe2Schema.safeParse({
      version: 1,
      parts: [{ type: 'extract', source: 'bankMessage', pattern: 'a'.repeat(513) }],
    }).success).toBe(false)
    expect(postingTextTemplateRe2Schema.safeParse({
      version: 1,
      parts: [{ type: 'extract', source: 'bankMessage', pattern: 'REF-\\d+', captureGroup: 1 }],
    }).success).toBe(false)
  })

  it('keeps regex execution out of the browser schema but validates it at the API boundary', () => {
    const draft = {
      type: 'standard',
      status: 'aktiv',
      relatedBankAccounts: ['account-1'],
      accountingCprType: 'ingen',
      accountingTextTemplate: {
        version: 1,
        parts: [{ type: 'extract', source: 'bankMessage', pattern: '(' }],
      },
    }

    expect(ruleDraftSchema.safeParse(draft).success).toBe(true)
    expect(ruleDraftApiSchema.safeParse(draft).success).toBe(false)
  })

  it('requires choosing either literal accounting text or a dynamic template', () => {
    const result = ruleAccountingSchema.safeParse({
      accountingText: 'Fast tekst',
      accountingTextTemplate: {
        version: 1,
        parts: [{ type: 'text', value: 'Dynamisk tekst' }],
      },
      accountingCprType: 'ingen',
    })

    expect(result.success).toBe(false)
  })

  it('includes the template in persisted accounting parameters and rule versions', () => {
    const template = postingTextTemplateSchema.parse({
      version: 1,
      parts: [{ type: 'extract', source: 'bankMessage', pattern: 'BDP\\d+' }],
    })
    const draft = ruleDraftSchema.parse({
      type: 'standard',
      status: 'aktiv',
      relatedBankAccounts: ['account-1'],
      accountingCprType: 'ingen',
      accountingTextTemplate: template,
    })

    const compiled = compileRuleDraftToDb(draft)

    expect(compiled.accountingParameters.bookingTextTemplate).toEqual(template)
    expect(compiled.versionContent.accounting.bookingTextTemplate).toEqual(template)
  })
})