import { defineEventHandler, readBody, createError } from 'h3'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { account } from '~/lib/db/schema/account'
import { bankingAgreementAccountAllowlist } from '~/lib/db/schema/bankingAgreementAccountAllowlist'
import { bankingAgreementAccountDimension } from '~/lib/db/schema/bankingAgreementAccountDimension'
import { tenantConfiguration } from '~/lib/db/schema/rule'
import { logger } from '~/lib/logger'
import { requireWriteAccess } from '~~/server/auth/requireAppRoles'
import { retryRunsAfterAccountChange } from '~~/server/utils/recovery/retryRunsAfterAccountChange'

const bodySchema = z.object({ ignoreIngestion: z.boolean() })

export default defineEventHandler(async (event) => {
  await requireWriteAccess(event)

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.message })
  }

  const ignoreIngestion = parsed.data.ignoreIngestion
  const [observedAccounts, configuredAccounts] = await Promise.all([
    db.select({ id: account.id, provider: account.provider, iban: account.iban }).from(account),
    db.select({ provider: bankingAgreementAccountAllowlist.provider, iban: bankingAgreementAccountAllowlist.iban })
      .from(bankingAgreementAccountAllowlist),
  ])

  const identities = new Map<string, { provider: 'danskebank' | 'nordea' | 'bankconnect'; iban: string }>()
  for (const row of [...observedAccounts, ...configuredAccounts]) {
    const provider = String(row.provider)
    const iban = String(row.iban)
    if (provider !== 'danskebank' && provider !== 'nordea' && provider !== 'bankconnect') continue
    identities.set(`${provider}:${iban}`, { provider, iban })
  }

  const accounts = Array.from(identities.values())
  const now = new Date()

  await db.transaction(async (trx) => {
    if (accounts.length) {
      await trx
        .insert(bankingAgreementAccountDimension)
        .values(accounts.map(({ provider, iban }) => ({
          provider,
          iban,
          dimensionKey: 'ignore_ingestion',
          dimensionValue: ignoreIngestion ? 'true' : 'false',
          updatedAt: now,
        })) as any)
        .onConflictDoUpdate({
          target: [
            bankingAgreementAccountDimension.provider,
            bankingAgreementAccountDimension.iban,
            bankingAgreementAccountDimension.dimensionKey,
          ],
          set: { dimensionValue: ignoreIngestion ? 'true' : 'false', updatedAt: now } as any,
        })
    }

    const observedAccountIds = observedAccounts.map(row => String(row.id))
    if (ignoreIngestion && observedAccountIds.length) {
      await trx
        .update(tenantConfiguration)
        .set({ defaultBankAccountId: null })
        .where(inArray(tenantConfiguration.defaultBankAccountId, observedAccountIds))
    }

  })

  await useStorage('bank-accounts').removeItem('list')

  if (ignoreIngestion) {
    const log = logger.child({ scope: 'api.banking-accounts.bulk-ignore' })
    for (const { provider, iban } of accounts) {
      try {
        await retryRunsAfterAccountChange({ provider, iban, reason: 'account-ignored' })
      } catch (error) {
        log.warn('Auto-retry efter samlet kontoændring fejlede', { provider, err: error })
      }
    }
  }

  return { success: true, ignoreIngestion, accountsUpdated: accounts.length }
})