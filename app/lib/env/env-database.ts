import { z } from 'zod'
import tryParseEnv from './try-parse-env'

// Minimal env required for DB access.
// Used by migrations/seed so they don't depend on the full runtime integration env.

const DatabaseEnvSchema = z.object({
  DATABASE_URL: z.string(),
})

type DatabaseEnv = z.infer<typeof DatabaseEnvSchema>

tryParseEnv(DatabaseEnvSchema)

export default DatabaseEnvSchema.parse(process.env) as DatabaseEnv
