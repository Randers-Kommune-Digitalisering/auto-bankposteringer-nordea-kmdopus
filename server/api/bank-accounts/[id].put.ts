import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { and, eq, inArray, sql } from 'drizzle-orm'
import db from '~/lib/db'
import { account } from '~/lib/db/schema/account'
import { bankingAgreementAccountAllowlist } from '~/lib/db/schema/bankingAgreementAccountAllowlist'
import { bankingAgreementAccountDimension } from '~/lib/db/schema/bankingAgreementAccountDimension'
import { erpRequestLine } from '~/lib/db/schema/erp'
import { manualBookingDraft } from '~/lib/db/schema/manualBookingDraft'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'
import { requireWriteAccess } from '~~/server/auth/requireAppRoles'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  statuskonto: z.string().trim().min(1).max(32).optional(),
  ignoreIngestion: z.boolean().optional(),
  // Legacy input
  artskonto: z.string().trim().min(1).max(32).optional(),
})

export default defineEventHandler(async (event) => {
  await requireWriteAccess(event)
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

    const incomingStatuskonto = (payload.statuskonto ?? payload.artskonto)
    if (typeof incomingStatuskonto !== 'undefined') {
      await trx
        .insert(bankingAgreementAccountDimension)
        .values({
          provider: existing.provider as any,
          iban: existing.iban,
          dimensionKey: 'statuskonto',
          dimensionValue: incomingStatuskonto,
          updatedAt: new Date(),
        } as any)
        .onConflictDoUpdate({
          target: [
            bankingAgreementAccountDimension.provider,
            bankingAgreementAccountDimension.iban,
            bankingAgreementAccountDimension.dimensionKey,
          ],
          set: { dimensionValue: incomingStatuskonto, updatedAt: new Date() } as any,
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
        const accountTxRows = await trx
          .select({ id: transaction.id })
          .from(transaction)
          .where(eq(transaction.accountId, id))

        const accountTxIds = accountTxRows.map((row) => row.id)
        if (accountTxIds.length > 0) {
          await trx.delete(transactionProcessing).where(inArray(transactionProcessing.transactionId, accountTxIds))
          await trx.delete(manualBookingDraft).where(inArray(manualBookingDraft.transactionId, accountTxIds))
          await trx.delete(erpRequestLine).where(inArray(erpRequestLine.transactionId, accountTxIds))
          await trx.delete(transaction).where(inArray(transaction.id, accountTxIds))
        }

        // Keep statement/document storage clean after account-level purge.
        await trx.execute(sql`
          delete from banking_statement_balance b
          where exists (
            select 1
            from banking_statement s
            where s.id = b.statement_id
              and not exists (
                select 1 from "transaction" t where t.statement_id = s.id
              )
          )
        `)

        await trx.execute(sql`
          delete from banking_statement s
          where not exists (
            select 1 from "transaction" t where t.statement_id = s.id
          )
        `)

        await trx.execute(sql`
          delete from banking_document d
          where not exists (
            select 1 from banking_statement s where s.document_id = d.id
          )
        `)
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
        inArray(bankingAgreementAccountDimension.dimensionKey, ['statuskonto', 'artskonto', 'ignore_ingestion']),
      ))

    const statuskonto = (() => {
      const preferred = dims.find((d) => String(d.key) === 'statuskonto')
      if (preferred?.value) return String(preferred.value)
      const legacy = dims.find((d) => String(d.key) === 'artskonto')
      if (legacy?.value) return String(legacy.value)
      return null
    })()

    const ignoreIngestion = (() => {
      const raw = dims.find((d) => String(d.key) === 'ignore_ingestion')?.value
      if (raw == null) return false
      return /^(1|true|yes)$/i.test(String(raw).trim())
    })()

    return { ...base, statuskonto, ignoreIngestion }
  })

  const storage = useStorage('bank-accounts')
  await storage.removeItem('list')

  return { success: true, account: updated }
})
