import { defineNitroPlugin } from 'nitropack/runtime'
import crypto from 'node:crypto'
import { getRequestHeader, getRequestURL, setResponseHeader } from 'h3'
import { logger } from '~/lib/logger'

/**
 * Global API logging (Nitro/H3).
 *
 * Goals:
 * - Emit structured JSON logs to stdout/stderr via `~/lib/logger`.
 * - Log events + metadata only (no request/response bodies, no headers).
 * - Provide correlation with `x-request-id`.
 * - Avoid redundancy with upstream access logs (e.g. oauth2-proxy/keycloak):
 *   - Default behavior logs only 4xx/5xx + slow requests.
 *   - Optional env can enable full access logs.
 *
 * Events:
 * - `api.response` (warn) for 4xx
 * - `api.slow` (warn) for slow responses
 * - `api.response` (info) for 2xx/3xx only when API_ACCESS_LOG=1
 * - `api.error` (error) for 5xx (includes err when available)
 *
 * Env toggles:
 * - API_ACCESS_LOG=1    -> also log successful requests
 * - API_SLOW_MS=1000    -> slow threshold for `api.slow`
 */

type ApiLogContext = {
  requestId: string
  startMs: number
  method: string
  path: string
  runId?: string
}

type ApiLogErrorContext = {
  err: unknown
}

function getOrCreateRequestId(event: any): string {
  const existing = getRequestHeader(event, 'x-request-id')
  if (existing && typeof existing === 'string' && existing.trim()) return existing.trim()
  const generated = crypto.randomUUID()
  setResponseHeader(event, 'x-request-id', generated)
  return generated
}

function tryExtractRunId(path: string): string | undefined {
  const match = path.match(/\/runs\/(.+?)(\/|$)/)
  const id = match?.[1]
  return id ? decodeURIComponent(id) : undefined
}

function parseBool(value: unknown): boolean {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return v === '1' || v === 'true' || v === 'yes'
}

function parseNonNegativeInt(value: unknown): number | undefined {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return undefined
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n < 0) return undefined
  return n
}

export default defineNitroPlugin((nitroApp) => {
  const accessLogEnabled = parseBool(process.env.API_ACCESS_LOG)
  const slowMs = parseNonNegativeInt(process.env.API_SLOW_MS) ?? 1000

  nitroApp.hooks.hook('request', (event: any) => {
    const url = getRequestURL(event)
    const method = event.method
    const path = url.pathname

    const requestId = getOrCreateRequestId(event)
    const ctx: ApiLogContext = {
      requestId,
      startMs: Date.now(),
      method,
      path,
      runId: tryExtractRunId(path),
    }

    event.context.apiLog = ctx

    const res = event.node?.res
    if (!res?.on) return

    res.on('finish', () => {
      const durationMs = Date.now() - ctx.startMs
      const statusCode = res.statusCode || 200

      const errorCtx = event.context.apiLogError as ApiLogErrorContext | undefined

      const log = logger.child({
        scope: 'api',
        requestId: ctx.requestId,
        method: ctx.method,
        path: ctx.path,
        runId: ctx.runId,
      })

      if (statusCode >= 500) {
        // One consolidated error event (avoid double logs).
        log.error('api.error', { statusCode, durationMs, err: errorCtx?.err })
        return
      }

      if (statusCode >= 400) {
        log.warn('api.response', { statusCode, durationMs })
        return
      }

      if (durationMs >= slowMs) {
        log.warn('api.slow', { statusCode, durationMs, slowMs })
        return
      }

      if (accessLogEnabled) {
        log.info('api.response', { statusCode, durationMs })
      }
    })
  })

  nitroApp.hooks.hook('error', (err: any, context: any) => {
    const event = context?.event
    if (!event?.context) return
    // Store the error and let the `finish` listener emit a single structured log
    // with statusCode + durationMs.
    event.context.apiLogError = { err } satisfies ApiLogErrorContext
  })
})
