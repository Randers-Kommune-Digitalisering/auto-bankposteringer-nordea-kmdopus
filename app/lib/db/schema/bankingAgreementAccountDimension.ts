import { z } from 'zod'
import { pgTable, text, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

import { bankProvider } from './account'
import { bankingAgreement } from './bankingAgreement'

/**
 * Deterministic, auditable mapping from (provider, IBAN) to canonical accounting dimensions.
 *
 * This keeps the banking domain ERP-agnostic: keys are canonical dimension keys (e.g. 'artskonto'),
 * and ERP adapters map keys to vendor-specific targets.
 */
export const bankingAgreementAccountDimension = pgTable(
  'banking_agreement_account_dimension',
  {
    provider: bankProvider('provider')
      .notNull()
      .references(() => bankingAgreement.provider, { onDelete: 'cascade' }),
    iban: text('iban').notNull(),
    dimensionKey: text('dimension_key').notNull(),
    dimensionValue: text('dimension_value').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.provider, table.iban, table.dimensionKey] })],
)

export const bankingAgreementAccountDimensionInsertSchema = createInsertSchema(bankingAgreementAccountDimension)
export const bankingAgreementAccountDimensionSelectSchema = createSelectSchema(bankingAgreementAccountDimension)

export type BankingAgreementAccountDimensionInsertSchema = z.infer<
  typeof bankingAgreementAccountDimensionInsertSchema
>
export type BankingAgreementAccountDimensionSelectSchema = z.infer<
  typeof bankingAgreementAccountDimensionSelectSchema
>
