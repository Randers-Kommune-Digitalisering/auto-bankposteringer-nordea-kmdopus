import { z } from "zod/v4"
import { pgTable, uuid, text, numeric, date, timestamp, integer, unique, index } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { account } from "./account"
import { run } from "./run"
import { bookingStatusEnum, creditDebitIndicatorEnum, transactionProcessingSourceEnum } from "./enums"
import { rule } from "./rule"
import { bankingStatement } from "./statement"

export const transaction = pgTable('transaction', {
  id: uuid().defaultRandom().primaryKey(),
  runId: uuid('run_id').notNull().references(() => run.id),
  accountId: text('account').references(() => account.id).notNull(),

  // Source linkage (CAMT.053: Document -> Statement -> Entry)
  statementId: uuid('statement_id').references(() => bankingStatement.id),
  entryIndex: integer('entry_index'),
  underlyingTransactionCount: integer('underlying_transaction_count').notNull().default(0),

  // Entry core
  amount: numeric('amount').notNull(),
  currency: text('currency'),
  creditDebitIndicator: creditDebitIndicatorEnum('credit_debit_indicator'), // CAMT: CdtDbtInd
  status: text('status'), // CAMT: Sts (e.g. BOOK)
  bookingDate: date('booking_date', { mode: "date" }).notNull(),
  valueDate: date('value_date', { mode: "date" }),

  // Entry references
  ntryRef: text('ntry_ref'),
  ntryAcctSvcrRef: text('ntry_acct_svcr_ref'),
  entryAdditionalInfo: text('entry_additional_info'), // CAMT: AddtlNtryInf

  // Bank transaction code (BkTxCd)
  bkTxCdDomain: text('bk_tx_cd_domain'),
  bkTxCdFamily: text('bk_tx_cd_family'),
  bkTxCdSubFamily: text('bk_tx_cd_sub_family'),
  bkTxCdProprietary: text('bk_tx_cd_proprietary'),
}, (t) => [
  unique('transaction_statement_entry_unique').on(t.statementId, t.entryIndex),
  index('transaction_run_id_idx').on(t.runId),
  index('transaction_run_id_account_id_idx').on(t.runId, t.accountId),
  index('transaction_booking_date_id_idx').on(t.bookingDate, t.id),
  index('transaction_account_booking_date_id_idx').on(t.accountId, t.bookingDate, t.id),
  index('transaction_statement_order_idx').on(t.statementId, t.entryIndex),
])

export const transactionSelectSchema = createSelectSchema(transaction)
export const transactionInsertSchema = createInsertSchema(transaction)

export type TransactionSelectSchema = z.infer<typeof transactionSelectSchema>
export type TransactionInsertSchema = z.infer<typeof transactionInsertSchema>

// Tracks transaction state
export const transactionProcessing = pgTable('transaction_processing', {
  transactionId: uuid('transaction_id').primaryKey().references(() => transaction.id),
  status: bookingStatusEnum('status'),
  ruleApplied: integer('rule_applied').references(() => rule.id),
  source: transactionProcessingSourceEnum('source'),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  lockedBy: text('locked_by'),
  lockedByName: text('locked_by_name'),
}, (t) => [
  index('transaction_processing_status_transaction_id_idx').on(t.status, t.transactionId),
  index('transaction_processing_rule_applied_idx').on(t.ruleApplied),
])

export const transactionProcessingInsertSchema = createInsertSchema(transactionProcessing)
export const transactionProcessingUpdateSchema = createUpdateSchema(transactionProcessing)
export const transactionProcessingSelectSchema = createSelectSchema(transactionProcessing)

export type TransactionProcessingInsertSchema = z.infer<typeof transactionProcessingInsertSchema>
export type TransactionProcessingUpdateSchema = z.infer<typeof transactionProcessingUpdateSchema>
export type TransactionProcessingSelectSchema = z.infer<typeof transactionProcessingSelectSchema>
