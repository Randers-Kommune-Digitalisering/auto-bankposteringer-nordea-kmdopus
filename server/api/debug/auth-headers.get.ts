import { defineEventHandler, getRequestHeaders, createError } from 'h3'
import env from '~/lib/env/env'

function mask(value: string): string {
  if (value.length <= 8) return '********'
  return `${value.slice(0, 4)}…${value.slice(-4)}`
}

export default defineEventHandler((event) => {
  if (!env.DEV_AUTH_BYPASS) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const headers = getRequestHeaders(event)
  const picked: Record<string, string> = {}

  for (const k of Object.keys(headers)) {
    const key = k.toLowerCase()
    if (key.startsWith('x-auth-request-') || key === 'authorization' || key === 'cookie') {
      const v = String((headers as any)[k] ?? '')
      picked[key] = key === 'cookie' ? mask(v) : v
    }
  }

  return { headers: picked }
})
