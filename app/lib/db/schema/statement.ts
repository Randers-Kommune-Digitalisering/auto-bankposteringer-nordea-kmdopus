import { z } from 'zod'
import {
  pgTable,
  uuid,
  text,
  date,
  integer,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { account } from './account'
import { bankingDocumentFormatEnum, creditDebitIndicatorEnum } from './enums'

/**
 * Vendor-neutral storage for bank statement source documents (e.g. CAMT.053 XML).
 *
 * Notes:
 * - A document may contain multiple statements.
 * - We store the raw content for auditability + reproducibility.
 */
export const bankingDocument = pgTable('banking_document', {
  id: uuid().defaultRandom().primaryKey(),
  accountId: text('account_id').references(() => account.id),
  format: bankingDocumentFormatEnum('format').notNull(),
  filename: text('filename'),
  content: text('content').notNull(),
  contentHash: text('content_hash').notNull().unique(),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),

  // Common CAMT group header fields (optional; filled by adapters when available)
  messageId: text('message_id'),
  createdAt: timestamp('created_at', { withTimezone: true }),
}, (t) => ({
  accountReceivedAtIdx: index('banking_document_account_received_at_idx').on(t.accountId, t.receivedAt),
}))

export const bankingStatement = pgTable('banking_statement', {
  id: uuid().defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull().references(() => bankingDocument.id),

  statementId: text('statement_id').notNull(),
  electronicSeqNo: integer('electronic_seq_no'),
  legalSeqNo: integer('legal_seq_no'),
  statementCreatedAt: timestamp('statement_created_at', { withTimezone: true }),

  iban: text('iban'),
  currency: text('currency'),
  ownerName: text('owner_name'),
  servicerBic: text('servicer_bic'),

  // Optional period (some CAMT variants provide From/To)
  fromDate: date('from_date', { mode: 'date' }),
  toDate: date('to_date', { mode: 'date' }),
}, (t) => ({
  documentIdIdx: index('banking_statement_document_id_idx').on(t.documentId),
  statementIdIdx: index('banking_statement_statement_id_idx').on(t.statementId),
}))

export const bankingStatementBalance = pgTable('banking_statement_balance', {
  id: uuid().defaultRandom().primaryKey(),
  statementId: uuid('statement_id').notNull().references(() => bankingStatement.id),

  typeCode: text('type_code').notNull(), // e.g. OPBD, CLBD, CLAV
  amount: numeric('amount').notNull(),
  currency: text('currency'),
  creditDebitIndicator: creditDebitIndicatorEnum('credit_debit_indicator'),
  balanceDate: date('balance_date', { mode: 'date' }),
}, (t) => ({
  statementTypeCodeIdx: index('banking_statement_balance_statement_type_code_idx').on(t.statementId, t.typeCode),
}))

export const bankingDocumentInsertSchema = createInsertSchema(bankingDocument)
export const bankingDocumentSelectSchema = createSelectSchema(bankingDocument)
export type BankingDocumentInsertSchema = z.infer<typeof bankingDocumentInsertSchema>
export type BankingDocumentSelectSchema = z.infer<typeof bankingDocumentSelectSchema>

export const bankingStatementInsertSchema = createInsertSchema(bankingStatement)
export const bankingStatementSelectSchema = createSelectSchema(bankingStatement)
export type BankingStatementInsertSchema = z.infer<typeof bankingStatementInsertSchema>
export type BankingStatementSelectSchema = z.infer<typeof bankingStatementSelectSchema>

export const bankingStatementBalanceInsertSchema = createInsertSchema(bankingStatementBalance)
export const bankingStatementBalanceSelectSchema = createSelectSchema(bankingStatementBalance)
export type BankingStatementBalanceInsertSchema = z.infer<typeof bankingStatementBalanceInsertSchema>
export type BankingStatementBalanceSelectSchema = z.infer<typeof bankingStatementBalanceSelectSchema>
