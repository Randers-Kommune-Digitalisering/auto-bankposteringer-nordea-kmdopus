import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import db from '~/lib/db'

export type FailedErpRequestListItem = {
  requestId: string
  runId: string
  responseId: string
  statusText: string
}

function toStringOrEmpty(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

/**
 * List ERP requests with a negative outcome in the ERP response.
 * "Negative" is defined as status_text NOT starting with "OK".
 */
export default defineEventHandler(async () => {
  const result = await db.execute(sql`
    select
      r.id as request_id,
      r.run_id as run_id,
      resp.id as response_id,
      resp.status_text as status_text
    from erp_request r
    join erp_response resp on resp.request_id = r.id
    where resp.status_text is not null
      and upper(resp.status_text) not like 'OK%'
    order by r.id desc
    limit 50
  `)

  const items = (result.rows ?? [])
    .map((row: any): FailedErpRequestListItem | null => {
      const requestId = toStringOrEmpty(row.request_id)
      const runId = toStringOrEmpty(row.run_id)
      const responseId = toStringOrEmpty(row.response_id)
      const statusText = toStringOrEmpty(row.status_text)

      if (!requestId || !runId || !responseId || !statusText) return null
      return { requestId, runId, responseId, statusText }
    })
    .filter((x): x is FailedErpRequestListItem => Boolean(x))

  return { items }
})
