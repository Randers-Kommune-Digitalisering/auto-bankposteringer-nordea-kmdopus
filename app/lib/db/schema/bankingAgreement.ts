import { z } from 'zod'
import { pgTable, boolean, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'

import { bankProvider } from './account'

export const bankProviderValues = ['danskebank', 'nordea', 'bankconnect'] as const
export type BankProvider = (typeof bankProviderValues)[number]

/**
 * Provider-level banking agreement configuration.
 *
 * We assume exactly one agreement per provider (per installation/tenant).
 * Secrets are still sourced from env to keep the system stateless.
 */
export const bankingAgreement = pgTable('banking_agreement', {
  provider: bankProvider('provider').primaryKey(),
  enabled: boolean('enabled').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const bankingAgreementInsertSchema = createInsertSchema(bankingAgreement)
export const bankingAgreementUpdateSchema = createUpdateSchema(bankingAgreement)
export const bankingAgreementSelectSchema = createSelectSchema(bankingAgreement)

export type BankingAgreementInsertSchema = z.infer<typeof bankingAgreementInsertSchema>
export type BankingAgreementUpdateSchema = z.infer<typeof bankingAgreementUpdateSchema>
export type BankingAgreementSelectSchema = z.infer<typeof bankingAgreementSelectSchema>
