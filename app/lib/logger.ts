export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogBindings = Record<string, unknown>

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void
  info(message: string, meta?: Record<string, unknown>): void
  warn(message: string, meta?: Record<string, unknown>): void
  error(message: string, meta?: Record<string, unknown>): void
  child(bindings: LogBindings): Logger
}

export interface LoggerOptions {
  level?: LogLevel
  bindings?: LogBindings
  redactKeys?: Array<string | RegExp>
}

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const defaultRedactKeys: Array<string | RegExp> = [
  new RegExp('pass(word)?', 'i'),
  new RegExp('secret', 'i'),
  new RegExp('token', 'i'),
  new RegExp('authorization', 'i'),
  new RegExp('cookie', 'i'),
  new RegExp('cpr', 'i'),
  new RegExp('iban', 'i'),
  new RegExp('account(_?number)?', 'i'),
  new RegExp('konto', 'i'),
  new RegExp('privatekey', 'i'),
]

function getDefaultLevel(): LogLevel {
  const configured = (process.env.LOG_LEVEL ?? '').toLowerCase()
  if (configured === 'debug' || configured === 'info' || configured === 'warn' || configured === 'error') {
    return configured
  }

  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

function shouldRedactKey(key: string, rules: Array<string | RegExp>): boolean {
  for (const rule of rules) {
    if (typeof rule === 'string') {
      if (key.toLowerCase() === rule.toLowerCase()) return true
    } else {
      if (rule.test(key)) return true
    }
  }
  return false
}

function serializeError(error: unknown): Record<string, unknown> | undefined {
  if (!error) return undefined

  if (error instanceof Error) {
    const anyError = error as Error & { code?: unknown; cause?: unknown }
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: anyError.code,
      cause: anyError.cause ? serializeError(anyError.cause) ?? anyError.cause : undefined,
    }
  }

  if (typeof error === 'object') {
    // Often thrown values are already objects
    return sanitizeForLog(error as Record<string, unknown>, {
      redactKeys: defaultRedactKeys,
      maxDepth: 6,
      maxArrayLength: 50,
      maxStringLength: 2000,
    }) as Record<string, unknown>
  }

  return { message: String(error) }
}

type SanitizeOptions = {
  redactKeys: Array<string | RegExp>
  maxDepth: number
  maxArrayLength: number
  maxStringLength: number
}

function sanitizeForLog(value: unknown, options: SanitizeOptions, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value == null) return value

  if (typeof value === 'string') {
    if (value.length <= options.maxStringLength) return value
    return value.slice(0, options.maxStringLength) + '…'
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return value

  if (value instanceof Date) return value.toISOString()

  if (value instanceof Error) return serializeError(value)

  if (depth >= options.maxDepth) return '[MaxDepth]'

  if (Array.isArray(value)) {
    const sliced = value.slice(0, options.maxArrayLength)
    return sliced.map(v => sanitizeForLog(v, options, depth + 1, seen))
  }

  if (typeof value === 'object') {
    if (seen.has(value as object)) return '[Circular]'
    seen.add(value as object)

    const out: Record<string, unknown> = {}
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      if (shouldRedactKey(key, options.redactKeys)) {
        out[key] = '[REDACTED]'
        continue
      }

      out[key] = sanitizeForLog(raw, options, depth + 1, seen)
    }
    return out
  }

  return String(value)
}

function safeMergeBindings(...parts: Array<LogBindings | undefined>): LogBindings {
  return Object.assign({}, ...parts.filter(Boolean))
}

function emit(level: LogLevel, record: Record<string, unknown>) {
  const line = JSON.stringify(record)
  if (level === 'error') return console.error(line)
  if (level === 'warn') return console.warn(line)
  return console.log(line)
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const configuredLevel = options.level ?? getDefaultLevel()
  const redactKeys = options.redactKeys ?? defaultRedactKeys
  const baseBindings = options.bindings ?? {}

  const log = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    if (levelWeight[level] < levelWeight[configuredLevel]) return

    const error = meta?.error ?? meta?.err
    const cleanedMeta = meta
      ? (sanitizeForLog(meta, {
          redactKeys,
          maxDepth: 6,
          maxArrayLength: 50,
          maxStringLength: 2000,
        }) as Record<string, unknown>)
      : undefined

    if (cleanedMeta && (cleanedMeta as Record<string, unknown>).error instanceof Error) {
      ;(cleanedMeta as Record<string, unknown>).error = serializeError((cleanedMeta as Record<string, unknown>).error)
    }

    const record: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level,
      msg: message,
      ...baseBindings,
      ...(cleanedMeta ?? {}),
    }

    if (error) {
      record.error = serializeError(error)
    }

    emit(level, record)
  }

  const api: Logger = {
    debug: (message, meta) => log('debug', message, meta),
    info: (message, meta) => log('info', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    error: (message, meta) => log('error', message, meta),
    child: (bindings) => createLogger({ level: configuredLevel, bindings: safeMergeBindings(baseBindings, bindings), redactKeys }),
  }

  return api
}

export const logger = createLogger({
  bindings: {
    service: process.env.SERVICE_NAME ?? 'fobi',
    env: process.env.NODE_ENV ?? 'development',
  },
})
