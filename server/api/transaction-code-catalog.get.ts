import { asc, eq } from 'drizzle-orm'
import { setHeader } from 'h3'
import { transactionCodeCatalog } from '~/lib/db/schema/transactionCodeCatalog'
import db from '~/lib/db'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const rows = await db
    .select({
      provider: transactionCodeCatalog.provider,
      codeKey: transactionCodeCatalog.codeKey,
      displayName: transactionCodeCatalog.displayName,
      domain: transactionCodeCatalog.domain,
      family: transactionCodeCatalog.family,
      subFamily: transactionCodeCatalog.subFamily,
      proprietary: transactionCodeCatalog.proprietary,
    })
    .from(transactionCodeCatalog)
    .where(eq(transactionCodeCatalog.isActive, true))
    .orderBy(asc(transactionCodeCatalog.displayName), asc(transactionCodeCatalog.codeKey))

  return rows
})
