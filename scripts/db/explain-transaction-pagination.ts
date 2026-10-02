import 'dotenv/config'
import { sql } from 'drizzle-orm'
import db, { pool } from '../../app/lib/db'
import { buildPaginatedTransactionKeysQuery } from '../../server/utils/transactions/selectPaginatedTransactionKeys'

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, received: ${value}`)
  }
  return parsed
}

const pageSize = Math.min(parsePositiveInt(process.argv[2], 50), 200)
const offset = process.argv[3] ? Number.parseInt(process.argv[3], 10) : 0
if (!Number.isInteger(offset) || offset < 0) {
  throw new Error(`Expected a non-negative offset, received: ${process.argv[3]}`)
}
const requestedSortKey = process.argv[4]
const sortKey = requestedSortKey === 'counterpart' || requestedSortKey === 'transactionType'
  ? requestedSortKey
  : undefined
if (requestedSortKey && !sortKey) {
  throw new Error(`Expected sort key counterpart or transactionType, received: ${requestedSortKey}`)
}
const requestedSortDirection = process.argv[5] ?? 'asc'
if (requestedSortDirection !== 'asc' && requestedSortDirection !== 'desc') {
  throw new Error(`Expected sort direction asc or desc, received: ${requestedSortDirection}`)
}

try {
  const plan = await db.transaction(async (tx) => {
    await tx.execute(sql`set transaction read only`)
    await tx.execute(sql`set local statement_timeout = '30s'`)

    return tx.execute(sql`
      explain (analyze, buffers, format json)
      ${buildPaginatedTransactionKeysQuery({
        pageSize,
        offset,
        sortKey,
        sortDirection: requestedSortDirection,
        includeTransactionTypeValues: true,
      })}
    `)
  })

  process.stdout.write(`${JSON.stringify(plan.rows[0]?.['QUERY PLAN'] ?? [], null, 2)}\n`)
} finally {
  await pool.end()
}