import { pgEnum, pgTable, text, uuid, primaryKey, unique, date, index } from 'drizzle-orm/pg-core'
import { erpSupplierEnum } from './enums'

export const accountingDimensionConstraintKindValues = [
  'requires_any_of',
  'requires_all_of',
  'requires_exactly_one_of',
  'forbids_any_of',
] as const

export const accountingDimensionConstraintKindEnum = pgEnum(
  'accounting_dimension_constraint_kind',
  accountingDimensionConstraintKindValues,
)

export type AccountingDimensionConstraintKind = typeof accountingDimensionConstraintKindValues[number]

export const erpAccountingDimensionConstraint = pgTable('erp_accounting_dimension_constraint', {
  id: uuid('id').defaultRandom().primaryKey(),
  erpSupplier: erpSupplierEnum('erp_supplier').notNull(),
  ifKey: text('if_key').notNull(),
  kind: accountingDimensionConstraintKindEnum('kind').notNull(),
  ifValueRegex: text('if_value_regex'),
  createdAt: date('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: date('updated_at', { mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  supplierIfKindUnique: unique('erp_accounting_dimension_constraint_supplier_if_kind_unique').on(
    t.erpSupplier,
    t.ifKey,
    t.kind,
    t.ifValueRegex,
  ),
  supplierIdx: index('erp_accounting_dimension_constraint_supplier_idx').on(t.erpSupplier),
}))

export const erpAccountingDimensionConstraintMember = pgTable('erp_accounting_dimension_constraint_member', {
  constraintId: uuid('constraint_id').notNull().references(() => erpAccountingDimensionConstraint.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
}, (t) => ([
  primaryKey({ columns: [t.constraintId, t.key] }),
]))

export type ErpAccountingDimensionConstraintRow = typeof erpAccountingDimensionConstraint.$inferSelect
export type ErpAccountingDimensionConstraintMemberRow = typeof erpAccountingDimensionConstraintMember.$inferSelect
