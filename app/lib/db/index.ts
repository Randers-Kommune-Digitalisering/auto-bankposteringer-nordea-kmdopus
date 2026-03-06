import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg'
import env from '../env';
import * as accountSchema from './schema/account'
import * as bankingSchema from './schema/banking'
import * as documentSchema from './schema/document'
import * as enumsSchema from './schema/enums'
import * as erpSchema from './schema/erp'
import * as errorSchema from './schema/error'
import * as jobSchema from './schema/job'
import * as outboxSchema from './schema/outbox'
import * as relationsSchema from './schema/relations'
import * as ruleSchema from './schema/rule'
import * as ruleTagSchema from './schema/ruleTag'
import * as ruleVersionSchema from './schema/ruleVersion'
import * as runSchema from './schema/run'
import * as statementSchema from './schema/statement'
import * as transactionSchema from './schema/transaction'
import * as bankingAdapterCursorSchema from './schema/bankingAdapterCursor'

const schema = {
  ...accountSchema,
  ...bankingSchema,
  ...documentSchema,
  ...enumsSchema,
  ...erpSchema,
  ...errorSchema,
  ...jobSchema,
  ...outboxSchema,
  ...relationsSchema,
  ...ruleSchema,
  ...ruleTagSchema,
  ...ruleVersionSchema,
  ...runSchema,
  ...statementSchema,
  ...transactionSchema,
  ...bankingAdapterCursorSchema,
} as const


const pool = new Pool({
  connectionString: env.DATABASE_URL
})

const db = drizzle(pool, { schema })

export default db