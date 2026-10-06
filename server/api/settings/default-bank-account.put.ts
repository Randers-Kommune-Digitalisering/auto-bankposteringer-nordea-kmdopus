import { and, eq } from 'drizzle-orm'
import { createError, readBody, setHeader } from 'h3'
import { z } from 'zod'
import db from '~/lib/db'
import { account } from '~/lib/db/schema/account'
import { bankingAgreementAccountDimension } from '~/lib/db/schema/bankingAgreementAccountDimension'
import { tenantConfiguration } from '~/lib/db/schema/rule'
import { requireWriteAccess } from '~~/server/auth/requireAppRoles'

const TENANT_CONFIG_ID = 1
const bodySchema = z.object({ defaultBankAccountId: z.string().min(1).nullable() })

export default defineEventHandler(async (event) => {
  await requireWriteAccess(event)
  setHeader(event, 'Cache-Control', 'no-store')

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.message })
  }

  const { defaultBankAccountId } = parsed.data
  if (defaultBankAccountId) {
    const [selectedAccount] = await db
      .select({ provider: account.provider, iban: account.iban })
      .from(account)
      .where(eq(account.id, defaultBankAccountId))
      .limit(1)

    if (!selectedAccount) {
      throw createError({ statusCode: 400, statusMessage: 'Bankkontoen findes ikke' })
    }

    const [ingestionSetting] = await db
      .select({ dimensionValue: bankingAgreementAccountDimension.dimensionValue })
      .from(bankingAgreementAccountDimension)
      .where(and(
        eq(bankingAgreementAccountDimension.provider, selectedAccount.provider),
        eq(bankingAgreementAccountDimension.iban, selectedAccount.iban),
        eq(bankingAgreementAccountDimension.dimensionKey, 'ignore_ingestion'),
      ))
      .limit(1)

    if (/^(1|true|yes)$/i.test(ingestionSetting?.dimensionValue?.trim() ?? '')) {
      throw createError({ statusCode: 400, statusMessage: 'Bankkontoen er markeret til at blive ignoreret' })
    }
  }

  const [configuration] = await db
    .update(tenantConfiguration)
    .set({ defaultBankAccountId })
    .where(eq(tenantConfiguration.id, TENANT_CONFIG_ID))
    .returning({ defaultBankAccountId: tenantConfiguration.defaultBankAccountId })

  if (!configuration) {
    throw createError({ statusCode: 500, statusMessage: 'Tenant-konfigurationen mangler' })
  }

  return { defaultBankAccountId: configuration.defaultBankAccountId }
})