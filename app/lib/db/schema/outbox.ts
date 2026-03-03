import { z } from 'zod'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { pgTable, uuid, text, integer, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { outboxStatusEnum } from './enums'
import { run } from './run'

export const outbox = pgTable('outbox', {
  id: uuid().defaultRandom().primaryKey(),
  topic: text('topic').notNull(),
  status: outboxStatusEnum('status').notNull().default('pending'),
  runId: uuid('run_id').references(() => run.id),
  dedupeKey: text('dedupe_key').unique(),
  payload: jsonb('payload').notNull(),
  attempts: integer('attempts').notNull().default(0),
  nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }).notNull().defaultNow(),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  lockedBy: text('locked_by'),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
})

export const outboxInsertSchema = createInsertSchema(outbox)
export const outboxUpdateSchema = createUpdateSchema(outbox)
export const outboxSelectSchema = createSelectSchema(outbox)

export type OutboxInsertSchema = z.infer<typeof outboxInsertSchema>
export type OutboxUpdateSchema = z.infer<typeof outboxUpdateSchema>
export type OutboxSelectSchema = z.infer<typeof outboxSelectSchema>
