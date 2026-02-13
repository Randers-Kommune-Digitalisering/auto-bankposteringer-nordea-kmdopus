import { z } from "zod"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { pgTable, uuid, integer, text } from "drizzle-orm/pg-core"
import { run } from "./run"
import { runErrorSourceEnum } from "./enums"

export const errorLog = pgTable('error', {
  id: uuid().defaultRandom().primaryKey(),
  runId: uuid('run_id').references(() => run.id),
  source: runErrorSourceEnum('source'),
  errorCode: integer('error_code'),
  errorString: text('error_string'),
})

export const errorInsertSchema = createInsertSchema(errorLog)
export const errorSelectSchema = createSelectSchema(errorLog)

export type ErrorInsertSchema = z.infer<typeof errorInsertSchema>
export type ErrorSelectSchema = z.infer<typeof errorSelectSchema>
