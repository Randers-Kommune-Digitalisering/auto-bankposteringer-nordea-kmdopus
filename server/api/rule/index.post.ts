import { defineEventHandler, readBody, createError } from 'h3'
import { createInsertSchema } from 'drizzle-zod'
import {
  rule,
  ruleBankAccount,
  ruleRuleTag,
  mapMatchesToConditionRows,
  ruleDraftSchema,
  ruleBankingCondition,
  ruleAccountingParameters,
  ruleAccountingAttachment,
  ruleAccountingDimensionValue
} from '~/lib/db/schema/rule'
import type { RuleDraftSchema } from '~/lib/db/schema/rule'
import { ruleVersion, type RuleVersionInsertSchema } from '~/lib/db/schema/ruleVersion'
import db from '~/lib/db'
import { logger } from '~/lib/logger'
import { getActiveErpSupplier, listAccountingDimensionConstraints, listAccountingDimensionDefinitions, resolveDimensionValueRows } from '~~/server/utils/accountingDimensions'
import { requireWriteAccess } from '~~/server/auth/requireAppRoles'
import { normalizeRuleTagIds, resolveRuleTagIds } from '~~/server/utils/ruleTags/resolveRuleTagIds'

const version = 1

function toDbNumericStringOrUndefined(value: number | null | undefined): string | undefined {
  if (value == null) return undefined
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldigt beløb (amount_min/amount_max)' })
  }
  // Amount min/max is DKK with øre. Store as fixed 2 decimals to avoid floating noise.
  return value.toFixed(2)
}

export function compileRuleDraftToDb(draft: RuleDraftSchema) {
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

  const conditionRows = mapMatchesToConditionRows(matches ?? [])
  const bankAccountIds = Array.from(new Set(relatedBankAccounts))
  const tagIds = normalizeRuleTagIds(ruleTags)
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
  const log = logger.child({ scope: 'api.rule.post' })
  try {
    const activeSupplier = await getActiveErpSupplier()
    const dimensionDefinitions = await listAccountingDimensionDefinitions(activeSupplier)
    const dimensionConstraints = await listAccountingDimensionConstraints(activeSupplier)

    const body = await readBody(event)
    const draft = ruleDraftSchema.parse(body)
    const { ruleData, bankAccountIds, tagIds, conditionRows, accountingParameters, attachments, versionContent } = compileRuleDraftToDb(draft)

    log.debug('Rule draft parsed', {
      bankAccountCount: bankAccountIds.length,
      tagCount: tagIds.length,
      conditionCount: conditionRows.length,
      attachmentCount: attachments.length,
    })

    const validatedRule = createInsertSchema(rule).parse({
      ...ruleData,
      matchAmountMin: toDbNumericStringOrUndefined((ruleData as any).matchAmountMin),
      matchAmountMax: toDbNumericStringOrUndefined((ruleData as any).matchAmountMax),
      erpSupplier: activeSupplier,
    })

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
        log.debug('Linked bank accounts', { bankAccountCount: bankAccountIds.length })
      }

      let resolvedTagIds: string[] = []
      if (tagIds.length) {
        const resolved = await resolveRuleTagIds(tx, tagIds)
        if (resolved.unknownTagIds.length) {
          throw createError({ statusCode: 400, statusMessage: `Ukendt tag: ${resolved.unknownTagIds.join(', ')}` })
        }
        resolvedTagIds = resolved.resolvedTagIds

        await tx.insert(ruleRuleTag).values(
          resolvedTagIds.map(ruleTagId => ({ ruleId: newRuleId, ruleTagId }))
        )
        log.debug('Linked tags', { tagCount: resolvedTagIds.length })
      }

      if (conditionRows.length) {
        await tx.insert(ruleBankingCondition).values(
          conditionRows.map(condition => ({
            ...condition,
            ruleId: newRuleId,
          }))
        )
      }

      // Persist dynamic accounting dimensions
      const dimensionRows = resolveDimensionValueRows({
        ruleId: newRuleId,
        dimensions: draft.accountingDimensions,
        definitions: dimensionDefinitions,
        constraints: dimensionConstraints,
      })

      if (dimensionRows.length) {
        await tx.insert(ruleAccountingDimensionValue).values(dimensionRows)
      }

      const [parameterRow] = await tx.insert(ruleAccountingParameters).values({
        ...accountingParameters,
        ruleId: newRuleId,
      }).returning()

      if (parameterRow?.id && attachments.length) {
        await tx.insert(ruleAccountingAttachment).values(
          attachments.map(attachment => ({
            ...attachment,
            parameterId: parameterRow.id,
          }))
        )
      }

      const versionPayload: RuleVersionInsertSchema = {
        ruleId: newRuleId,
        version,
        content: {
          ...versionContent,
          ruleTags: resolvedTagIds,
        },
      }

      await tx.insert(ruleVersion).values(versionPayload)
      log.debug('Inserted rule version', { version })

      return { ruleId: newRuleId }
    })

    const storage = useStorage('rules')
    await storage.removeItem('rule-list')
    log.debug('Cache invalidated', { cacheKey: 'rule-list' })

    return { success: true, ruleId }
  } catch (error: any) {
    log.error('Error creating rule', { err: error })
    return {
      success: false,
      error: error?.issues ?? error?.message ?? 'Uventet fejl'
    }
  }
})
