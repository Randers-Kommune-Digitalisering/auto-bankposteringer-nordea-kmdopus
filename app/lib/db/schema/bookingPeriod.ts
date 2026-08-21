import { z } from 'zod'
import { pgTable, timestamp, uuid, date, index } from 'drizzle-orm/pg-core'
import { transaction } from './transaction'

export const bookingPeriodRebookingAudit = pgTable('booking_period_rebooking_audit', {
  id: uuid().defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id').notNull().references(() => transaction.id),
  originalBookingDate: date('original_booking_date', { mode: 'string' }).notNull(),
  effectiveBookingDate: date('effective_booking_date', { mode: 'string' }).notNull(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('booking_period_rebooking_audit_transaction_id_idx').on(table.transactionId),
])

export const bookingPeriodRebookingAuditInsertSchema = z.object({
  transactionId: z.string().uuid(),
  originalBookingDate: z.string(),
  effectiveBookingDate: z.string(),
})