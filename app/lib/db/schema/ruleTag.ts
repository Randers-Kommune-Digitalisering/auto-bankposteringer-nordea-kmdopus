import { z } from "zod"
import { createInsertSchema, createUpdateSchema, createSelectSchema } from "drizzle-zod"
import { pgTable, text } from "drizzle-orm/pg-core"

export const ruleTag = pgTable('rule_tag', {
  id: text().primaryKey()
})

export const ruleTagInsertSchema = createInsertSchema(ruleTag)
export const ruleTagUpdateSchema = createUpdateSchema(ruleTag)
// For fetching ruletags when creating or updating rules
export const ruleTagSelectSchema = createSelectSchema(ruleTag)

export type RuleTagInsertSchema = z.infer<typeof ruleTagInsertSchema>
export type RuleTagUpdateSchema = z.infer<typeof ruleTagUpdateSchema>
export type RuleTagSelectSchema = z.infer<typeof ruleTagSelectSchema>