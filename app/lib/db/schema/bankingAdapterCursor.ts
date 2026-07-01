import { z } from 'zod'
import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { account } from './account'

/**
 * Persisted cursor/state for bank adapter document fetching.
 *
 * Important:
 * - Cursor is opaque (adapter-defined) and stored as-is.
 * - This keeps runtime stateless while allowing incremental fetching.
 */

export const bankingAdapterCursor = pgTable(
  'banking_adapter_cursor',
  {
    id: uuid().defaultRandom().primaryKey(),
    accountId: text('account_id')
      .notNull()
      .references(() => account.id, { onDelete: 'cascade' }),
    adapterKey: text('adapter_key').notNull(),
    cursor: text('cursor').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique('banking_adapter_cursor_account_adapter_unique').on(
      t.accountId,
      t.adapterKey,
    ),
  ],
)

export const bankingAdapterCursorInsertSchema = createInsertSchema(bankingAdapterCursor)
export const bankingAdapterCursorUpdateSchema = createUpdateSchema(bankingAdapterCursor)
export const bankingAdapterCursorSelectSchema = createSelectSchema(bankingAdapterCursor)

export type BankingAdapterCursorInsertSchema = z.infer<typeof bankingAdapterCursorInsertSchema>
export type BankingAdapterCursorUpdateSchema = z.infer<typeof bankingAdapterCursorUpdateSchema>
export type BankingAdapterCursorSelectSchema = z.infer<typeof bankingAdapterCursorSelectSchema>
