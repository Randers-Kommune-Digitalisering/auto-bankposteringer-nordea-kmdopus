import { z } from 'zod'
import tryParseEnv from './try-parse-env'

// Minimal env required for DB access.
// Used by migrations/seed so they don't depend on the full runtime integration env.

const DatabaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
})

export function resolveDatabaseUrl(env: NodeJS.ProcessEnv): string {
  if (env.DATABASE_URL !== undefined) return env.DATABASE_URL

  const requiredValue = (key: string, value: string | undefined): string => {
    if (!value) {
      throw new Error(`Cannot construct DATABASE_URL; missing required value:\n${key}`)
    }
    return value
  }
  const user = requiredValue('POSTGRES_USER', env.POSTGRES_USER)
  const password = requiredValue('POSTGRES_PASSWORD', env.POSTGRES_PASSWORD)
  const database = requiredValue('POSTGRES_DB', env.POSTGRES_DB)
  const host = env.POSTGRES_HOST || 'db'
  const port = env.POSTGRES_PORT || '5432'
  const formattedHost = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host

  try {
    return new URL(
      `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${formattedHost}:${port}/${encodeURIComponent(database)}`,
    ).toString()
  }
  catch (cause) {
    throw new Error('Invalid POSTGRES_HOST or POSTGRES_PORT; cannot construct DATABASE_URL', { cause })
  }
}

const databaseEnv = {
  ...process.env,
  DATABASE_URL: resolveDatabaseUrl(process.env),
}

tryParseEnv(DatabaseEnvSchema, databaseEnv)

export default DatabaseEnvSchema.parse(databaseEnv)
