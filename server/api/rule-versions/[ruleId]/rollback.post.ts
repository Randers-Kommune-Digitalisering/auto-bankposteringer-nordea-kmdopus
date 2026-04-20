import { defineEventHandler, createError, readBody } from 'h3'
import { and, eq, max } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import {
  erpAccountingDimensionDefinition,
  ruleAccountingParameters,
  ruleAccountingAttachment,
  mapMatchesToConditionRows,
  rule,
  ruleAccountingDimensionValue,
  ruleBankAccount,
  ruleBankingCondition,
  ruleRuleTag,
} from '~/lib/db/schema/rule'
import { ruleVersion, type RuleVersionInsertSchema } from '~/lib/db/schema/ruleVersion'
import { listAccountingDimensionConstraints, resolveDimensionValueRows, type AccountingDimensionDefinition } from '~~/server/utils/accountingDimensions'
import { normalizeRuleTagIds, resolveRuleTagIds } from '~~/server/utils/ruleTags/resolveRuleTagIds'

type CprType = 'ingen' | 'statisk' | 'dynamisk'

function normalizeCprType(value: unknown): CprType | null {
  if (value === 'ingen' || value === 'statisk' || value === 'dynamisk') return value
  return null
}

const requestSchema = z.object({
  version: z.number().int().positive(),
})

const attachmentSchema = z.object({
  name: z.string().min(1),
  fileExtension: z.string().min(1),
  data: z.string().min(1),
})

const versionContentSchema = z
  .object({
    type: z.string().min(1),
    status: z.string().min(1),
    matchAmountMin: z.union([z.number(), z.string()]).optional().nullable(),
    matchAmountMax: z.union([z.number(), z.string()]).optional().nullable(),
    relatedBankAccounts: z.array(z.string()).optional().default([]),
    ruleTags: z.array(z.string()).optional().default([]),
    matches: z.array(z.any()).optional().default([]),
    accounting: z
      .object({
        dimensions: z.array(z.object({
          key: z.string().min(1),
          value: z.string().min(1),
        })).optional().default([]),
        // Legacy fields (pre-dimensions refactor)
        primaryAccount: z.string().optional().nullable(),
        secondaryAccount: z.string().optional().nullable(),
        tertiaryAccount: z.string().optional().nullable(),
        bookingText: z.string().optional().nullable(),
        cprType: z.string().optional().nullable(),
        cprNumber: z.string().optional().nullable(),
        notifyTo: z.string().optional().nullable(),
        note: z.string().optional().nullable(),
        attachments: z.array(attachmentSchema).optional().default([]),
      })
      .passthrough(),
  })
  .passthrough()

function normalizeNumeric(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const raw = value.trim()
    if (!raw.length) return null

    const compact = raw.replace(/[\s\u00A0]/g, '')
    const lastComma = compact.lastIndexOf(',')
    const lastDot = compact.lastIndexOf('.')

    let normalized = compact
    if (lastComma !== -1 && lastDot !== -1) {
      const commaIsDecimal = lastComma > lastDot
      normalized = commaIsDecimal
        ? normalized.replace(/\./g, '').replace(/,/g, '.')
        : normalized.replace(/,/g, '')
    } else if (lastComma !== -1) {
      normalized = normalized.replace(/,/g, '.')
    } else {
      normalized = normalized.replace(/,/g, '')
    }

    if (!normalized.length) return null
    const parsed = Number(normalized)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

export default defineEventHandler(async (event) => {
  const ruleId = Number(event.context.params?.ruleId)
  if (!ruleId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing ruleId' })
  }

  const body = requestSchema.parse(await readBody(event))

  const existingRule = await db.query.rule.findFirst({
    where: (fields, { eq }) => eq(fields.id, ruleId),
    columns: {
      id: true,
      currentVersionId: true,
      erpSupplier: true,
    },
  })

  if (!existingRule) {
    throw createError({ statusCode: 404, statusMessage: 'Rule not found' })
  }

  const [target] = await db
    .select({
      version: ruleVersion.version,
      content: ruleVersion.content,
    })
    .from(ruleVersion)
    .where(and(eq(ruleVersion.ruleId, ruleId), eq(ruleVersion.version, body.version)))
    .limit(1)

  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'Rule version not found' })
  }

  const parsedContent = versionContentSchema.parse(target.content)

  const dimensionConstraints = await listAccountingDimensionConstraints(existingRule.erpSupplier as any)

  const [{ latestVersion }] = await db
    .select({ latestVersion: max(ruleVersion.version) })
    .from(ruleVersion)
    .where(eq(ruleVersion.ruleId, ruleId))

  const newVersion = Number(latestVersion ?? existingRule.currentVersionId ?? 0) + 1

  const bankAccountIds = Array.from(new Set(parsedContent.relatedBankAccounts ?? []))
  const tagIds = normalizeRuleTagIds(parsedContent.ruleTags ?? [])
  const conditionRows = mapMatchesToConditionRows((parsedContent.matches as any[]) ?? [])

  const amountMin = normalizeNumeric(parsedContent.matchAmountMin)
  const amountMax = normalizeNumeric(parsedContent.matchAmountMax)

  const accounting = parsedContent.accounting ?? ({} as any)
  const attachments = Array.isArray(accounting.attachments) ? accounting.attachments : []

  await db.transaction(async (tx) => {
    let resolvedTagIds: string[] = []
    if (tagIds.length) {
      const resolved = await resolveRuleTagIds(tx, tagIds)
      if (resolved.unknownTagIds.length) {
        throw createError({ statusCode: 400, statusMessage: `Ukendt tag: ${resolved.unknownTagIds.join(', ')}` })
      }
      resolvedTagIds = resolved.resolvedTagIds
    }

    const versionPayload: RuleVersionInsertSchema = {
      ruleId,
      version: newVersion,
      content: {
        ...parsedContent,
        currentVersionId: newVersion,
        relatedBankAccounts: bankAccountIds,
        ruleTags: resolvedTagIds,
        matches: (parsedContent.matches as any[]) ?? [],
        accounting: {
          ...accounting,
          attachments,
        },
      },
    }

    const [updatedRule] = await tx
      .update(rule)
      .set({
        type: parsedContent.type as any,
        status: parsedContent.status as any,
        matchAmountMin: amountMin == null ? null : String(amountMin),
        matchAmountMax: amountMax == null ? null : String(amountMax),
        currentVersionId: newVersion,
        lockedAt: null,
        lockedBy: null,
      })
      .where(eq(rule.id, ruleId))
      .returning({ id: rule.id })

    if (!updatedRule) {
      throw createError({ statusCode: 500, statusMessage: 'Kunne ikke opdatere regel' })
    }

    await tx.delete(ruleBankAccount).where(eq(ruleBankAccount.ruleId, ruleId))
    if (bankAccountIds.length) {
      await tx.insert(ruleBankAccount).values(bankAccountIds.map((bankAccountId) => ({ ruleId, bankAccountId })))
    }

    await tx.delete(ruleRuleTag).where(eq(ruleRuleTag.ruleId, ruleId))
    if (resolvedTagIds.length) {
      await tx.insert(ruleRuleTag).values(resolvedTagIds.map((ruleTagId) => ({ ruleId, ruleTagId })))
    }

    await tx.delete(ruleBankingCondition).where(eq(ruleBankingCondition.ruleId, ruleId))
    if (conditionRows.length) {
      await tx.insert(ruleBankingCondition).values(conditionRows.map((condition) => ({ ...condition, ruleId })))
    }

    // Replace dynamic accounting dimensions
    await tx.delete(ruleAccountingDimensionValue).where(eq(ruleAccountingDimensionValue.ruleId, ruleId))

    const definitions: AccountingDimensionDefinition[] = await tx
      .select({
        id: erpAccountingDimensionDefinition.id,
        key: erpAccountingDimensionDefinition.key,
        required: erpAccountingDimensionDefinition.required,
        sortOrder: erpAccountingDimensionDefinition.sortOrder,
        erpTarget: erpAccountingDimensionDefinition.erpTarget,
      })
      .from(erpAccountingDimensionDefinition)
      .where(eq(erpAccountingDimensionDefinition.erpSupplier, existingRule.erpSupplier as any))

    const legacyFallbackDimensions = (!accounting.dimensions?.length && existingRule.erpSupplier === 'kmd')
      ? [
          accounting.primaryAccount ? { key: 'artskonto', value: String(accounting.primaryAccount) } : null,
          accounting.secondaryAccount ? { key: 'omkostningssted', value: String(accounting.secondaryAccount) } : null,
          accounting.tertiaryAccount ? { key: 'psp-element', value: String(accounting.tertiaryAccount) } : null,
        ].filter(Boolean) as any
      : accounting.dimensions

    const dimensionRows = resolveDimensionValueRows({
      ruleId,
      dimensions: legacyFallbackDimensions,
      definitions,
      constraints: dimensionConstraints,
    })

    if (dimensionRows.length) {
      await tx.insert(ruleAccountingDimensionValue).values(dimensionRows)
    }

    const accountingParameters: {
      bookingText: string | null
      cprType: CprType | null
      cprNumber: string | null
      notifyTo: string | null
      note: string | null
    } = {
      bookingText: accounting.bookingText ?? null,
      cprType: normalizeCprType(accounting.cprType),
      cprNumber: accounting.cprNumber ?? null,
      notifyTo: accounting.notifyTo ?? null,
      note: accounting.note ?? null,
    }

    const [existingParameters] = await tx
      .update(ruleAccountingParameters)
      .set(accountingParameters)
      .where(eq(ruleAccountingParameters.ruleId, ruleId))
      .returning({ id: ruleAccountingParameters.id })

    let parameterId = existingParameters?.id
    if (!parameterId) {
      const [created] = await tx
        .insert(ruleAccountingParameters)
        .values({ ...accountingParameters, ruleId })
        .returning({ id: ruleAccountingParameters.id })
      parameterId = created?.id
    }

    if (parameterId) {
      await tx.delete(ruleAccountingAttachment).where(eq(ruleAccountingAttachment.parameterId, parameterId))
      if (attachments.length) {
        await tx.insert(ruleAccountingAttachment).values(
          attachments.map((attachment: any) => ({
            parameterId,
            name: String(attachment.name),
            fileExtension: String(attachment.fileExtension),
            data: String(attachment.data),
          })),
        )
      }
    }

    await tx.insert(ruleVersion).values(versionPayload)
  })

  const storage = useStorage('rules')
  await storage.removeItem('rule-list')

  return {
    success: true,
    ruleId,
    restoredFromVersion: body.version,
    newVersion,
  }
})
