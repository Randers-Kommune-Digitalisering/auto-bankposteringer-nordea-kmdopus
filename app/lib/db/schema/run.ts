import { z } from "zod"
import { createUpdateSchema, createSelectSchema } from "drizzle-zod"
import { pgTable, date, uuid, unique, index } from "drizzle-orm/pg-core"
import { runStatusEnum } from "./enums"

export const run = pgTable('run', {
  id: uuid().defaultRandom().primaryKey(),
  bookingDate: date('booking_date', { mode: "date" }).notNull(),
  status: runStatusEnum('status'),
}, (t) => [
  unique('run_booking_date_unique').on(t.bookingDate),
  index('run_status_booking_date_idx').on(t.status, t.bookingDate),
])

export const runInsertSchema = z.object({
  bookingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('ISO date (YYYY-MM-DD)')
})

export const runUpdateSchema = createUpdateSchema(run)
export const runSelectSchema = createSelectSchema(run)

export type RunInsertSchema = z.infer<typeof runInsertSchema>
export type RunUpdateSchema = z.infer<typeof runUpdateSchema>
export type RunSelectSchema = z.infer<typeof runSelectSchema>