import 'dotenv/config'
import { Client } from 'pg'
import env from '../../app/lib/env/env'

async function main() {
  const client = new Client({ connectionString: env.DATABASE_URL })
  await client.connect()

  // Drizzle-kit stores migration state in a separate schema by default.
  // If we only drop `public`, drizzle will think migrations already ran,
  // and the domain tables won't be recreated.
  await client.query('drop schema if exists drizzle cascade;')
  await client.query('drop schema if exists public cascade;')
  await client.query('create schema public;')

  await client.end()
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[db:reset] Failed to reset public schema', err)
  process.exitCode = 1
})
