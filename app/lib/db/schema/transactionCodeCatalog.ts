import { z } from 'zod'
import { pgTable, uuid, text, boolean, timestamp, unique } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { bankProvider } from './account'

/**
 * Catalog of bank transaction codes (BkTxCd/proprietary) mapped to human-readable labels.
 *
 * This is provider-scoped so we can onboard multiple banks and keep naming deterministic.
 */
export const transactionCodeCatalog = pgTable('transaction_code_catalog', {
  id: uuid().defaultRandom().primaryKey(),
  provider: bankProvider('provider').notNull(),

  // Canonical lookup key, e.g. "PMNT/ICDT/VCOM" or "PRTRY:BGS"
  codeKey: text('code_key').notNull(),

  domain: text('domain'),
  family: text('family'),
  subFamily: text('sub_family'),
  proprietary: text('proprietary'),

  displayName: text('display_name').notNull(),
  description: text('description'),
  sourceDocument: text('source_document'),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  providerCodeKeyUnique: unique('transaction_code_catalog_provider_code_key_unique').on(
    t.provider,
    t.codeKey,
  ),
}))

export const transactionCodeCatalogInsertSchema = createInsertSchema(transactionCodeCatalog)
export const transactionCodeCatalogUpdateSchema = createUpdateSchema(transactionCodeCatalog)
export const transactionCodeCatalogSelectSchema = createSelectSchema(transactionCodeCatalog)

export type TransactionCodeCatalogInsertSchema = z.infer<typeof transactionCodeCatalogInsertSchema>
export type TransactionCodeCatalogUpdateSchema = z.infer<typeof transactionCodeCatalogUpdateSchema>
export type TransactionCodeCatalogSelectSchema = z.infer<typeof transactionCodeCatalogSelectSchema>
