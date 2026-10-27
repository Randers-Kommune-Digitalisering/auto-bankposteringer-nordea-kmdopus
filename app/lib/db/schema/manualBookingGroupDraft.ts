import { z } from 'zod/v4'
import {
  pgTable,
  text,
  integer,
  numeric,
  timestamp,
  uuid,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { cprTypeEnum } from './enums'

export const manualBookingGroupDraft = pgTable('manual_booking_group_draft', {
  groupKey: text('group_key').primaryKey(),
  memberSignature: text('member_signature').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

  text: text('text'),
  cprType: cprTypeEnum('cpr_type').notNull(),
  cprNumber: text('cpr_number'),
  note: text('note'),
})

export const manualBookingGroupDraftLine = pgTable('manual_booking_group_draft_line', {
  id: uuid().defaultRandom().primaryKey(),
  groupKey: text('group_key').notNull().references(() => manualBookingGroupDraft.groupKey, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull(),
  amount: numeric('amount').notNull(),
  text: text('text'),
}, (t) => ({
  groupSortOrderIdx: index('manual_booking_group_draft_line_group_sort_order_idx').on(t.groupKey, t.sortOrder),
}))

export const manualBookingGroupDraftLineDimension = pgTable(
  'manual_booking_group_draft_line_dimension',
  {
    lineId: uuid('line_id').notNull().references(() => manualBookingGroupDraftLine.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    value: text('value').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.lineId, t.key] }),
  }),
)

export const manualBookingGroupDraftAttachment = pgTable('manual_booking_group_draft_attachment', {
  id: uuid().defaultRandom().primaryKey(),
  groupKey: text('group_key').notNull().references(() => manualBookingGroupDraft.groupKey, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  data: text('data').notNull(),
}, (t) => ({
  groupSortOrderIdx: index('manual_booking_group_draft_attachment_group_sort_order_idx').on(t.groupKey, t.sortOrder),
}))

export const manualBookingGroupDraftInsertSchema = createInsertSchema(manualBookingGroupDraft)
export const manualBookingGroupDraftUpdateSchema = createUpdateSchema(manualBookingGroupDraft)
export const manualBookingGroupDraftSelectSchema = createSelectSchema(manualBookingGroupDraft)

export type ManualBookingGroupDraftInsertSchema = z.infer<typeof manualBookingGroupDraftInsertSchema>
export type ManualBookingGroupDraftUpdateSchema = z.infer<typeof manualBookingGroupDraftUpdateSchema>
export type ManualBookingGroupDraftSelectSchema = z.infer<typeof manualBookingGroupDraftSelectSchema>
