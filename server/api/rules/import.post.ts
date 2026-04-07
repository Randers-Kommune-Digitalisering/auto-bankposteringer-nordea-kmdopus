import { defineEventHandler, readBody, getQuery } from 'h3'
import Papa from 'papaparse'
import { createInsertSchema } from 'drizzle-zod'
import { inArray, sql } from 'drizzle-orm'

import db from '~/lib/db'
import { logger } from '~/lib/logger'
import {
  ruleDraftSchema,
  type MatchEntry,
  type RuleDraftSchema,
  rule,
  ruleBankAccount,
  ruleRuleTag,
  ruleBankingCondition,
  ruleAccountingParameters,
  ruleAccountingAttachment,
  ruleAccountingDimensionValue,
} from '~/lib/db/schema/rule'
import { account } from '~/lib/db/schema/account'
import { ruleTag } from '~/lib/db/schema/ruleTag'
import { ruleVersion, type RuleVersionInsertSchema } from '~/lib/db/schema/ruleVersion'
import { ruleConditionOperatorValues, ruleConditionFieldValues } from '~/lib/db/schema/enums'
import { fieldToCategory } from '~/lib/rules/match-config'
import {
  getActiveErpSupplier,
  listAccountingDimensionConstraints,
  listAccountingDimensionDefinitions,
  resolveDimensionValueRows,
} from '~~/server/utils/accountingDimensions'
import { compileRuleDraftToDb } from '~~/server/utils/rules/compileRuleDraftToDb'
import { normalizeRuleTagIds } from '~~/server/utils/ruleTags/resolveRuleTagIds'
import { requireRoles } from '~~/server/auth/keycloakAuth'

const version = 1

type ImportError = {
  row: number
  field?: string
  message: string
}

type ImportResponse =
  | {
      success: true
      dryRun: boolean
      totalRows: number
      importedCount?: number
      ruleIds?: number[]
    }
  | {
      success: false
      totalRows: number
      errors: ImportError[]
    }

function splitMultiValueCell(value: unknown): string[] {
  if (value == null) return []
  const s = String(value).trim()
  if (!s) return []

  // Split on ampersand (preferred) while also accepting comma and pipe (legacy).
  // Allow escaping separators with backslash: \&, \, \| and \\.
  const out: string[] = []
  let current = ''
  let escaping = false

  for (const ch of s) {
    if (escaping) {
      current += ch
      escaping = false
      continue
    }
    if (ch === '\\') {
      escaping = true
      continue
    }
    if (ch === '&' || ch === ',' || ch === '|') {
      const token = current.trim()
      if (token.length) out.push(token)
      current = ''
      continue
    }
    current += ch
  }

  const last = current.trim()
  if (last.length) out.push(last)
  return out
}

function isRegexAllowedForField(fieldKey: string): boolean {
  const category = (fieldToCategory as any)[fieldKey] as string | undefined
  return category === 'Fritekst' || category === 'Part'
}

function parseAdvancedFieldToken(
  token: string,
  defaultOperator: string,
  fieldKey: string,
): { operator: string; value: string } {
  const raw = token.trim()
  if (!raw.length) return { operator: defaultOperator, value: '' }

  const idx = raw.indexOf(':')
  if (idx > 0) {
    const prefix = raw.slice(0, idx).trim().toLowerCase()
    const rest = raw.slice(idx + 1).trim()

    if ((ruleConditionOperatorValues as readonly string[]).includes(prefix)) {
      if (!rest.length) {
        throw new Error(`Match-værdi mangler efter "${prefix}:"`)
      }

      if (prefix === 'regex') {
        if (!isRegexAllowedForField(fieldKey)) {
          throw new Error('Regex er kun understøttet for felter i Fritekst og Modpart')
        }
        try {
          // eslint-disable-next-line no-new
          new RegExp(rest)
        } catch {
          throw new Error(`Ugyldig regex-mønster: ${rest}`)
        }
      }

      return { operator: prefix, value: rest }
    }
  }

  return { operator: defaultOperator, value: raw }
}

function toOptionalString(value: unknown): string | undefined {
  if (value == null) return undefined
  const s = String(value).trim()
  return s.length ? s : undefined
}

function toOptionalEmailInput(value: unknown): string | undefined {
  if (value == null) return undefined
  const s = String(value).trim()
  return s.length ? s : undefined
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value == null) return undefined
  const s = String(value).trim()
  if (!s.length) return undefined
  const normalized = s.replace(/\s+/g, '').replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : undefined
}

function parseOptionalNumberCell(value: unknown): { value?: number; invalid: boolean } {
  const raw = value == null ? '' : String(value).trim()
  if (!raw.length) return { value: undefined, invalid: false }
  const parsed = toOptionalNumber(raw)
  return { value: parsed, invalid: parsed == null }
}

function parseDimensions(value: unknown): Array<{ key: string; value: string }> | undefined {
  const pairs = splitMultiValueCell(value)
  if (!pairs.length) return undefined

  const dimensions: Array<{ key: string; value: string }> = []
  for (const pair of pairs) {
    const idx = pair.indexOf('=')
    if (idx === -1) {
      throw new Error(`Ugyldigt dimension-par (forvent key=value): ${pair}`)
    }
    const key = pair.slice(0, idx).trim()
    const val = pair.slice(idx + 1).trim()
    if (!key || !val) {
      throw new Error(`Ugyldigt dimension-par (tom key/value): ${pair}`)
    }
    dimensions.push({ key, value: val })
  }
  return dimensions
}

function parseDimensionColumns(row: Record<string, unknown>): Array<{ key: string; value: string }> | undefined {
  const dims: Array<{ key: string; value: string }> = []

  for (const [key, value] of Object.entries(row)) {
    if (!key.startsWith('dim_')) continue
    const dimKey = key.slice('dim_'.length).trim()
    if (!dimKey.length) continue

    const dimValue = value == null ? '' : String(value).trim()
    if (!dimValue.length) continue

    dims.push({ key: dimKey, value: dimValue })
  }

  return dims.length ? dims : undefined
}

function mergeDimensions(
  a?: Array<{ key: string; value: string }>,
  b?: Array<{ key: string; value: string }>,
): Array<{ key: string; value: string }> | undefined {
  const combined = [...(a ?? []), ...(b ?? [])]
  if (!combined.length) return undefined

  const seen = new Set<string>()
  for (const d of combined) {
    if (seen.has(d.key)) {
      throw new Error(`Dubleret konteringsdimension: ${d.key}`)
    }
    seen.add(d.key)
  }
  return combined
}

function buildMatches(row: any, operator: string): MatchEntry[] | undefined {
  const references = splitMultiValueCell(row.matchReferences)
  const counterparties = splitMultiValueCell(row.matchCounterparties)
  const classification = splitMultiValueCell(row.matchClassification)

  const matches: MatchEntry[] = []
  for (const v of references) matches.push({ category: 'Fritekst', value: v, operator: operator as any, gate: 'ELLER' })
  for (const v of counterparties) matches.push({ category: 'Part', value: v, operator: operator as any, gate: 'ELLER' })
  for (const v of classification) matches.push({ category: 'Transaktionstype', value: v, operator: operator as any, gate: 'ELLER' })

  // Advanced template: allow pinning values to a specific transaction field.
  for (const fieldKey of ruleConditionFieldValues) {
    const columnName = `field_${fieldKey}`
    const values = splitMultiValueCell((row as any)[columnName])
    if (!values.length) continue

    const category = (fieldToCategory as any)[fieldKey] as MatchEntry['category'] | undefined
    if (!category) continue

    for (const v of values) {
      const parsed = parseAdvancedFieldToken(v, operator, String(fieldKey))
      if (!parsed.value.length) continue
      matches.push({
        category,
        value: parsed.value,
        fields: [fieldKey as any],
        operator: parsed.operator as any,
        gate: 'ELLER',
      })
    }
  }

  return matches.length ? matches : undefined
}

export default defineEventHandler(async (event) => {
  await requireRoles(event, ['write'])
  const log = logger.child({ scope: 'api.rules.import' })
  const query = getQuery(event)
  const queryDryRun = query.dryRun === '1' || query.dryRun === 'true'

  const body = await readBody<{ csv?: string; dryRun?: boolean }>(event)
  const dryRun = Boolean(body?.dryRun ?? queryDryRun)

  const csv = body?.csv
  if (!csv || typeof csv !== 'string' || csv.trim().length === 0) {
    return { success: false, totalRows: 0, errors: [{ row: 0, message: 'Mangler CSV-indhold (body.csv)' }] }
  }

  const parsed = Papa.parse<Record<string, unknown>>(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    delimiter: '',
    transformHeader: (h) => h.trim(),
  })

  const totalRows = Array.isArray(parsed.data) ? parsed.data.length : 0
  const errors: ImportError[] = []

  if (parsed.errors?.length) {
    for (const err of parsed.errors) {
      errors.push({
        row: (err.row ?? 0) + 1,
        message: err.message,
      })
    }
  }

  const drafts: Array<{ rowNumber: number; draft: RuleDraftSchema }> = []

  for (let i = 0; i < totalRows; i++) {
    const row = parsed.data[i] ?? {}
    const rowNumber = i + 2 // header is line 1

    try {
      const operatorCell = toOptionalString((row as any).matchOperator)
      const operator = operatorCell ?? 'eq'
      if (operatorCell && !ruleConditionOperatorValues.includes(operatorCell as any)) {
        errors.push({ row: rowNumber, field: 'matchOperator', message: `Ugyldig operator: ${operatorCell}` })
        continue
      }

      if (operatorCell === 'regex') {
        errors.push({
          row: rowNumber,
          field: 'matchOperator',
          message: 'Regex er kun tilladt i avanceret skabelon i field_* kolonner (brug "regex:<mønster>" i cellen)',
        })
        continue
      }

      const amountMin = parseOptionalNumberCell((row as any).matchAmountMin)
      if (amountMin.invalid) {
        errors.push({ row: rowNumber, field: 'matchAmountMin', message: 'Ugyldigt talformat' })
        continue
      }

      const amountMax = parseOptionalNumberCell((row as any).matchAmountMax)
      if (amountMax.invalid) {
        errors.push({ row: rowNumber, field: 'matchAmountMax', message: 'Ugyldigt talformat' })
        continue
      }

      const candidate = {
        type: toOptionalString((row as any).type),
        status: toOptionalString((row as any).status),
        relatedBankAccounts: splitMultiValueCell((row as any).relatedBankAccounts),
        ruleTags: splitMultiValueCell((row as any).ruleTags),
        matches: buildMatches(row, operator),
        matchAmountMin: amountMin.value,
        matchAmountMax: amountMax.value,
        accountingText: toOptionalString((row as any).accountingText),
        accountingCprType: (toOptionalString((row as any).accountingCprType) ?? 'ingen'),
        accountingCprNumber: toOptionalString((row as any).accountingCprNumber),
        accountingNotifyTo: toOptionalEmailInput((row as any).accountingNotifyTo) ?? '',
        accountingNote: toOptionalString((row as any).accountingNote),
        accountingDimensions: mergeDimensions(
          parseDimensions((row as any).accountingDimensions),
          parseDimensionColumns(row as Record<string, unknown>),
        ),
        accountingAttachmentName: undefined,
        accountingAttachmentFileExtension: undefined,
        accountingAttachmentData: undefined,
      }

      const parsedDraft = ruleDraftSchema.safeParse(candidate)
      if (!parsedDraft.success) {
        for (const issue of parsedDraft.error.issues) {
          errors.push({
            row: rowNumber,
            field: issue.path.join('.') || undefined,
            message: issue.message,
          })
        }
        continue
      }

      if (parsedDraft.data.accountingCprType === 'statisk' && !parsedDraft.data.accountingCprNumber) {
        errors.push({ row: rowNumber, field: 'accountingCprNumber', message: 'CPR skal angives når accountingCprType=statisk' })
        continue
      }

      drafts.push({ rowNumber, draft: parsedDraft.data })
    } catch (e: any) {
      errors.push({ row: rowNumber, message: e?.message ?? 'Uventet fejl ved parsing af række' })
    }
  }

  if (errors.length) {
    return { success: false, totalRows, errors }
  }

  // DB-backed validation
  const allAccountIds = Array.from(new Set(drafts.flatMap(d => d.draft.relatedBankAccounts)))
  const allTagIds = normalizeRuleTagIds(drafts.flatMap(d => d.draft.ruleTags ?? []))

  const activeSupplier = await getActiveErpSupplier()
  const dimensionDefinitions = await listAccountingDimensionDefinitions(activeSupplier)
  const dimensionConstraints = await listAccountingDimensionConstraints(activeSupplier)

  const existingAccounts = allAccountIds.length
    ? await db.select({ id: account.id }).from(account).where(inArray(account.id, allAccountIds))
    : []
  const existingAccountSet = new Set(existingAccounts.map(a => a.id))

  const existingTags = allTagIds.length
    ? await db
      .select({ id: ruleTag.id })
      .from(ruleTag)
      .where(
        sql`lower(${ruleTag.id}) IN (${sql.join(
          allTagIds.map((id) => sql`${id.toLocaleLowerCase('da-DK')}`),
          sql`, `,
        )})`,
      )
    : []
  const existingTagLowerSet = new Set(existingTags.map(t => String(t.id).toLocaleLowerCase('da-DK')))
  const existingTagLowerToId = new Map(existingTags.map(t => [String(t.id).toLocaleLowerCase('da-DK'), String(t.id)]))

  for (const entry of drafts) {
    const rowNumber = entry.rowNumber
    const draft = entry.draft

    for (const accId of draft.relatedBankAccounts) {
      if (!existingAccountSet.has(accId)) {
        errors.push({ row: rowNumber, field: 'relatedBankAccounts', message: `Ukendt bankkonto: ${accId}` })
      }
    }

    for (const tagId of normalizeRuleTagIds(draft.ruleTags ?? [])) {
      if (!existingTagLowerSet.has(tagId.toLocaleLowerCase('da-DK')))
        errors.push({ row: rowNumber, field: 'ruleTags', message: `Ukendt tag: ${tagId}` })
    }

    try {
      resolveDimensionValueRows({ ruleId: 0, dimensions: draft.accountingDimensions, definitions: dimensionDefinitions, constraints: dimensionConstraints })
    } catch (e: any) {
      errors.push({ row: rowNumber, field: 'accountingDimensions', message: e?.message ?? 'Ugyldige konteringsdimensioner' })
    }
  }

  if (errors.length) {
    return { success: false, totalRows, errors }
  }

  if (dryRun) {
    return { success: true, dryRun: true, totalRows }
  }

  log.info('Importing rules from CSV', { totalRows, supplier: activeSupplier })

  const insertedRuleIds: number[] = []

  await db.transaction(async (tx) => {
    for (const entry of drafts) {
      const draft = entry.draft
      const { ruleData, bankAccountIds, tagIds, conditionRows, accountingParameters, attachments, versionContent } = compileRuleDraftToDb(draft)

      const validatedRule = createInsertSchema(rule).parse({
        ...ruleData,
        erpSupplier: activeSupplier,
      })

      const insertedRule = await tx.insert(rule).values(validatedRule).returning()
      if (!insertedRule[0]) {
        throw new Error('Fejl ved oprettelse af regel')
      }

      const newRuleId = insertedRule[0].id
      insertedRuleIds.push(newRuleId)

      if (bankAccountIds.length) {
        await tx.insert(ruleBankAccount).values(
          bankAccountIds.map(bankAccountId => ({ ruleId: newRuleId, bankAccountId }))
        )
      }

      if (tagIds.length) {
        const resolvedTagIds = tagIds.map((id) => existingTagLowerToId.get(id.toLocaleLowerCase('da-DK')) ?? id)
        await tx.insert(ruleRuleTag).values(
          resolvedTagIds.map(ruleTagId => ({ ruleId: newRuleId, ruleTagId }))
        )
      }

      if (conditionRows.length) {
        await tx.insert(ruleBankingCondition).values(
          conditionRows.map(condition => ({
            ...condition,
            ruleId: newRuleId,
          }))
        )
      }

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
          ruleTags: tagIds.map((id) => existingTagLowerToId.get(id.toLocaleLowerCase('da-DK')) ?? id),
        },
      }

      await tx.insert(ruleVersion).values(versionPayload)
    }
  })

  const storage = useStorage('rules')
  await storage.removeItem('rule-list')

  return { success: true, dryRun: false, totalRows, importedCount: insertedRuleIds.length, ruleIds: insertedRuleIds }
})
