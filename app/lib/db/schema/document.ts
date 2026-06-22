import { z } from "zod"
import { pgTable, text, uuid, index } from "drizzle-orm/pg-core"
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
}, (t) => ({
  runIdIdx: index('document_run_id_idx').on(t.runId),
}))

export const documentInsertSchema = createInsertSchema(document)
export const documentSelectSchema = createSelectSchema(document)

export type DocumentInsertSchema = z.infer<typeof documentInsertSchema>
export type DocumentSelectSchema = z.infer<typeof documentSelectSchema>