import { asc } from 'drizzle-orm'
import { setHeader } from 'h3'
import { account } from '~/lib/db/schema/index'
import db from '~/lib/db'

export default defineEventHandler(async (event) => {
  const accounts = await db.select().from(account).orderBy(asc(account.id))

  return accounts
})
