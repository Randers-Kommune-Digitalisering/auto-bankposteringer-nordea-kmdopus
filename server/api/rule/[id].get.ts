import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { mapConditionsToMatches, ruleDraftSchema, rule } from '~/lib/db/schema'
import db from '~/lib/db'

function normalizeDbRow(row: any) {
  const normalized: any = { ...row }
  for (const key in row) {
    if (Array.isArray(row[key])) continue
    if (row[key] === null) normalized[key] = undefined
  }
  return normalized
}

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Missing rule id' })
    }

    // --------------------------
    // Hent regel fra DB
    // --------------------------
    const dbRule = await db.query.rule.findFirst({
      where: (fields, { eq }) => eq(fields.id, Number(id)),
      with: {
        bankAccounts: {
          columns: {
            bankAccountId: true
          }
        },
        tags: {
          columns: {
            ruleTagId: true
          }
        },
        conditions: true,
        accountingParameters: {
          with: {
            attachments: true
          }
        }
      }
    })

    if (!dbRule) {
      throw createError({ statusCode: 404, statusMessage: 'Rule not found' })
    }

    // --------------------------
    // Håndter locking
    // --------------------------
    const now = new Date()

    // Hvis reglen allerede er låst, returnér lockedAt
    let isLocked = false
    if (dbRule.lockedAt && (new Date(dbRule.lockedAt).getTime() + 5 * 60 * 1000) > now.getTime()) {
      // Låsning gælder i f.eks. 5 minutter
      isLocked = true
    } else {
      // Sæt lockedAt = nu, så andre brugere ser reglen som låst
      await db.update(rule)
        .set({ lockedAt: now })
        .where(eq(rule.id, Number(id)))
    }

    // --------------------------
    // Byg draft objekt
    // --------------------------
    const { accountingParameters, conditions, ...rest } = dbRule
    const normalizedRule = normalizeDbRow(rest)
    const relatedBankAccounts = dbRule.bankAccounts?.map(acc => acc.bankAccountId).filter(Boolean) ?? []
    const ruleTags = dbRule.tags?.map(tag => tag.ruleTagId).filter(Boolean) ?? []

    delete (normalizedRule as any).bankAccounts
    delete (normalizedRule as any).tags
    delete (normalizedRule as any).conditions
    delete (normalizedRule as any).accountingParameters

    const matches = mapConditionsToMatches(conditions ?? [])
    const attachments = accountingParameters?.attachments ?? []
    const attachmentNames = attachments.map(att => att.name)
    const attachmentExtensions = attachments.map(att => att.fileExtension)
    const attachmentData = attachments.map(att => att.data)
    const draft = ruleDraftSchema.parse({
      ...normalizedRule,
      relatedBankAccounts,
      ruleTags,
      matches,
      accountingPrimaryAccount: accountingParameters?.primaryAccount ?? '',
      accountingSecondaryAccount: accountingParameters?.secondaryAccount ?? undefined,
      accountingTertiaryAccount: accountingParameters?.tertiaryAccount ?? undefined,
      accountingText: accountingParameters?.bookingText ?? undefined,
      accountingCprType: accountingParameters?.cprType ?? 'ingen',
      accountingCprNumber: accountingParameters?.cprNumber ?? undefined,
      accountingNotifyTo: accountingParameters?.notifyTo ?? undefined,
      accountingNote: accountingParameters?.note ?? undefined,
      accountingAttachmentName: attachmentNames.length ? attachmentNames : undefined,
      accountingAttachmentFileExtension: attachmentExtensions.length ? attachmentExtensions : undefined,
      accountingAttachmentData: attachmentData.length ? attachmentData : undefined,
      lockedAt: isLocked ? dbRule.lockedAt : undefined
    })

    // --------------------------
    // Valider med zod
    // --------------------------
    const validated = ruleDraftSchema.parse(draft)

    return validated
  } catch (error: any) {
    return {
      success: false,
      error: error?.issues ?? error?.message ?? 'Uventet fejl'
    }
  }
})
