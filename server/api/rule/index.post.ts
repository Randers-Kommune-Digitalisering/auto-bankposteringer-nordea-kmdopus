import { defineEventHandler, readBody, createError } from 'h3'
import { createInsertSchema } from 'drizzle-zod'
import {
  rule,
  ruleBankAccount,
  ruleRuleTag,
  mapMatchesToConditionRows,
  ruleDraftSchema,
  ruleVersion,
  RuleVersionInsertSchema,
  ruleBankingCondition,
  kmdAccountingParameters,
  kmdAttachment
} from '~/lib/db/schema/index'
import type { RuleDraftSchema } from '~/lib/db/schema'
import db from '~/lib/db'

const version = 1

export function compileRuleDraftToDb(draft: RuleDraftSchema) {
  const {
    matches,
    relatedBankAccounts,
    ruleTags,
    accountingPrimaryAccount,
    accountingSecondaryAccount,
    accountingTertiaryAccount,
    accountingText,
    accountingCprType,
    accountingCprNumber,
    accountingNotifyTo,
    accountingNote,
    accountingAttachmentName,
    accountingAttachmentFileExtension,
    accountingAttachmentData,
    ...rest
  } = draft

  const conditionRows = mapMatchesToConditionRows(matches ?? [])
  const bankAccountIds = Array.from(new Set(relatedBankAccounts))
  const tagIds = Array.from(new Set(ruleTags ?? []))
  const ruleData = {
    ...rest,
    currentVersionId: version
  }

  const attachments: Array<{ name: string; fileExtension: string; data: string }> = []
  const maxAttachments = Math.max(
    accountingAttachmentName?.length ?? 0,
    accountingAttachmentFileExtension?.length ?? 0,
    accountingAttachmentData?.length ?? 0
  )

  for (let i = 0; i < maxAttachments; i++) {
    const name = accountingAttachmentName?.[i]
    const fileExtension = accountingAttachmentFileExtension?.[i]
    const data = accountingAttachmentData?.[i]

    if (name && fileExtension && data) {
      attachments.push({ name, fileExtension, data })
    }
  }

  const accountingParameters = {
    primaryAccount: accountingPrimaryAccount,
    secondaryAccount: accountingSecondaryAccount,
    tertiaryAccount: accountingTertiaryAccount,
    bookingText: accountingText,
    cprType: accountingCprType,
    cprNumber: accountingCprNumber,
    notifyTo: accountingNotifyTo?.length ? accountingNotifyTo : null,
    note: accountingNote,
  }

  return {
    ruleData,
    bankAccountIds,
    tagIds,
    conditionRows,
    accountingParameters,
    attachments,
    versionContent: {
      ...ruleData,
      relatedBankAccounts: bankAccountIds,
      ruleTags: tagIds,
      matches: matches ?? [],
      accounting: {
        ...accountingParameters,
        attachments
      }
    }
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('[rule.post] incoming body', body)
    const draft = ruleDraftSchema.parse(body)
    console.log('[rule.post] parsed draft', draft)
    const { ruleData, bankAccountIds, tagIds, conditionRows, accountingParameters, attachments, versionContent } = compileRuleDraftToDb(draft)
    console.log('[rule.post] compiled payload', { ruleData, bankAccountIds, tagIds })

    const validatedRule = createInsertSchema(rule).parse(ruleData)

    const { ruleId } = await db.transaction(async (tx) => {
      const insertedRule = await tx.insert(rule).values(validatedRule).returning()
      if (!insertedRule[0]) {
        throw createError({ statusCode: 500, statusMessage: 'Fejl ved oprettelse af regel' })
      }

      const newRuleId = insertedRule[0].id

      if (bankAccountIds.length) {
        await tx.insert(ruleBankAccount).values(
          bankAccountIds.map(bankAccountId => ({ ruleId: newRuleId, bankAccountId }))
        )
        console.log('[rule.post] linked bank accounts', bankAccountIds)
      }

      if (tagIds.length) {
        await tx.insert(ruleRuleTag).values(
          tagIds.map(ruleTagId => ({ ruleId: newRuleId, ruleTagId }))
        )
        console.log('[rule.post] linked tags', tagIds)
      }

      if (conditionRows.length) {
        await tx.insert(ruleBankingCondition).values(
          conditionRows.map(condition => ({
            ...condition,
            ruleId: newRuleId,
          }))
        )
      }

      const [parameterRow] = await tx.insert(kmdAccountingParameters).values({
        ...accountingParameters,
        ruleId: newRuleId,
      }).returning()

      if (parameterRow?.id && attachments.length) {
        await tx.insert(kmdAttachment).values(
          attachments.map(attachment => ({
            ...attachment,
            parameterId: parameterRow.id,
          }))
        )
      }

      const versionPayload: RuleVersionInsertSchema = {
        ruleId: newRuleId,
        version,
        content: versionContent
      }

      await tx.insert(ruleVersion).values(versionPayload)
      console.log('[rule.post] inserted rule version', versionPayload)

      return { ruleId: newRuleId }
    })

    const storage = useStorage('rules')
    await storage.removeItem('rule-list')
    console.log('[rule.post] cache invalidated for rule-list')

    return { success: true, ruleId }
  } catch (error: any) {
    console.error('[rule.post] error', error)
    return {
      success: false,
      error: error?.issues ?? error?.message ?? 'Uventet fejl'
    }
  }
})
