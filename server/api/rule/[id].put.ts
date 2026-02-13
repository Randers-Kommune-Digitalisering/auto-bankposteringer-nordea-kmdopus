import { defineEventHandler, readBody, createError } from 'h3'
import { createInsertSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import type { RuleDraftSchema } from '~/lib/db/schema'
import {
  rule,
  ruleBankAccount,
  ruleRuleTag,
  ruleVersion,
  ruleDraftSchema,
  RuleVersionInsertSchema,
  mapMatchesToConditionRows,
  ruleBankingCondition,
  kmdAccountingParameters,
  kmdAttachment
} from '~/lib/db/schema/index'

function compileRuleDraftToDb(draft: RuleDraftSchema, newVersion: bigint) {
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

  const bankAccountIds = Array.from(new Set(relatedBankAccounts))
  const tagIds = Array.from(new Set(ruleTags ?? []))
  const conditionRows = mapMatchesToConditionRows(matches ?? [])
  const ruleData = {
    ...rest,
    currentVersionId: newVersion
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
  const id = Number(event.context.params?.id)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing rule id' })

  const body = await readBody(event)
  const parsed = ruleDraftSchema.safeParse(body)
  if (!parsed.success) return { success: false, error: parsed.error }

  // -------------------
  // Hent eksisterende regel
  // -------------------
  const existingRule = await db.query.rule.findFirst({
    where: (fields, { eq }) => eq(fields.id, id)
  })
  if (!existingRule) throw createError({ statusCode: 404, statusMessage: 'Rule not found' })

  // -------------------
  // Tjek locking (5 min)
  // -------------------
  const now = new Date()
  if (existingRule.lockedAt && (new Date(existingRule.lockedAt).getTime() + 5 * 60 * 1000) > now.getTime()) {
    return { success: false, error: 'Reglen er låst af en anden bruger' }
  }

  const newVersion = (existingRule.currentVersionId ?? 0) + 1

  const { ruleData, bankAccountIds, tagIds, conditionRows, accountingParameters, attachments, versionContent } = compileRuleDraftToDb(parsed.data, BigInt(newVersion))
  const validatedDbPayload = createInsertSchema(rule).parse(ruleData)

  await db.transaction(async (tx) => {
    const [updatedRule] = await tx.update(rule)
      .set(validatedDbPayload)
      .where((fields, { eq }) => eq(fields.id, id))
      .returning()

    if (!updatedRule) throw createError({ statusCode: 500, statusMessage: 'Fejl ved opdatering af regel' })

    await tx.delete(ruleBankAccount).where(eq(ruleBankAccount.ruleId, id))
    if (bankAccountIds.length) {
      await tx.insert(ruleBankAccount).values(
        bankAccountIds.map(bankAccountId => ({ ruleId: id, bankAccountId }))
      )
    }

    await tx.delete(ruleRuleTag).where(eq(ruleRuleTag.ruleId, id))
    if (tagIds.length) {
      await tx.insert(ruleRuleTag).values(
        tagIds.map(ruleTagId => ({ ruleId: id, ruleTagId }))
      )
    }

    await tx.delete(ruleBankingCondition).where(eq(ruleBankingCondition.ruleId, id))
    if (conditionRows.length) {
      await tx.insert(ruleBankingCondition).values(
        conditionRows.map(condition => ({ ...condition, ruleId: id }))
      )
    }

    const [existingParameters] = await tx.update(kmdAccountingParameters)
      .set(accountingParameters)
      .where(eq(kmdAccountingParameters.ruleId, id))
      .returning()

    let parameterId = existingParameters?.id
    if (!parameterId) {
      const [createdParameters] = await tx.insert(kmdAccountingParameters)
        .values({ ...accountingParameters, ruleId: id })
        .returning()
      parameterId = createdParameters?.id ?? undefined
    }

    if (parameterId) {
      await tx.delete(kmdAttachment).where(eq(kmdAttachment.parameterId, parameterId))
      if (attachments.length) {
        await tx.insert(kmdAttachment).values(
          attachments.map(attachment => ({
            ...attachment,
            parameterId,
          }))
        )
      }
    }

    const versionPayload: RuleVersionInsertSchema = {
      ruleId: id,
      version: Number(newVersion),
      content: versionContent
    }

    await tx.insert(ruleVersion).values(versionPayload)
  })

  const storage = useStorage('rules')
  await storage.removeItem('rule-list')

  return { success: true, ruleId: id, version: Number(newVersion) }
})
