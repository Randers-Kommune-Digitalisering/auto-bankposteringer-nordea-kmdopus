import { z } from 'zod'
import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

import { bankProvider } from './account'
import { bankingAgreement } from './bankingAgreement'

/**
 * Persisted cursor/state for provider-level fetching (agreement-scoped).
 */

export const bankingAgreementCursor = pgTable(
  'banking_agreement_cursor',
  {
    id: uuid().defaultRandom().primaryKey(),
    provider: bankProvider('provider')
      .notNull()
      .references(() => bankingAgreement.provider, { onDelete: 'cascade' }),
    adapterKey: text('adapter_key').notNull(),
    cursor: text('cursor').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerAdapterUnique: unique('banking_agreement_cursor_provider_adapter_unique').on(
      t.provider,
      t.adapterKey,
    ),
  }),
)

export const bankingAgreementCursorInsertSchema = createInsertSchema(bankingAgreementCursor)
export const bankingAgreementCursorUpdateSchema = createUpdateSchema(bankingAgreementCursor)
export const bankingAgreementCursorSelectSchema = createSelectSchema(bankingAgreementCursor)

export type BankingAgreementCursorInsertSchema = z.infer<typeof bankingAgreementCursorInsertSchema>
export type BankingAgreementCursorUpdateSchema = z.infer<typeof bankingAgreementCursorUpdateSchema>
export type BankingAgreementCursorSelectSchema = z.infer<typeof bankingAgreementCursorSelectSchema>
