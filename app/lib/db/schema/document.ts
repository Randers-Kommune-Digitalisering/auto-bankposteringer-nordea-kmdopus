import { z } from "zod"
import { pgTable, text, uuid } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { documentTypeEnum } from "./enums"
import { run } from "./run"

export const document = pgTable('document', {
  id: uuid().defaultRandom().primaryKey(),
  runId: uuid('run_id').notNull().references(() => run.id),
  type: documentTypeEnum('type'),
  content: text('content').notNull(),
  filename: text('filename').notNull(),
  fileExtension: text('file_extension').notNull(),
})

export const documentInsertSchema = createInsertSchema(document)
export const documentSelectSchema = createSelectSchema(document)

export type DocumentInsertSchema = z.infer<typeof documentInsertSchema>
export type DocumentSelectSchema = z.infer<typeof documentSelectSchema>