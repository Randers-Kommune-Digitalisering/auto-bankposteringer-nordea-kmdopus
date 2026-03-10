import { defineEventHandler } from 'h3'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'

export default defineEventHandler(async (event) => {
  const runId = z.string().uuid().parse(event.context.params?.runId)

  const result = await db.execute(sql`
    update transaction_processing as tp
    set status = 'åben', rule_applied = null, locked_at = null, locked_by = null
    from transaction as t
    where tp.transaction_id = t.id
      and t.run_id = ${runId}
      and tp.status = 'bogført'
    returning tp.transaction_id
  `)

  const rows = (result.rows ?? []) as Array<{ transaction_id?: string }>
  return { success: true, runId, reopened: rows.length }
})
