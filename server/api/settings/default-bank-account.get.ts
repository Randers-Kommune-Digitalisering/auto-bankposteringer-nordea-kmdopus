import { eq } from 'drizzle-orm'
import { setHeader } from 'h3'
import db from '~/lib/db'
import { tenantConfiguration } from '~/lib/db/schema/rule'

const TENANT_CONFIG_ID = 1

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const [configuration] = await db
    .select({ defaultBankAccountId: tenantConfiguration.defaultBankAccountId })
    .from(tenantConfiguration)
    .where(eq(tenantConfiguration.id, TENANT_CONFIG_ID))
    .limit(1)

  return { defaultBankAccountId: configuration?.defaultBankAccountId ?? null }
})