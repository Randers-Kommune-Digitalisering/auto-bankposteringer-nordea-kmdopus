import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { run } from './run'
import { erpRequest } from './erp'
import { outbox } from './outbox'

export const runTimelineEvent = pgTable('run_timeline_event', {
  id: uuid().defaultRandom().primaryKey(),
  runId: uuid('run_id').notNull().references(() => run.id, { onDelete: 'cascade' }),
  stage: text().notNull(),
  eventType: text('event_type').notNull(),
  status: text(),
  detail: text(),
  requestId: text('request_id').references(() => erpRequest.id, { onDelete: 'set null' }),
  outboxId: uuid('outbox_id').references(() => outbox.id, { onDelete: 'set null' }),
  attempt: integer(),
  actorId: text('actor_id'),
  payloadSha256: text('payload_sha256'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  sequence: integer().generatedAlwaysAsIdentity(),
}, (table) => ({
  runCreatedAtIdx: index('run_timeline_event_run_created_at_idx').on(table.runId, table.createdAt),
  requestCreatedAtIdx: index('run_timeline_event_request_created_at_idx').on(table.requestId, table.createdAt),
  outboxCreatedAtIdx: index('run_timeline_event_outbox_created_at_idx').on(table.outboxId, table.createdAt),
}))