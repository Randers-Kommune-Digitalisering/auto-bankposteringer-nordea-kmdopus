import { z } from 'zod'
import { pgTable, uuid, text, integer, timestamp, unique, index } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { transaction } from './transaction'
import { transactionReferenceTypeEnum, transactionSourceScopeEnum } from './enums'

export const transactionReference = pgTable('transaction_reference', {
  id: uuid().defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id')
    .notNull()
    .references(() => transaction.id, { onDelete: 'cascade' }),
  xmlPath: text('xml_path').notNull(),
  sourceScope: transactionSourceScopeEnum('source_scope').notNull(),
  referenceType: transactionReferenceTypeEnum('reference_type').notNull(),
  sequenceNo: integer('sequence_no').notNull(),
  valueRaw: text('value_raw').notNull(),
  valueNormalized: text('value_normalized').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  sourceValueUnique: unique('transaction_reference_source_value_unique').on(
    t.transactionId,
    t.xmlPath,
    t.valueNormalized,
  ),
  transactionSequenceIdx: index('transaction_reference_transaction_sequence_idx').on(t.transactionId, t.sequenceNo),
}))

export const transactionReferenceInsertSchema = createInsertSchema(transactionReference)
export const transactionReferenceUpdateSchema = createUpdateSchema(transactionReference)
export const transactionReferenceSelectSchema = createSelectSchema(transactionReference)

export type TransactionReferenceInsertSchema = z.infer<typeof transactionReferenceInsertSchema>
export type TransactionReferenceUpdateSchema = z.infer<typeof transactionReferenceUpdateSchema>
export type TransactionReferenceSelectSchema = z.infer<typeof transactionReferenceSelectSchema>
