import { z } from "zod"
import { pgTable, uuid, text, numeric, date, integer } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { account } from "./account"
import { run } from "./run"
import { bankingPayload } from "./banking"
import { bookingStatusEnum } from "./enums"
import { rule } from "./rule"

export const transaction = pgTable('transaction', {
  id: uuid().defaultRandom().primaryKey(),
  runId: uuid('run_id').notNull().references(() => run.id),
  payloadId: uuid('payload_id').references(() => bankingPayload.id),
  accountId: text('account').references(() => account.id),
  amount: numeric('amount').notNull(),
  bookingDate: date('booking_date', { mode: "date" }).notNull(),
})

export const transactionSelectSchema = createSelectSchema(transaction)
export const transactionInsertSchema = createInsertSchema(transaction)

export type TransactionSelectSchema = z.infer<typeof transactionSelectSchema>
export type TransactionInsertSchema = z.infer<typeof transactionInsertSchema>

export const transactionProcessing = pgTable('transaction_processing', {
  transactionId: uuid('transaction_id').primaryKey().references(() => transaction.id),
  status: bookingStatusEnum('status'),
  ruleApplied: integer('rule_applied').references(() => rule.id),
  lockedAt: date('locked_at', { mode: "date" }),
  lockedBy: text('locked_by'),
})

export const transactionProcessingInsertSchema = createInsertSchema(transactionProcessing)
export const transactionProcessingUpdateSchema = createUpdateSchema(transactionProcessing)
export const transactionProcessingSelectSchema = createSelectSchema(transactionProcessing)

export type TransactionProcessingInsertSchema = z.infer<typeof transactionProcessingInsertSchema>
export type TransactionProcessingUpdateSchema = z.infer<typeof transactionProcessingUpdateSchema>
export type TransactionProcessingSelectSchema = z.infer<typeof transactionProcessingSelectSchema>
