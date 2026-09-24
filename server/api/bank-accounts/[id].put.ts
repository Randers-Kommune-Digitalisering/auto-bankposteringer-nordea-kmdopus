import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { and, eq, inArray } from 'drizzle-orm'
import db from '~/lib/db'
import { account } from '~/lib/db/schema/account'
import { bankingAgreementAccountAllowlist } from '~/lib/db/schema/bankingAgreementAccountAllowlist'
import { bankingAgreementAccountDimension } from '~/lib/db/schema/bankingAgreementAccountDimension'
import { logger } from '~/lib/logger'
import { retryRunsAfterAccountChange } from '~~/server/utils/recovery/retryRunsAfterAccountChange'
import { purgeIgnoredAccountTransactions } from '~~/server/utils/recovery/purgeIgnoredAccountTransactions'
import { requireWriteAccess } from '~~/server/auth/requireAppRoles'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  statuskonto: z.string().trim().min(1).max(32).optional(),
  ignoreIngestion: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  await requireWriteAccess(event)
  const log = logger.child({ scope: 'api.bank-accounts.update' })
  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Manglende konto-id' })
  }

  const body = await readBody(event)

  let payload
  try {
    payload = updateSchema.parse(body)
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error?.message ?? 'Ugyldigt input' })
  }

  const rows = await db
    .select({ id: account.id, provider: account.provider, iban: account.iban })
    .from(account)
    .where(eq(account.id, id))
    .limit(1)

  const existing = rows[0] ?? null
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Bankkonto ikke fundet' })
  }

  const normalizedStatuskonto = typeof payload.statuskonto === 'string' ? payload.statuskonto.trim() : undefined

  const updated = await db.transaction(async (trx) => {
    if (typeof payload.name !== 'undefined') {
      await trx.update(account).set({ name: payload.name }).where(eq(account.id, id))

      // Keep configured allowlist name in sync when the account is both observed and configured.
      await trx
        .update(bankingAgreementAccountAllowlist)
        .set({ name: payload.name, updatedAt: new Date() } as any)
        .where(and(
          eq(bankingAgreementAccountAllowlist.provider, existing.provider as any),
          eq(bankingAgreementAccountAllowlist.iban, existing.iban),
        ))
    }

    if (typeof normalizedStatuskonto !== 'undefined' && normalizedStatuskonto.length > 0) {
      await trx
        .insert(bankingAgreementAccountDimension)
        .values({
          provider: existing.provider as any,
          iban: existing.iban,
          dimensionKey: 'statuskonto',
          dimensionValue: normalizedStatuskonto,
          updatedAt: new Date(),
        } as any)
        .onConflictDoUpdate({
          target: [
            bankingAgreementAccountDimension.provider,
            bankingAgreementAccountDimension.iban,
            bankingAgreementAccountDimension.dimensionKey,
          ],
          set: { dimensionValue: normalizedStatuskonto, updatedAt: new Date() } as any,
        })
    }

    if (typeof payload.ignoreIngestion === 'boolean') {
      await trx
        .insert(bankingAgreementAccountDimension)
        .values({
          provider: existing.provider as any,
          iban: existing.iban,
          dimensionKey: 'ignore_ingestion',
          dimensionValue: payload.ignoreIngestion ? 'true' : 'false',
          updatedAt: new Date(),
        } as any)
        .onConflictDoUpdate({
          target: [
            bankingAgreementAccountDimension.provider,
            bankingAgreementAccountDimension.iban,
            bankingAgreementAccountDimension.dimensionKey,
          ],
          set: {
            dimensionValue: payload.ignoreIngestion ? 'true' : 'false',
            updatedAt: new Date(),
          } as any,
        })

      if (payload.ignoreIngestion) {
        await purgeIgnoredAccountTransactions(trx, id)
      }
    }

    const [base] = await trx
      .select({
        id: account.id,
        name: account.name,
        provider: account.provider,
        iban: account.iban,
        currency: account.currency,
      })
      .from(account)
      .where(eq(account.id, id))
      .limit(1)

    if (!base) return base as any

    const dims = await trx
      .select({ key: bankingAgreementAccountDimension.dimensionKey, value: bankingAgreementAccountDimension.dimensionValue })
      .from(bankingAgreementAccountDimension)
      .where(and(
        eq(bankingAgreementAccountDimension.provider, base.provider as any),
        eq(bankingAgreementAccountDimension.iban, base.iban),
        inArray(bankingAgreementAccountDimension.dimensionKey, ['artskonto', 'statuskonto', 'ignore_ingestion']),
      ))

    const statuskonto = (() => {
      const preferred = dims.find((d) => String(d.key) === 'artskonto')
      if (preferred?.value) return String(preferred.value)
      const legacy = dims.find((d) => String(d.key) === 'statuskonto')
      if (legacy?.value) return String(legacy.value)
      return null
    })()

    const ignoreIngestion = (() => {
      const raw = dims.find((d) => String(d.key) === 'ignore_ingestion')?.value
      if (raw == null) return false
      return /^(1|true|yes)$/i.test(String(raw).trim())
    })()

    return { ...base, statuskonto, artskonto: statuskonto, ignoreIngestion }
  })

  const storage = useStorage('bank-accounts')
  await storage.removeItem('list')

  const recoveryReason = payload.ignoreIngestion === true
    ? 'account-ignored'
    : normalizedStatuskonto
      ? 'account-mapping'
      : null

  if (recoveryReason) {
    try {
      const provider = String(existing.provider ?? '').toLowerCase()
      if (provider === 'danskebank' || provider === 'nordea' || provider === 'bankconnect') {
        await retryRunsAfterAccountChange({
          provider,
          iban: String(existing.iban ?? ''),
          reason: recoveryReason,
        })
      }
    } catch (error) {
      log.warn('Auto-retry efter kontoændring fejlede', {
        accountId: id,
        provider: existing.provider,
        err: error,
      })
    }
  }

  return { success: true, account: updated }
})
