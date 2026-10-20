import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'
import dbEnv from './app/lib/env/env-database'

export default defineConfig({
  out: './drizzle',
  schema: ['./app/lib/db/schema/*.ts'],
  dialect: 'postgresql',
  dbCredentials: {
    url: dbEnv.DATABASE_URL,
  },
})
