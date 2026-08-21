import { createError, defineEventHandler, getQuery } from 'h3'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { requireErrorHandlingReadAccess } from '~~/server/auth/requireAppRoles'

export type FailedErpRequestListItem = {
  requestId: string
  runId: string
  responseId: string | null
  statusText: string | null
  bookingDate: string | null
}

const querySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
}).refine((value) => !value.start || !value.end || value.start <= value.end, {
  message: 'start skal være før eller lig med end',
})

function toStringOrEmpty(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

/**
 * List ERP request/response flows for the control view.
 * Date and text predicates are applied before pagination.
 */
export default defineEventHandler(async (event) => {
  await requireErrorHandlingReadAccess(event)

  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldige kontrolfiltre' })
  }

  const { start, end, page, pageSize } = parsed.data

  const filters = [sql`1 = 1`]
  if (start) filters.push(sql`tx.booking_date >= ${start}::date`)
  if (end) filters.push(sql`tx.booking_date <= ${end}::date`)

  const where = sql.join(filters, sql` AND `)
  const offset = (page - 1) * pageSize

  const result = await db.execute(sql`
    select
      r.id as request_id,
      r.run_id as run_id,
      resp.id as response_id,
      resp.status_text as status_text,
      min(tx.booking_date) as booking_date,
      count(*) over() as total_count
    from erp_request r
    left join erp_response resp on resp.request_id = r.id
    left join erp_request_line line on line.request_id = r.id
    left join "transaction" tx on tx.id = line.transaction_id
    where ${where}
    group by r.id, r.run_id, resp.id, resp.status_text
    order by min(tx.booking_date) desc nulls last, r.id desc
    limit ${pageSize} offset ${offset}
  `)

  const items = (result.rows ?? [])
    .map((row: any): FailedErpRequestListItem | null => {
      const requestId = toStringOrEmpty(row.request_id)
      const runId = toStringOrEmpty(row.run_id)
      const responseId = toStringOrEmpty(row.response_id)
      const statusText = toStringOrEmpty(row.status_text)

      if (!requestId || !runId) return null
      return {
        requestId,
        runId,
        responseId: responseId || null,
        statusText: statusText || null,
        bookingDate: toStringOrEmpty(row.booking_date) || null,
      }
    })
    .filter((x): x is FailedErpRequestListItem => Boolean(x))

  const total = Number((result.rows?.[0] as any)?.total_count ?? 0)
  return { items, total, page, pageSize }
})
