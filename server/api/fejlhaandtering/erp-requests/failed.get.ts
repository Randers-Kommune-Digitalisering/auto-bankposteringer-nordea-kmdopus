import { createError, defineEventHandler, getQuery } from 'h3'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import {
  getErpGroupStatus,
  getErpOverviewStatus,
  selectLatestErpRequestPerDocument,
} from '~/lib/presenters/erpRequestOverview'
import type { ErpRequestOverviewItem } from '~/types/erpRequestOverview'
import { requireErrorHandlingReadAccess } from '~~/server/auth/requireAppRoles'

type ErpRequestAttemptRow = {
  request_id: string | null
  source_request_id: string | null
  run_id: string | null
  document_id: string | null
  document_origin: string | null
  response_id: string | null
  response_status_text: string | null
  outbox_status: string | null
  outbox_last_error: string | null
  outbox_created_at: string | Date | null
  event_status: string | null
  event_detail: string | null
  event_created_at: string | Date | null
  event_sequence: string | number | null
  run_booking_date: string | Date | null
  transaction_booking_date: string | Date | null
  transaction_count: string | number | null
}

const querySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
}).refine((value) => !value.start || !value.end || value.start <= value.end, {
  message: 'start skal være før eller lig med end',
})

function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null
  return String(value)
}

function toIsoTimestamp(value: string | Date | null): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function isDocumentOrigin(value: string | null): value is 'batch' | 'manual' {
  return value === 'batch' || value === 'manual'
}

/**
 * Lists one current row per logical ERP document and paginates by run, not by
 * individual request attempts. Technical request history remains persisted.
 */
export default defineEventHandler(async (event) => {
  await requireErrorHandlingReadAccess(event)

  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldige kontrolfiltre' })
  }

  return listErpRequestOverview(parsed.data)
})

export async function listErpRequestOverview(
  { start, end, page, pageSize }: z.infer<typeof querySchema>,
) {
  const offset = (page - 1) * pageSize

  const runResult = await db.execute(sql`
    with run_transaction as (
      select request.run_id, line.transaction_id
      from erp_request request
      inner join erp_request_line line on line.request_id = request.id
      where line.transaction_id is not null

      union

      select document.run_id, membership.transaction_id
      from erp_document document
      inner join erp_document_transaction membership on membership.document_id = document.id
    )
    select
      r.id as run_id,
      count(*) over() as total_count
    from run r
    where exists (
      select 1
      from erp_request request
      where request.run_id = r.id
    )
    and (
      (${start ?? null}::date is null and ${end ?? null}::date is null)
      or exists (
        select 1
        from run_transaction rt
        inner join "transaction" tx on tx.id = rt.transaction_id
        where rt.run_id = r.id
          and (${start ?? null}::date is null or tx.booking_date >= ${start ?? null}::date)
          and (${end ?? null}::date is null or tx.booking_date <= ${end ?? null}::date)
      )
    )
    order by r.booking_date desc, r.id desc
    limit ${pageSize} offset ${offset}
  `)

  const runRows = (runResult.rows ?? []) as Array<{ run_id: string; total_count: string | number }>
  const total = Number(runRows[0]?.total_count ?? 0)
  const runIds = runRows.map(row => String(row.run_id))

  if (!runIds.length) {
    return { items: [] as ErpRequestOverviewItem[], total, page, pageSize }
  }

  const runIdFilter = sql.join(runIds.map(runId => sql`${runId}::uuid`), sql`, `)
  const attemptResult = await db.execute<ErpRequestAttemptRow>(sql`
    select
      request.id as request_id,
      request.source_request_id as source_request_id,
      request.run_id as run_id,
      request.document_id as document_id,
      document.origin as document_origin,
      response.id as response_id,
      response.status_text as response_status_text,
      delivery.status as outbox_status,
      delivery.last_error as outbox_last_error,
      delivery.created_at as outbox_created_at,
      latest_event.status as event_status,
      latest_event.detail as event_detail,
      latest_event.created_at as event_created_at,
      latest_event.sequence as event_sequence,
      r.booking_date::text as run_booking_date,
      transaction_summary.booking_date::text as transaction_booking_date,
      coalesce(transaction_summary.transaction_count, 0) as transaction_count
    from erp_request request
    inner join run r on r.id = request.run_id
    left join erp_document document on document.id = request.document_id
    left join erp_response response on response.request_id = request.id
    left join lateral (
      select outbox.status, outbox.last_error, outbox.created_at
      from outbox
      where outbox.topic = 'erp.uploadRequestPayload'
        and outbox.payload ->> 'requestId' = request.id
      order by outbox.created_at desc, outbox.id desc
      limit 1
    ) delivery on true
    left join lateral (
      select event.status, event.detail, event.created_at, event.sequence
      from run_timeline_event event
      where event.stage = 'erp' and event.request_id = request.id
      order by event.created_at desc, event.sequence desc
      limit 1
    ) latest_event on true
    left join lateral (
      select
        min(tx.booking_date) as booking_date,
        count(distinct tx.id) as transaction_count
      from (
        select line.transaction_id
        from erp_request_line line
        where line.request_id = request.id and line.transaction_id is not null

        union

        select membership.transaction_id
        from erp_document_transaction membership
        where membership.document_id = request.document_id
      ) linked_transaction
      inner join "transaction" tx on tx.id = linked_transaction.transaction_id
    ) transaction_summary on true
    where request.run_id in (${runIdFilter})
    order by request.run_id, request.document_id, request.id
  `)

  const attempts = (attemptResult.rows ?? [])
    .map((row) => {
      const requestId = toStringOrNull(row.request_id)
      const runId = toStringOrNull(row.run_id)
      if (!requestId || !runId) return null
      const documentOrigin = toStringOrNull(row.document_origin)

      return {
        requestId,
        sourceRequestId: toStringOrNull(row.source_request_id),
        documentId: toStringOrNull(row.document_id),
        runId,
        outboxCreatedAt: toIsoTimestamp(row.outbox_created_at),
        eventCreatedAt: toIsoTimestamp(row.event_created_at),
        eventSequence: row.event_sequence === null ? null : Number(row.event_sequence),
        responseId: toStringOrNull(row.response_id),
        responseStatusText: toStringOrNull(row.response_status_text),
        outboxStatus: toStringOrNull(row.outbox_status),
        outboxLastError: toStringOrNull(row.outbox_last_error),
        eventStatus: toStringOrNull(row.event_status),
        eventDetail: toStringOrNull(row.event_detail),
        runBookingDate: toStringOrNull(row.run_booking_date),
        transactionBookingDate: toStringOrNull(row.transaction_booking_date),
        transactionCount: Number(row.transaction_count ?? 0),
        documentOrigin: isDocumentOrigin(documentOrigin)
          ? documentOrigin
          : null,
      }
    })
    .filter((attempt): attempt is NonNullable<typeof attempt> => attempt !== null)

  const latestRequests = selectLatestErpRequestPerDocument(attempts)
  const documents = latestRequests.map((request) => {
    const status = getErpOverviewStatus(request)

    return {
      ...request,
      status,
      documentId: request.documentId,
      documentLabel: request.documentOrigin === 'batch'
        ? 'Batchpostering'
        : request.documentOrigin === 'manual'
          ? 'Manuel bogføring'
          : 'ERP-postering',
      bookingDate: request.transactionBookingDate ?? request.runBookingDate,
    }
  })

  const documentsByRun = new Map<string, typeof documents>()
  for (const document of documents) {
    const existing = documentsByRun.get(document.runId) ?? []
    existing.push(document)
    documentsByRun.set(document.runId, existing)
  }

  const items: ErpRequestOverviewItem[] = []
  for (const runId of runIds) {
    const runDocuments = documentsByRun.get(runId) ?? []
    if (!runDocuments.length) continue

    const batchDocument = runDocuments.find(document => document.documentOrigin === 'batch')
    if (batchDocument) {
      const childDocuments = runDocuments.filter(document => document.requestId !== batchDocument.requestId)
      const parentStatus = getErpGroupStatus(runDocuments.map(document => document.status))
      const group = {
        requestId: batchDocument.requestId,
        groupLabel: batchDocument.documentLabel,
        documentId: batchDocument.documentId,
        documentLabel: batchDocument.documentLabel,
        bookingDate: batchDocument.bookingDate,
        transactionCount: runDocuments.reduce((sum, document) => sum + document.transactionCount, 0),
        statusLabel: parentStatus.label,
        statusColor: parentStatus.color,
        statusDetail: parentStatus.detail,
        childCount: childDocuments.length,
      }

      for (const document of childDocuments.length ? childDocuments : [batchDocument]) {
        items.push({
          requestId: document.requestId,
          runId,
          groupingKey: runId,
          group,
          documentId: document.documentId,
          documentOrigin: document.documentOrigin,
          documentLabel: document.documentLabel,
          bookingDate: document.bookingDate,
          transactionCount: document.transactionCount,
          statusLabel: document.status.label,
          statusColor: document.status.color,
          statusDetail: document.status.detail,
        })
      }
      continue
    }

    for (const document of runDocuments) {
      const group = {
        requestId: document.requestId,
        groupLabel: document.documentLabel,
        documentId: document.documentId,
        documentLabel: document.documentLabel,
        bookingDate: document.bookingDate ?? document.runBookingDate,
        transactionCount: document.transactionCount,
        statusLabel: document.status.label,
        statusColor: document.status.color,
        statusDetail: document.status.detail,
        childCount: 0,
      }
      items.push({
        requestId: document.requestId,
        runId,
        groupingKey: `document:${document.documentId ?? document.requestId}`,
        group,
        documentId: document.documentId,
        documentOrigin: document.documentOrigin,
        documentLabel: document.documentLabel,
        bookingDate: document.bookingDate,
        transactionCount: document.transactionCount,
        statusLabel: document.status.label,
        statusColor: document.status.color,
        statusDetail: document.status.detail,
      })
    }
  }

  const runOrder = new Map(runIds.map((runId, index) => [runId, index]))
  const documentOrder = (origin: ErpRequestOverviewItem['documentOrigin']) =>
    origin === 'batch' ? 0 : origin === 'manual' ? 1 : 2
  items.sort((left, right) =>
    (runOrder.get(left.runId) ?? Number.MAX_SAFE_INTEGER) - (runOrder.get(right.runId) ?? Number.MAX_SAFE_INTEGER)
    || documentOrder(left.documentOrigin) - documentOrder(right.documentOrigin)
    || (left.documentId ?? left.requestId).localeCompare(right.documentId ?? right.requestId),
  )

  return { items, total, page, pageSize }
}
