import 'dotenv/config'
import { Client } from 'pg'
import env from '../../app/lib/env'

async function main() {
  const client = new Client({ connectionString: env.DATABASE_URL })
  await client.connect()

  await client.query('drop schema if exists public cascade;')
  await client.query('create schema public;')

  await client.end()
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[db:reset] Failed to reset public schema', err)
  process.exitCode = 1
})
