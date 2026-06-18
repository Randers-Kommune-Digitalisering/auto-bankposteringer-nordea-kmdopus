import { defineEventHandler, readBody, createError } from 'h3'
import { createInsertSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import type { RuleDraftSchema } from '~/lib/db/schema/rule'
import { normalizeRuleTagIds, resolveRuleTagIds } from '~~/server/utils/ruleTags/resolveRuleTagIds'
import {
  rule,
  ruleBankAccount,
  ruleRuleTag,
  ruleDraftSchema,
  mapMatchesToConditionRows,
  ruleBankingCondition,
  ruleAccountingParameters,
  ruleAccountingAttachment,
  ruleAccountingDimensionValue
} from '~/lib/db/schema/rule'
import { ruleVersion, type RuleVersionInsertSchema } from '~/lib/db/schema/ruleVersion'
import { getActiveErpSupplier, listAccountingDimensionConstraints, listAccountingDimensionDefinitions, resolveDimensionValueRows } from '~~/server/utils/accountingDimensions'
import { requireWriteAccess } from '~~/server/auth/requireAppRoles'

function toDbNumericStringOrUndefined(value: number | null | undefined): string | undefined {
  if (value == null) return undefined
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldigt beløb (amount_min/amount_max)' })
  }
  return value.toFixed(2)
}

function compileRuleDraftToDb(draft: RuleDraftSchema, newVersion: number, erpSupplier: string) {
  const {
    matches,
    relatedBankAccounts,
    ruleTags,
    accountingDimensions,
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
  const tagIds = normalizeRuleTagIds(ruleTags)
  const conditionRows = mapMatchesToConditionRows(matches ?? [])
  const ruleData = {
    ...rest,
    currentVersionId: newVersion,
    erpSupplier,
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
        dimensions: accountingDimensions ?? [],
        attachments
      }
    }
  }
}

export default defineEventHandler(async (event) => {
  await requireWriteAccess(event)
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

  const activeSupplier = await getActiveErpSupplier()
  if (existingRule.erpSupplier !== activeSupplier) {
    throw createError({ statusCode: 500, statusMessage: `ERP supplier mismatch (policy A): db=${existingRule.erpSupplier} active=${activeSupplier}` })
  }

  const dimensionDefinitions = await listAccountingDimensionDefinitions(activeSupplier)
  const dimensionConstraints = await listAccountingDimensionConstraints(activeSupplier)

  const { ruleData, bankAccountIds, tagIds, conditionRows, accountingParameters, attachments, versionContent } = compileRuleDraftToDb(parsed.data, newVersion, existingRule.erpSupplier)
  const validatedDbPayload = createInsertSchema(rule).parse({
    ...ruleData,
    matchAmountMin: toDbNumericStringOrUndefined((ruleData as any).matchAmountMin),
    matchAmountMax: toDbNumericStringOrUndefined((ruleData as any).matchAmountMax),
  })

  await db.transaction(async (tx) => {
    const [updatedRule] = await tx.update(rule)
      .set(validatedDbPayload)
      .where(eq(rule.id, id))
      .returning()

    if (!updatedRule) throw createError({ statusCode: 500, statusMessage: 'Fejl ved opdatering af regel' })

    await tx.delete(ruleBankAccount).where(eq(ruleBankAccount.ruleId, id))
    if (bankAccountIds.length) {
      await tx.insert(ruleBankAccount).values(
        bankAccountIds.map(bankAccountId => ({ ruleId: id, bankAccountId }))
      )
    }

    await tx.delete(ruleRuleTag).where(eq(ruleRuleTag.ruleId, id))
    let resolvedTagIds: string[] = []
    if (tagIds.length) {
      const resolved = await resolveRuleTagIds(tx, tagIds)
      if (resolved.unknownTagIds.length) {
        throw createError({ statusCode: 400, statusMessage: `Ukendt tag: ${resolved.unknownTagIds.join(', ')}` })
      }
      resolvedTagIds = resolved.resolvedTagIds

      await tx.insert(ruleRuleTag).values(
        resolvedTagIds.map(ruleTagId => ({ ruleId: id, ruleTagId }))
      )
    }

    await tx.delete(ruleBankingCondition).where(eq(ruleBankingCondition.ruleId, id))
    if (conditionRows.length) {
      await tx.insert(ruleBankingCondition).values(
        conditionRows.map(condition => ({ ...condition, ruleId: id }))
      )
    }

    // Replace dynamic accounting dimensions
    await tx.delete(ruleAccountingDimensionValue).where(eq(ruleAccountingDimensionValue.ruleId, id))
    const dimensionRows = resolveDimensionValueRows({
      ruleId: id,
      dimensions: parsed.data.accountingDimensions,
      definitions: dimensionDefinitions,
      constraints: dimensionConstraints,
    })
    if (dimensionRows.length) {
      await tx.insert(ruleAccountingDimensionValue).values(dimensionRows)
    }

    const [existingParameters] = await tx.update(ruleAccountingParameters)
      .set(accountingParameters)
      .where(eq(ruleAccountingParameters.ruleId, id))
      .returning()

    let parameterId = existingParameters?.id
    if (!parameterId) {
      const [createdParameters] = await tx.insert(ruleAccountingParameters)
        .values({ ...accountingParameters, ruleId: id })
        .returning()
      parameterId = createdParameters?.id ?? undefined
    }

    if (parameterId) {
      await tx.delete(ruleAccountingAttachment).where(eq(ruleAccountingAttachment.parameterId, parameterId))
      if (attachments.length) {
        await tx.insert(ruleAccountingAttachment).values(
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
      content: {
        ...versionContent,
        ruleTags: resolvedTagIds,
      }
    }

    await tx.insert(ruleVersion).values(versionPayload)
  })

  const storage = useStorage('rules')
  await storage.removeItem('rule-list')

  return { success: true, ruleId: id, version: Number(newVersion) }
})
