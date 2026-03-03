import { z } from 'zod'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { pgTable, uuid, text, integer, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { jobStatusEnum } from './enums'
import { run } from './run'

export const job = pgTable('job', {
  id: uuid().defaultRandom().primaryKey(),
  type: text('type').notNull(),
  status: jobStatusEnum('status').notNull().default('pending'),
  runId: uuid('run_id').references(() => run.id),
  payload: jsonb('payload').notNull(),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(10),
  runAt: timestamp('run_at', { withTimezone: true }).notNull().defaultNow(),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  lockedBy: text('locked_by'),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const jobInsertSchema = createInsertSchema(job)
export const jobUpdateSchema = createUpdateSchema(job)
export const jobSelectSchema = createSelectSchema(job)

export type JobInsertSchema = z.infer<typeof jobInsertSchema>
export type JobUpdateSchema = z.infer<typeof jobUpdateSchema>
export type JobSelectSchema = z.infer<typeof jobSelectSchema>
