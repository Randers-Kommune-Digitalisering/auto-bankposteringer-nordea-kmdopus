import { z } from "zod"
import { pgTable, text, date, numeric, integer, uuid, primaryKey, bigint, boolean, unique, index } from "drizzle-orm/pg-core"
import { createUpdateSchema, createSelectSchema } from "drizzle-zod"
import type { RuleType, RuleStatus, RuleConditionOperator } from "./enums"
import {
  ruleTypeEnum,
  ruleStatusEnum,
  cprTypeEnum,
  erpSupplierEnum,
  ruleTypeValues,
  ruleStatusValues,
  cprTypeValues,
  ruleConditionFieldEnum,
  ruleConditionOperatorEnum,
  ruleConditionOperatorValues
} from "./enums"
import { account } from "./account"
import { ruleTag } from "./ruleTag"
import {
  fieldToCategory,
  matchCategoryColumns,
  matchCategoryEnumValues,
  matchFieldEnumValues,
} from "../../rules/match-config"
import type { MatchCategory, MatchField } from "../../rules/match-config"
import { isValidCprStrict } from "../../text/cpr"

export const rule = pgTable('rule', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  lastUsed: date('last_used', { mode: "date" }),
  createdAt: date('created_at', { mode: "date" }).defaultNow(),
  updatedAt: date('updated_at', { mode: "date" }).defaultNow().$onUpdate(() => new Date()),
  lockedAt: date('locked_at', { mode: "date" }),
  lockedBy: text('locked_by'),
  activeFrom: date('active_from', { mode: 'date' }),
  activeTo: date('active_to', { mode: 'date' }),
  currentVersionId: bigint('current_version_id', { mode: 'number' }).notNull(),
  erpSupplier: erpSupplierEnum('erp_supplier').notNull(),
  type: ruleTypeEnum('rule_type'),
  status: ruleStatusEnum('rule_status'),
  matchAmountMin: numeric('amount_min'),
  matchAmountMax: numeric('amount_max'),
}, (t) => ({
  statusUpdatedAtIdx: index('rule_status_updated_at_idx').on(t.status, t.updatedAt),
  statusLastUsedIdx: index('rule_status_last_used_idx').on(t.status, t.lastUsed),
}))

// Singleton configuration row for the tenant/deployment.
// Policy A: seeded once from env; mismatch should fail fast.
export const tenantConfiguration = pgTable('tenant_configuration', {
  id: integer('id').primaryKey(),
  activeErpSupplier: erpSupplierEnum('active_erp_supplier').notNull(),
  createdAt: date('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: date('updated_at', { mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
})

// Accounting dimensions are defined per ERP supplier and referenced by rules.
// Note: We intentionally store only domain keys (e.g. 'artskonto') and not human labels.
export const erpAccountingDimensionDefinition = pgTable('erp_accounting_dimension_definition', {
  id: uuid().defaultRandom().primaryKey(),
  erpSupplier: erpSupplierEnum('erp_supplier').notNull(),
  key: text('key').notNull(),
  valueRegex: text('value_regex'),
  valueRegexFlags: text('value_regex_flags'),
  // Optional mapping to an ERP-specific target field (adapter-driven).
  // Example (KMD): glAccount, costCenter, wbsElement.
  erpTarget: text('erp_target'),
  sortOrder: integer('sort_order').notNull().default(0),
  required: boolean('required').notNull().default(false),
  createdAt: date('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: date('updated_at', { mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  supplierKeyUnique: unique('erp_accounting_dimension_definition_supplier_key_unique').on(t.erpSupplier, t.key),
  supplierSortOrderIdx: index('erp_accounting_dimension_definition_supplier_sort_order_idx').on(t.erpSupplier, t.sortOrder),
}))

export const ruleAccountingDimensionValue = pgTable('rule_accounting_dimension_value', {
  ruleId: integer('rule_id').notNull().references(() => rule.id, { onDelete: 'cascade' }),
  definitionId: uuid('definition_id').notNull().references(() => erpAccountingDimensionDefinition.id, { onDelete: 'cascade' }),
  value: text('value').notNull(),
}, (table) => ([
  primaryKey({ columns: [table.ruleId, table.definitionId] })
]))

export const ruleBankAccount = pgTable('rule_bank_account', {
  ruleId: integer('rule_id').notNull().references(() => rule.id, { onDelete: 'cascade' }),
  bankAccountId: text('bank_account_id').notNull().references(() => account.id, { onDelete: 'cascade' })
}, (table) => ([
  primaryKey({ columns: [table.ruleId, table.bankAccountId] })
]))

export const ruleRuleTag = pgTable('rule_rule_tag', {
  ruleId: integer('rule_id').notNull().references(() => rule.id, { onDelete: 'cascade' }),
  ruleTagId: text('rule_tag_id').notNull().references(() => ruleTag.id, { onDelete: 'cascade' }),
}, (table) => ([
  primaryKey({ columns: [table.ruleId, table.ruleTagId] })
]))

export const ruleBankingCondition = pgTable('rule_banking_condition', {
  id: uuid().defaultRandom().primaryKey(),
  ruleId: integer('rule_id').notNull().references(() => rule.id, { onDelete: 'cascade' }),
  field: ruleConditionFieldEnum('field').notNull(),
  operator: ruleConditionOperatorEnum('operator').notNull().default('eq'),
  value: text('value').notNull(),
}, (t) => ({
  ruleIdIdx: index('rule_banking_condition_rule_id_idx').on(t.ruleId),
}))

export const ruleAccountingParameters = pgTable('kmd_accounting_parameters', {
  id: uuid().defaultRandom().primaryKey(),
  ruleId: integer('rule_id').references(() => rule.id, { onDelete: 'cascade' }),
  bookingText: text('booking_text'),
  cprType: cprTypeEnum('cpr_type'),
  cprNumber: text('cpr_number'),
  notifyTo: text('notify_to'),
  note: text('note'),
}, (t) => ({
  ruleIdIdx: index('kmd_accounting_parameters_rule_id_idx').on(t.ruleId),
}))

export const ruleAccountingAttachment = pgTable('kmd_attachment', {
  id: uuid().defaultRandom().primaryKey(),
  parameterId: uuid('parameter_id').notNull().references(() => ruleAccountingParameters.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  fileExtension: text('file_extension').notNull(),
  data: text('data').notNull(),
})

export const matchEntrySchema = z.object({
  category: z.enum(matchCategoryEnumValues),
  value: z.string().min(1, "Value kan ikke være tom"),
  fields: z.array(z.enum(matchFieldEnumValues)).optional(),
  operator: z.enum(ruleConditionOperatorValues).default('eq').optional(),
  gate: z.enum(['OG', 'ELLER']).default('ELLER')
}).superRefine((data, ctx) => {
  const operator = data.operator ?? 'eq'
  if (operator !== 'regex') return

  const allowedCategories = ['Fritekst', 'Part'] as const
  if (!allowedCategories.includes(data.category as (typeof allowedCategories)[number])) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['operator'],
      message: 'Regex-match er kun understøttet for Fritekst og Modpart',
    })
    return
  }

  const pattern = String(data.value ?? '')
  if (pattern.length > 512) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: 'Regex-mønstret er for langt (maks 512 tegn)',
    })
    return
  }

  try {
    // Note: patterns are stored as-is; matching uses normalized transaction values.
    // We validate here to ensure rules can be saved/imported safely.
    // eslint-disable-next-line no-new
    new RegExp(pattern)
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: 'Ugyldig regex-mønster',
    })
  }
})

export type MatchGate = 'OG' | 'ELLER'
export type MatchEntry = z.infer<typeof matchEntrySchema>
export type RuleConditionRow = typeof ruleBankingCondition.$inferSelect
export type RuleConditionInsert = Omit<typeof ruleBankingCondition.$inferInsert, 'id' | 'ruleId'>
export type RuleAccountingParametersRow = typeof ruleAccountingParameters.$inferSelect
export type RuleAccountingAttachmentRow = typeof ruleAccountingAttachment.$inferSelect
export type TenantConfigurationRow = typeof tenantConfiguration.$inferSelect
export type ErpAccountingDimensionDefinitionRow = typeof erpAccountingDimensionDefinition.$inferSelect
export type RuleAccountingDimensionValueRow = typeof ruleAccountingDimensionValue.$inferSelect

export function mapMatchesToConditionRows(matches: MatchEntry[]): RuleConditionInsert[] {
  return matches.flatMap((entry) => {
    const operator: RuleConditionOperator = entry.operator ?? 'eq'
    const fields = entry.fields?.length ? entry.fields : matchCategoryColumns[entry.category]

    return fields.map((field) => ({
      field,
      operator,
      value: entry.value
    }))
  })
}

export function mapConditionsToMatches(conditions: RuleConditionRow[]): MatchEntry[] {
  const byCategory = new Map<MatchCategory, Map<string, { fields: Set<MatchField>; operator: RuleConditionOperator; value: string }>>()

  for (const condition of conditions) {
    const category = fieldToCategory[condition.field]
    if (!category) continue

    const key = `${condition.operator}:${condition.value}`
    if (!byCategory.has(category)) {
      byCategory.set(category, new Map())
    }

    const categoryMap = byCategory.get(category)!
    if (!categoryMap.has(key)) {
      categoryMap.set(key, { fields: new Set(), operator: condition.operator, value: condition.value })
    }

    categoryMap.get(key)!.fields.add(condition.field)
  }

  const result: MatchEntry[] = []
  for (const [category, grouped] of byCategory.entries()) {
    for (const meta of grouped.values()) {
      const fields = Array.from(meta.fields)
      result.push({
        category,
        value: meta.value,
        fields: fields.length === matchCategoryColumns[category].length ? undefined : (fields as MatchField[]),
        operator: meta.operator,
        gate: 'ELLER'
      })
    }
  }

  return result
}

export const ruleDraftSchema = z.object({
  type: z.enum(ruleTypeValues),
  status: z.enum(ruleStatusValues),
  lockedAt: z.date().optional(),
  activeFrom: z.coerce.date().optional(),
  activeTo: z.coerce.date().optional(),
  relatedBankAccounts: z.array(z.string()).min(1, "Vælg mindst én bankkonto"),
  matches: z.array(matchEntrySchema).optional(),
  matchAmountMin: z.number().optional(),
  matchAmountMax: z.number().optional(),
  accountingDimensions: z.array(z.object({
    key: z.string().min(1),
    value: z.string().min(1),
  })).optional(),
  accountingText: z.string().optional(),
  accountingCprType: z.enum(cprTypeValues),
  accountingCprNumber: z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().optional(),
  ),
  accountingNotifyTo: z.string().email("Ugyldig email").optional().or(z.literal("")),
  accountingNote: z.string().optional(),
  accountingAttachmentName: z.array(z.string()).optional(),
  accountingAttachmentFileExtension: z.array(z.string()).optional(),
  accountingAttachmentData: z.array(z.string()).optional(),
  ruleTags: z.array(z.string()).optional(),
}).refine(
  (data) => {
    // Either both are set, or neither.
    if ((data.activeFrom && !data.activeTo) || (!data.activeFrom && data.activeTo)) {
      return false
    }
    if (data.activeFrom && data.activeTo) {
      return data.activeFrom <= data.activeTo
    }
    return true
  },
  {
    message: 'Ugyldig aktiv-periode (angiv både start og slut, og slutdato må ikke være før startdato)',
    path: ['activeTo'],
  },
)

  .superRefine((data, ctx) => {
    if (data.accountingCprNumber && !isValidCprStrict(String(data.accountingCprNumber))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['accountingCprNumber'],
        message: 'CPR skal matche formatet DDMMÅÅXXXX',
      })
    }

    const raw = (data.accountingNotifyTo ?? '').trim()
    if (!raw) return

    const domain = (process.env.SMTP_ALLOWED_RECIPIENT_DOMAIN ?? process.env.SMTP_DOMAIN ?? '')
      .trim()
      .toLowerCase()
    if (!domain) return

    const at = raw.lastIndexOf('@')
    const recipientDomain = at >= 0 ? raw.slice(at + 1).toLowerCase() : ''
    if (recipientDomain !== domain) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['accountingNotifyTo'],
        message: `Email skal være inden for domænet ${domain}`,
      })
    }
  })

export const ruleBasicSchema = z.object({
  type: z.enum(ruleTypeValues),
  status: z.enum(ruleStatusValues),
  activeFrom: z.coerce.date().optional(),
  activeTo: z.coerce.date().optional(),
  relatedBankAccounts: z.array(z.string()).min(1, "Vælg mindst én bankkonto"),
  ruleTags: z.array(z.string()).optional(),
}).refine(
  (data) => {
    if ((data.activeFrom && !data.activeTo) || (!data.activeFrom && data.activeTo)) {
      return false
    }
    if (data.activeFrom && data.activeTo) {
      return data.activeFrom <= data.activeTo
    }
    return true
  },
  {
    message: 'Ugyldig aktiv-periode (angiv både start og slut, og slutdato må ikke være før startdato)',
    path: ['activeTo'],
  },
)

export const ruleMatchingSchema = z.object({
  matches: z.array(matchEntrySchema).optional(),
  matchAmountMin: z.number().optional(),
  matchAmountMax: z.number().optional(),
}).refine(
  data =>
    data.matchAmountMin == null ||
    data.matchAmountMax == null ||
    data.matchAmountMin <= data.matchAmountMax,
  {
    message: 'Minimumsbeløb må ikke være større end maksimumsbeløb',
    path: ['matchAmountMax']
  }
)

export const ruleAccountingSchema = z.object({
  accountingDimensions: z.array(z.object({
    key: z.string().min(1),
    value: z.string().min(1),
  })).optional(),
  accountingText: z.string().optional(),
  accountingCprType: z.enum(cprTypeValues),
  accountingCprNumber: z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().optional(),
  ),
  accountingNotifyTo: z.string().email("Ugyldig email").optional().or(z.literal("")),
  accountingNote: z.string().optional(),
  accountingAttachmentName: z.array(z.string()).optional(),
  accountingAttachmentFileExtension: z.array(z.string()).optional(),
  accountingAttachmentData: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (data.accountingCprNumber && !isValidCprStrict(String(data.accountingCprNumber))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['accountingCprNumber'],
      message: 'CPR skal matche formatet DDMMÅÅXXXX',
    })
  }

  const raw = (data.accountingNotifyTo ?? '').trim()
  if (!raw) return

  const domain = (process.env.SMTP_ALLOWED_RECIPIENT_DOMAIN ?? process.env.SMTP_DOMAIN ?? '')
    .trim()
    .toLowerCase()
  if (!domain) return

  const at = raw.lastIndexOf('@')
  const recipientDomain = at >= 0 ? raw.slice(at + 1).toLowerCase() : ''
  if (recipientDomain !== domain) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['accountingNotifyTo'],
      message: `Email skal være inden for domænet ${domain}`,
    })
  }
})

export const ruleSelectSchema = createSelectSchema(rule)

export const ruleUpdateSchema = createUpdateSchema(rule).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const ruleMatchingSelectSchema = createSelectSchema(rule).pick({
  matchAmountMin: true,
  matchAmountMax: true,
})

export type RuleDraftSchema = z.infer<typeof ruleDraftSchema>
export type RuleUpdateSchema = z.infer<typeof ruleUpdateSchema>
export type RuleSelectSchema = z.infer<typeof ruleSelectSchema>
export type RuleMatchingSelectSchema = z.infer<typeof ruleMatchingSelectSchema>

export type Rule = {
  id: number
  type: RuleType
  status: RuleStatus
  relatedBankAccounts: string[]
  ruleTags?: string[]
  matchAmountMin?: number
  matchAmountMax?: number
  lockedAt?: Date
  lockedBy?: string
  activeFrom?: Date
  activeTo?: Date
  currentVersionId: number
  lastUsed?: Date
  createdAt: Date
  updatedAt: Date
}

export const ruleListDto = z.object({
  id: z.number(),
  type: z.enum(ruleTypeValues),
  status: z.enum(ruleStatusValues),
  relatedBankAccounts: z.array(z.string()),
  lastUsed: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  matching: z.object({
    references: z.array(z.string()),
    counterparties: z.array(z.string()),
    classification: z.array(z.string())
  }),
  ruleTags: z.array(z.string()).optional()
})

export const ruleListDtoArray = z.array(ruleListDto)
export type RuleListDto = z.infer<typeof ruleListDto>

function extractRelatedBankAccountIds(row: any): string[] {
  if (Array.isArray(row.relatedBankAccounts)) {
    return row.relatedBankAccounts.filter((id: any): id is string => typeof id === 'string' && id.length > 0)
  }

  if (Array.isArray(row.bankAccounts)) {
    return row.bankAccounts
      .map((entry: any) => entry?.bankAccountId)
      .filter((id: any): id is string => typeof id === 'string' && id.length > 0)
  }

  return []
}

function extractRuleTagIds(row: any): string[] {
  if (Array.isArray(row.ruleTags)) {
    return row.ruleTags
      .map((tag: any) => {
        if (typeof tag === 'string') return tag
        if (tag?.id) return tag.id
        if (tag?.ruleTagId) return tag.ruleTagId
        return undefined
      })
      .filter((id: any): id is string => typeof id === 'string' && id.length > 0)
  }

  if (Array.isArray(row.tags)) {
    return row.tags
      .map((entry: any) => entry?.tag?.id ?? entry?.ruleTagId)
      .filter((id: any): id is string => typeof id === 'string' && id.length > 0)
  }

  return []
}

function summarizeConditions(conditions: RuleConditionRow[]): RuleListDto['matching'] {
  const summary = {
    references: new Set<string>(),
    counterparties: new Set<string>(),
    classification: new Set<string>(),
  }

  for (const condition of conditions) {
    const category = fieldToCategory[condition.field]
    if (!category) continue

    if (category === 'Fritekst') summary.references.add(condition.value)
    else if (category === 'Part') summary.counterparties.add(condition.value)
    else summary.classification.add(condition.value)
  }

  return {
    references: Array.from(summary.references),
    counterparties: Array.from(summary.counterparties),
    classification: Array.from(summary.classification),
  }
}

export function mapRuleToListDto(r: any): RuleListDto {
  const relatedBankAccounts = extractRelatedBankAccountIds(r)
  const ruleTags = extractRuleTagIds(r)
  const conditions: RuleConditionRow[] = Array.isArray(r.conditions) ? r.conditions : []

  return {
    id: r.id,
    type: r.type,
    status: r.status,
    relatedBankAccounts,
    lastUsed: r.lastUsed,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    matching: summarizeConditions(conditions),
    ruleTags: ruleTags.length ? ruleTags : undefined
  }
}