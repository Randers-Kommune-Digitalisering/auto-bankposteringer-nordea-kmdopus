import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'
import { z } from 'zod'
import tryParseEnv from './app/lib/try-parse-env'

const DrizzleEnvSchema = z.object({
  DATABASE_URL: z.string(),
})

tryParseEnv(DrizzleEnvSchema)
const drizzleEnv = DrizzleEnvSchema.parse(process.env)

export default defineConfig({
  out: './drizzle',
  schema: ['./app/lib/db/schema/*.ts'],
  dialect: 'postgresql',
  dbCredentials: {
    url: drizzleEnv.DATABASE_URL,
  },
})
