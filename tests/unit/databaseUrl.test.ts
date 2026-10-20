import { describe, expect, it } from 'vitest'
import { resolveDatabaseUrl } from '../../app/lib/env/env-database'

describe('resolveDatabaseUrl', () => {
  it('preserves an explicitly configured DATABASE_URL', () => {
    expect(resolveDatabaseUrl({
      DATABASE_URL: 'postgresql://explicit-host/custom',
    })).toBe('postgresql://explicit-host/custom')
  })

  it('builds a URL from PostgreSQL variables with Docker Compose defaults', () => {
    expect(resolveDatabaseUrl({
      POSTGRES_USER: 'root',
      POSTGRES_PASSWORD: 'pass',
      POSTGRES_DB: 'mydb',
      POSTGRES_PORT: '5432',
    })).toBe('postgresql://root:pass@db:5432/mydb')
  })

  it('uses an explicit host and safely encodes credentials', () => {
    expect(resolveDatabaseUrl({
      POSTGRES_USER: 'user@municipality',
      POSTGRES_PASSWORD: 'p@ss/word',
      POSTGRES_DB: 'ledger',
      POSTGRES_HOST: 'postgres.internal',
      POSTGRES_PORT: '5433',
    })).toBe('postgresql://user%40municipality:p%40ss%2Fword@postgres.internal:5433/ledger')
  })

  it('reports required variables when neither URL nor credentials are configured', () => {
    expect(() => resolveDatabaseUrl({})).toThrow(
      'Cannot construct DATABASE_URL; missing required value:\nPOSTGRES_USER',
    )
  })

  it('rejects invalid host or port settings', () => {
    expect(() => resolveDatabaseUrl({
      POSTGRES_USER: 'root',
      POSTGRES_PASSWORD: 'pass',
      POSTGRES_DB: 'mydb',
      POSTGRES_PORT: 'invalid',
    })).toThrow('Invalid POSTGRES_HOST or POSTGRES_PORT')
  })
})
