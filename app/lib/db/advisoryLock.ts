import type { PoolClient } from 'pg'
import { pool } from './index'

/**
 * Postgres advisory locks.
 *
 * We use a dedicated DB connection because advisory locks are connection-scoped.
 * This is used to guard scheduled enqueue steps against accidental multi-replica schedulers.
 */

export async function withPgAdvisoryLock<T>(
  lockName: string,
  fn: () => Promise<T>,
): Promise<{ acquired: true; result: T } | { acquired: false }> {
  const client: PoolClient = await pool.connect()
  try {
    const res = await client.query<{ acquired: boolean }>(
      'select pg_try_advisory_lock(hashtext($1)) as acquired',
      [lockName],
    )

    const acquired = Boolean(res.rows?.[0]?.acquired)
    if (!acquired) return { acquired: false }

    try {
      const result = await fn()
      return { acquired: true, result }
    } finally {
      await client.query('select pg_advisory_unlock(hashtext($1))', [lockName])
    }
  } finally {
    client.release()
  }
}
