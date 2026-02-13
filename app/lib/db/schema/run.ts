import { z } from "zod"
import { createInsertSchema, createUpdateSchema, createSelectSchema } from "drizzle-zod"
import { pgTable, date, uuid } from "drizzle-orm/pg-core"
import { runStatusEnum } from "./enums"

export const run = pgTable('run', {
  id: uuid().defaultRandom().primaryKey(),
  bookingDate: date('booking_date', { mode: "date" }).notNull(),
  status: runStatusEnum('status'),
})

export const runInsertSchema = createInsertSchema(run)
export const runUpdateSchema = createUpdateSchema(run)
export const runSelectSchema = createSelectSchema(run)

export type RunInsertSchema = z.infer<typeof runInsertSchema>
export type RunUpdateSchema = z.infer<typeof runUpdateSchema>
export type RunSelectSchema = z.infer<typeof runSelectSchema>