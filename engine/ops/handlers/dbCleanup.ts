import { sql } from 'drizzle-orm'
import db from '~/lib/db'
import { logger } from '~/lib/logger'
import env from '~/lib/env/env'

function getRowCount(result: any): number {
  if (!result) return 0
  if (typeof result.rowCount === 'number') return result.rowCount
  return 0
}

export type DbCleanupResult = {
  retentionDays: number
  deleted: Record<string, number>
}

export async function runDbCleanup(): Promise<DbCleanupResult> {
  const log = logger.child({ scope: 'ops.dbCleanup' })

  const retentionDays = env.DATA_RETENTION_DAYS

  const cutoffTs = sql`now() - (${retentionDays} * interval '1 day')`
  const cutoffDate = sql`current_date - ${retentionDays}`

  log.info('dbCleanup.start', { retentionDays })

  const deleted: Record<string, number> = {}

  await db.transaction(async (tx) => {
    // Queue/outbox: keep only operational recent history.
    deleted.job = getRowCount(
      await tx.execute(sql`
        delete from job
        where created_at < ${cutoffTs}
          and status in ('succeeded', 'failed')
      `),
    )

    deleted.outbox = getRowCount(
      await tx.execute(sql`
        delete from outbox
        where created_at < ${cutoffTs}
          and status = 'sent'
          and processed_at is not null
          and processed_at < ${cutoffTs}
      `),
    )

    // Rule rollback history (may contain sensitive data like CPR/note/attachments).
    deleted.ruleVersion = getRowCount(
      await tx.execute(sql`
        delete from rule_version
        where "createdAt" < ${cutoffDate}
      `),
    )

    // Manual booking drafts (always sensitive).
    deleted.manualBookingDraftLineDimension = getRowCount(
      await tx.execute(sql`
        delete from manual_booking_draft_line_dimension dim
        using manual_booking_draft_line l, manual_booking_draft d, "transaction" t
        where dim.line_id = l.id
          and l.transaction_id = d.transaction_id
          and d.transaction_id = t.id
          and t.booking_date < ${cutoffDate}
      `),
    )

    deleted.manualBookingDraftLine = getRowCount(
      await tx.execute(sql`
        delete from manual_booking_draft_line l
        using manual_booking_draft d, "transaction" t
        where l.transaction_id = d.transaction_id
          and d.transaction_id = t.id
          and t.booking_date < ${cutoffDate}
      `),
    )

    deleted.manualBookingDraftAttachment = getRowCount(
      await tx.execute(sql`
        delete from manual_booking_draft_attachment a
        using manual_booking_draft d, "transaction" t
        where a.transaction_id = d.transaction_id
          and d.transaction_id = t.id
          and t.booking_date < ${cutoffDate}
      `),
    )

    deleted.manualBookingDraft = getRowCount(
      await tx.execute(sql`
        delete from manual_booking_draft d
        using "transaction" t
        where d.transaction_id = t.id
          and t.booking_date < ${cutoffDate}
      `),
    )

    // ERP request/response payloads (sensitive) are run-scoped.
    deleted.erpRequestLine = getRowCount(
      await tx.execute(sql`
        delete from erp_request_line l
        using erp_request q, "run" r
        where l.request_id = q.id
          and q.run_id = r.id
          and r.booking_date < ${cutoffDate}
      `),
    )

    deleted.erpResponse = getRowCount(
      await tx.execute(sql`
        delete from erp_response resp
        using erp_request q, "run" r
        where resp.request_id = q.id
          and q.run_id = r.id
          and r.booking_date < ${cutoffDate}
      `),
    )

    deleted.erpRequest = getRowCount(
      await tx.execute(sql`
        delete from erp_request q
        using "run" r
        where q.run_id = r.id
          and r.booking_date < ${cutoffDate}
      `),
    )

    // Legacy banking request/response payloads (run-scoped).
    deleted.bankingResponse = getRowCount(
      await tx.execute(sql`
        delete from banking_response resp
        using banking_request q, "run" r
        where resp.request_id = q.id
          and q.run_id = r.id
          and r.booking_date < ${cutoffDate}
      `),
    )

    deleted.bankingRequest = getRowCount(
      await tx.execute(sql`
        delete from banking_request q
        using "run" r
        where q.run_id = r.id
          and r.booking_date < ${cutoffDate}
      `),
    )

    // Generic stored documents (run-scoped).
    deleted.document = getRowCount(
      await tx.execute(sql`
        delete from document d
        using "run" r
        where d.run_id = r.id
          and r.booking_date < ${cutoffDate}
      `),
    )

    // Transaction processing state.
    deleted.transactionProcessing = getRowCount(
      await tx.execute(sql`
        delete from transaction_processing tp
        using "transaction" t
        where tp.transaction_id = t.id
          and t.booking_date < ${cutoffDate}
      `),
    )

    // Transactions themselves.
    deleted.transaction = getRowCount(
      await tx.execute(sql`
        delete from "transaction"
        where booking_date < ${cutoffDate}
      `),
    )

    // Raw bank documents (camt053) and statement details. Only delete if no remaining transactions reference them.
    deleted.bankingStatementBalance = getRowCount(
      await tx.execute(sql`
        delete from banking_statement_balance b
        using banking_statement s, banking_document d
        where b.statement_id = s.id
          and s.document_id = d.id
          and d.received_at < ${cutoffTs}
          and not exists (
            select 1 from "transaction" t
            where t.statement_id = s.id
          )
      `),
    )

    deleted.bankingStatement = getRowCount(
      await tx.execute(sql`
        delete from banking_statement s
        using banking_document d
        where s.document_id = d.id
          and d.received_at < ${cutoffTs}
          and not exists (
            select 1 from "transaction" t
            where t.statement_id = s.id
          )
      `),
    )

    deleted.bankingDocument = getRowCount(
      await tx.execute(sql`
        delete from banking_document d
        where d.received_at < ${cutoffTs}
          and not exists (
            select 1 from banking_statement s
            where s.document_id = d.id
          )
      `),
    )

    // Error logs (sensitive strings) and runs (status history).
    deleted.errorLog = getRowCount(
      await tx.execute(sql`
        delete from "error"
        where created_at < ${cutoffTs}
      `),
    )

    deleted.run = getRowCount(
      await tx.execute(sql`
        delete from "run" r
        where r.booking_date < ${cutoffDate}
          and not exists (select 1 from job j where j.run_id = r.id)
          and not exists (select 1 from outbox o where o.run_id = r.id)
          and not exists (select 1 from "transaction" t where t.run_id = r.id)
          and not exists (select 1 from document d where d.run_id = r.id)
          and not exists (select 1 from erp_request q where q.run_id = r.id)
          and not exists (select 1 from banking_request b where b.run_id = r.id)
          and not exists (select 1 from "error" e where e.run_id = r.id)
      `),
    )
  })

  log.info('dbCleanup.done', { retentionDays, deleted })

  return { retentionDays, deleted }
}
