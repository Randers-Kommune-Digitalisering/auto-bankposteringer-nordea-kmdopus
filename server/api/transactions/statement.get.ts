import { defineEventHandler, getQuery, setHeader } from 'h3'
import type { StatementPageResponse } from './index.get'

// Backwards-compatible shim.
// The canonical endpoint is /api/transactions with mode=statement.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const query = {
    ...getQuery(event),
    mode: 'statement',
  }

  const fetchStatement = $fetch as unknown as (
    request: string,
    options: { query: typeof query; method: 'GET' },
  ) => Promise<StatementPageResponse>

  return await fetchStatement('/api/transactions', {
    query,
    method: 'GET',
  })
})
