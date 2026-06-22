import { z } from "zod"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { pgTable, uuid, integer, text, timestamp, index } from "drizzle-orm/pg-core"
import { run } from "./run"
import { runErrorSourceEnum } from "./enums"

export const errorLog = pgTable('error', {
  id: uuid().defaultRandom().primaryKey(),
  runId: uuid('run_id').references(() => run.id),
  source: runErrorSourceEnum('source'),
  errorCode: integer('error_code'),
  errorString: text('error_string'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (t) => ({
  runIdCreatedAtIdx: index('error_run_id_created_at_idx').on(t.runId, t.createdAt),
  createdAtIdx: index('error_created_at_idx').on(t.createdAt),
}))

export const errorInsertSchema = createInsertSchema(errorLog).omit({
  id: true,
  createdAt: true,
})
export const errorSelectSchema = createSelectSchema(errorLog)

export type ErrorInsertSchema = z.infer<typeof errorInsertSchema>
export type ErrorSelectSchema = z.infer<typeof errorSelectSchema>
