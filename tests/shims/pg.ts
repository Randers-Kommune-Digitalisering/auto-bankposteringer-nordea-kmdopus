import PgPoolImport from 'pg-pool'
import Client from 'pg/lib/client'
import defaults from 'pg/lib/defaults'
import Connection from 'pg/lib/connection'
import Result from 'pg/lib/result'
import TypeOverrides from 'pg/lib/type-overrides'
import pgTypes from 'pg-types'
import { DatabaseError } from 'pg-protocol'
import { escapeIdentifier, escapeLiteral } from 'pg/lib/utils'
import * as utils from 'pg/lib/utils'

type PgPoolCtor = new (options?: unknown, client?: unknown) => {
  connect: (...args: unknown[]) => unknown
  end: (...args: unknown[]) => unknown
}

const PoolBase = ((PgPoolImport as any).default ?? PgPoolImport) as PgPoolCtor

export class Pool extends PoolBase {
  constructor(options?: unknown) {
    super(options, Client as any)
  }
}

export {
  Client,
  Connection,
  Result,
  TypeOverrides,
  DatabaseError,
  defaults,
  escapeIdentifier,
  escapeLiteral,
  utils,
}

export const Query = (Client as any).Query
export const types = pgTypes

const pg = {
  Client,
  Connection,
  Result,
  TypeOverrides,
  DatabaseError,
  defaults,
  escapeIdentifier,
  escapeLiteral,
  Query,
  Pool,
  types,
  utils,
}

export default pg
