import 'dotenv/config'
import { Client } from 'pg'
import env from '../../app/lib/env/env'

const tablesToClear = [
  { name: 'run_timeline_event' },
  { name: 'manual_booking_draft_line_dimension' },
  { name: 'manual_booking_draft_line' },
  { name: 'manual_booking_draft_attachment' },
  { name: 'manual_booking_draft' },
  { name: 'manual_booking_group_draft_line_dimension' },
  { name: 'manual_booking_group_draft_line' },
  { name: 'manual_booking_group_draft_attachment' },
  { name: 'manual_booking_group_draft' },
  { name: 'booking_period_rebooking_audit' },
  { name: 'transaction_reference' },
  { name: 'transaction_party' },
  { name: 'erp_request_line' },
  { name: 'erp_document_transaction' },
  { name: 'erp_response_document' },
  { name: 'erp_response' },
  { name: 'erp_request', clearSelfReferences: true },
  { name: 'erp_document' },
  { name: 'transaction_processing' },
  { name: 'transaction' },
  { name: 'banking_statement_balance' },
  { name: 'banking_statement' },
  { name: 'banking_document' },
  { name: 'document' },
  { name: 'error', where: 'run_id IS NOT NULL' },
  { name: 'banking_response' },
  { name: 'banking_request' },
  { name: 'job', where: 'run_id IS NOT NULL' },
  { name: 'outbox', where: 'run_id IS NOT NULL' },
  { name: 'run' },
  { name: 'banking_adapter_cursor' },
  { name: 'banking_agreement_cursor' },
  { name: 'banking_reference' },
  { name: 'banking_party' },
  { name: 'banking_tx_code' },
  { name: 'banking_payload' },
] as const

function getArgument(name: string): string | undefined {
  const prefix = `${name}=`
  const argument = process.argv.find(value => value.startsWith(prefix))
  return argument?.slice(prefix.length)
}

function assertExplicitTarget(expectedDatabase: string | undefined): void {
  if (!process.argv.includes('--execute')) {
    throw new Error('No data was changed. Pass --execute to run this destructive cleanup.')
  }
  if (!process.argv.includes('--confirm-delete-bank-derived-data')) {
    throw new Error('Missing explicit confirmation: --confirm-delete-bank-derived-data')
  }
  if (process.env.ALLOW_DESTRUCTIVE_BANKING_DATA_CLEANUP !== '1') {
    throw new Error('Set ALLOW_DESTRUCTIVE_BANKING_DATA_CLEANUP=1 to enable this cleanup.')
  }
  if (!expectedDatabase) {
    throw new Error('Pass --expected-database=<name> to explicitly identify the target database.')
  }
  if (process.env.NODE_ENV === 'production' || /^(prod|production)$/i.test(process.env.APP_ENV ?? '')) {
    throw new Error('Refusing to clear bank-derived data in a production environment.')
  }
  if (/(^|[-_])(prod|production)([-_]|$)/i.test(expectedDatabase)) {
    throw new Error('Refusing to target a database name that appears to be production.')
  }
}

async function main(): Promise<void> {
  const expectedDatabase = getArgument('--expected-database')
  assertExplicitTarget(expectedDatabase)

  const client = new Client({ connectionString: env.DATABASE_URL })
  await client.connect()

  try {
    const identity = await client.query<{ database_name: string }>(
      'select current_database() as database_name',
    )
    const databaseName = identity.rows[0]?.database_name
    if (!databaseName || databaseName !== expectedDatabase) {
      throw new Error(`Connected database did not match --expected-database (${expectedDatabase}).`)
    }

    await client.query('BEGIN')
    const discoveryRunsExist = await client.query<{ relation: string | null }>(
      'select to_regclass($1) as relation',
      ['public.banking_agreement_discovery_run'],
    )
    const jobsExist = await client.query<{ relation: string | null }>(
      'select to_regclass($1) as relation',
      ['public.job'],
    )
    if (discoveryRunsExist.rows[0]?.relation && jobsExist.rows[0]?.relation) {
      await client.query(`
        UPDATE public.banking_agreement_discovery_run
        SET job_id = NULL
        WHERE job_id IN (SELECT id FROM public.job WHERE run_id IS NOT NULL)
      `)
    }

    const deleted: Array<{ table: string; count: number }> = []
    for (const table of tablesToClear) {
      const exists = await client.query<{ relation: string | null }>(
        'select to_regclass($1) as relation',
        [`public.${table.name}`],
      )
      if (!exists.rows[0]?.relation) continue

      if ('clearSelfReferences' in table && table.clearSelfReferences) {
        await client.query(`UPDATE public."${table.name}" SET source_request_id = NULL WHERE source_request_id IS NOT NULL`)
      }

      const result = await client.query(
        `DELETE FROM public."${table.name}"${'where' in table ? ` WHERE ${table.where}` : ''}`,
      )
      deleted.push({ table: table.name, count: result.rowCount ?? 0 })
    }
    await client.query('COMMIT')

    // Print counts only; no bank data, identifiers, connection details, or payloads.
    for (const row of deleted) {
      console.info(`[db:clear-bank-data] ${row.table}: ${row.count}`)
    }
    console.info(`[db:clear-bank-data] Cleared run-scoped data in database ${databaseName}.`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('[db:clear-bank-data] Failed to clear bank-derived data', error)
  process.exitCode = 1
})
