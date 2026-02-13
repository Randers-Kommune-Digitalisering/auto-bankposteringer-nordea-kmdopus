import { z } from "zod"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { pgTable, integer, uuid, bigint, jsonb, date } from "drizzle-orm/pg-core"
import { rule } from "./rule"

// Table will be populated when rules are created or changed
export const ruleVersion = pgTable('rule_version', {
  id: uuid().defaultRandom().primaryKey(),
  ruleId: integer().notNull().references(() => rule.id),
  version: bigint({ mode: 'number' }).notNull(),
  content: jsonb().notNull(),
  createdAt: date({ mode: "date" }).defaultNow(),
})

export const ruleVersionInsertSchema = createInsertSchema(ruleVersion).omit({
  id: true,
  createdAt: true
})

// Admin queries with ruleId but needs to see everything else
export const ruleVersionSelectSchema = createSelectSchema(ruleVersion).omit({
  id: true,
  ruleId: true
})

export type RuleVersionInsertSchema = z.infer<typeof ruleVersionInsertSchema>
export type RuleVersionSelectSchema = z.infer<typeof ruleVersionSelectSchema>