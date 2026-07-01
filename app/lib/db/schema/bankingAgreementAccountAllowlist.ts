import { z } from 'zod'
import { pgTable, text, timestamp, primaryKey, index } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

import { bankProvider } from './account'
import { bankingAgreement } from './bankingAgreement'

/**
 * Provider-level allowlist for which bank accounts may be fetched via API-based channels.
 *
 * Stored as a deterministic, auditable configuration in DB.
 */

export const bankingAgreementAccountAllowlist = pgTable(
  'banking_agreement_account_allowlist',
  {
    provider: bankProvider('provider')
      .notNull()
      .references(() => bankingAgreement.provider, { onDelete: 'cascade' }),
    iban: text('iban').notNull(),
    name: text('name'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.iban] }),
    index('banking_agreement_account_allowlist_iban_provider_idx').on(table.iban, table.provider),
  ],
)

export const bankingAgreementAccountAllowlistInsertSchema = createInsertSchema(bankingAgreementAccountAllowlist)
export const bankingAgreementAccountAllowlistSelectSchema = createSelectSchema(bankingAgreementAccountAllowlist)

export type BankingAgreementAccountAllowlistInsertSchema = z.infer<
  typeof bankingAgreementAccountAllowlistInsertSchema
>
export type BankingAgreementAccountAllowlistSelectSchema = z.infer<
  typeof bankingAgreementAccountAllowlistSelectSchema
>
