import type { z } from 'zod'
import { pgTable, uuid, text, integer, timestamp, unique, index } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { transaction } from './transaction'
import { transactionPartyRoleEnum } from './enums'

export const transactionParty = pgTable('transaction_party', {
  id: uuid().defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id')
    .notNull()
    .references(() => transaction.id, { onDelete: 'cascade' }),
  role: transactionPartyRoleEnum('role').notNull(),
  sequenceNo: integer('sequence_no').notNull(),
  displayName: text('display_name'),
  identifier: text('identifier'),
  accountIban: text('account_iban'),
  xmlPathName: text('xml_path_name'),
  xmlPathId: text('xml_path_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  transactionRoleSequenceUnique: unique('transaction_party_transaction_role_sequence_unique').on(
    t.transactionId,
    t.role,
    t.sequenceNo,
  ),
  transactionSequenceIdx: index('transaction_party_transaction_sequence_idx').on(t.transactionId, t.sequenceNo),
}))

export const transactionPartyInsertSchema = createInsertSchema(transactionParty)
export const transactionPartyUpdateSchema = createUpdateSchema(transactionParty)
export const transactionPartySelectSchema = createSelectSchema(transactionParty)

export type TransactionPartyInsertSchema = z.infer<typeof transactionPartyInsertSchema>
export type TransactionPartyUpdateSchema = z.infer<typeof transactionPartyUpdateSchema>
export type TransactionPartySelectSchema = z.infer<typeof transactionPartySelectSchema>
