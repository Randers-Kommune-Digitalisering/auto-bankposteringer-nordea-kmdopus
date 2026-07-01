import { z } from 'zod'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { integer, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { bankProvider } from './account'
import { bankChannel } from './bankingAgreement'
import { bankingAgreementDiscoveryStatusEnum } from './enums'
import { job } from './job'

export const bankingAgreementDiscoveryRun = pgTable('banking_agreement_discovery_run', {
  id: uuid().defaultRandom().primaryKey(),
  provider: bankProvider('provider').notNull(),
  channel: bankChannel('channel').notNull(),
  status: bankingAgreementDiscoveryStatusEnum('status').notNull().default('started'),
  jobId: uuid('job_id').references(() => job.id),
  triggerSource: text('trigger_source').notNull().default('agreement_activation'),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  discoveredAccounts: integer('discovered_accounts').notNull().default(0),
  inspectedDocuments: integer('inspected_documents').notNull().default(0),
  skippedDays: integer('skipped_days').notNull().default(0),
  errorMessage: text('error_message'),
}, (t) => ({
  providerRequestedAtIdx: index('banking_agreement_discovery_run_provider_requested_at_idx').on(t.provider, t.requestedAt),
  statusUpdatedAtIdx: index('banking_agreement_discovery_run_status_updated_at_idx').on(t.status, t.updatedAt),
  jobIdIdx: index('banking_agreement_discovery_run_job_id_idx').on(t.jobId),
}))

export const bankingAgreementDiscoveryRunInsertSchema = createInsertSchema(bankingAgreementDiscoveryRun).omit({
  startedAt: true,
  finishedAt: true,
  updatedAt: true,
  discoveredAccounts: true,
  inspectedDocuments: true,
  skippedDays: true,
  errorMessage: true,
})
export const bankingAgreementDiscoveryRunUpdateSchema = createUpdateSchema(bankingAgreementDiscoveryRun).omit({
  id: true,
  provider: true,
  channel: true,
  requestedAt: true,
})
export const bankingAgreementDiscoveryRunSelectSchema = createSelectSchema(bankingAgreementDiscoveryRun)

export type BankingAgreementDiscoveryRunInsertSchema = z.infer<typeof bankingAgreementDiscoveryRunInsertSchema>
export type BankingAgreementDiscoveryRunUpdateSchema = z.infer<typeof bankingAgreementDiscoveryRunUpdateSchema>
export type BankingAgreementDiscoveryRunSelectSchema = z.infer<typeof bankingAgreementDiscoveryRunSelectSchema>
