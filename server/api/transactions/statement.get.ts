import { defineEventHandler, getQuery, setHeader } from 'h3'

// Backwards-compatible shim.
// The canonical endpoint is /api/transactions with mode=statement.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const query = {
    ...getQuery(event),
    mode: 'statement',
  }

  return await $fetch('/api/transactions', {
    query,
    method: 'GET',
  })
})
