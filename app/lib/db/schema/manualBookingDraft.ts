import { z } from 'zod'
import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { transaction } from './transaction'
import { cprTypeEnum } from './enums'

export const manualBookingDraft = pgTable('manual_booking_draft', {
  transactionId: uuid('transaction_id').primaryKey().references(() => transaction.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

  text: text('text'),
  cprType: cprTypeEnum('cpr_type').notNull(),
  cprNumber: text('cpr_number'),
  notifyTo: text('notify_to'),
  note: text('note'),
})

export const manualBookingDraftLine = pgTable('manual_booking_draft_line', {
  id: uuid().defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id').notNull().references(() => manualBookingDraft.transactionId),
  sortOrder: integer('sort_order').notNull(),
  amount: numeric('amount').notNull(),
  text: text('text'),
})

export const manualBookingDraftLineDimension = pgTable(
  'manual_booking_draft_line_dimension',
  {
    lineId: uuid('line_id').notNull().references(() => manualBookingDraftLine.id),
    key: text('key').notNull(),
    value: text('value').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.lineId, t.key] }),
  }),
)

export const manualBookingDraftAttachment = pgTable('manual_booking_draft_attachment', {
  id: uuid().defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id').notNull().references(() => manualBookingDraft.transactionId),
  sortOrder: integer('sort_order').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  data: text('data').notNull(),
})

export const manualBookingDraftInsertSchema = createInsertSchema(manualBookingDraft)
export const manualBookingDraftUpdateSchema = createUpdateSchema(manualBookingDraft)
export const manualBookingDraftSelectSchema = createSelectSchema(manualBookingDraft)

export type ManualBookingDraftInsertSchema = z.infer<typeof manualBookingDraftInsertSchema>
export type ManualBookingDraftUpdateSchema = z.infer<typeof manualBookingDraftUpdateSchema>
export type ManualBookingDraftSelectSchema = z.infer<typeof manualBookingDraftSelectSchema>
