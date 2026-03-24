import { z } from "zod"
import { pgEnum, pgTable, text, integer } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema, createSelectSchema } from "drizzle-zod"

export const bankProvider = pgEnum('bank_provider', ['danskebank', 'nordea', 'bankconnect'])

export const account = pgTable('account', {
  id: text().primaryKey(),
  name: text(),
  provider: bankProvider().notNull(),
  statusAccount: integer('status_account').notNull()
})

export const accountInsertSchema = createInsertSchema(account)
export const accountUpdateSchema = createUpdateSchema(account)
export const accountSelectSchema = createSelectSchema(account)

export type AccountInsertSchema = z.infer<typeof accountInsertSchema>
export type AccountUpdateSchema = z.infer<typeof accountUpdateSchema>
export type AccountSelectSchema = z.infer<typeof accountSelectSchema>