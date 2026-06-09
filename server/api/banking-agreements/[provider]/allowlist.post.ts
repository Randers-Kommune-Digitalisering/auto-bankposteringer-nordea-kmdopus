import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'

import db from '~/lib/db'
import { account } from '~/lib/db/schema/account'
import { bankProviderValues } from '~/lib/db/schema/bankingAgreement'
import { bankingAgreementAccountAllowlist } from '~/lib/db/schema/bankingAgreementAccountAllowlist'
import { bankingAgreementAccountDimension } from '~/lib/db/schema/bankingAgreementAccountDimension'
import { getActiveErpSupplier } from '~~/server/utils/accountingDimensions'

function normalizeIban(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase()
}

const bodySchema = z.object({
  iban: z.string().min(1),
  name: z.string().trim().min(1).max(80).optional(),
  statuskonto: z.string().trim().min(1).max(32).optional(),
  ignoreIngestion: z.boolean().optional(),
  // Legacy input
  artskonto: z.string().trim().min(1).max(32).optional(),
})

const ibanSchema = z
  .string()
  .min(15)
  .max(34)
  .regex(/^[A-Z]{2}[0-9A-Z]{13,32}$/, 'Ugyldig IBAN format')

export default defineEventHandler(async (event) => {
  const provider = event.context.params?.provider
  if (!provider || !bankProviderValues.includes(provider as any)) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldig provider' })
  }

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.message })
  }

  const iban = normalizeIban(parsed.data.iban)
  const name = typeof parsed.data.name === 'string' && parsed.data.name.trim().length ? parsed.data.name.trim() : null
  const statuskonto = (parsed.data.statuskonto ?? parsed.data.artskonto ?? '').trim() || null
  const ignoreIngestion = Boolean(parsed.data.ignoreIngestion)

  const supplier = await getActiveErpSupplier()
  if (supplier === 'kmd' && statuskonto) {
    // KMD Opus: statuskonto attached to a bank account must be an artskonto: 905XXXXX.
    // (We keep this server-side so it remains deterministic and independent of UI.)
    if (!/^905\d{5}$/.test(statuskonto)) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Statuskonto skal være en artskonto i formatet 905XXXXX (kun tal efter 905)',
      })
    }
  }
  const valid = ibanSchema.safeParse(iban)
  if (!valid.success) {
    throw createError({ statusCode: 400, statusMessage: valid.error.issues[0]?.message ?? 'Ugyldig IBAN' })
  }

  await db.transaction(async (trx) => {
    await trx
      .insert(bankingAgreementAccountAllowlist)
      .values({ provider: provider as any, iban, name, updatedAt: new Date() } as any)
      .onConflictDoUpdate({
        target: [bankingAgreementAccountAllowlist.provider, bankingAgreementAccountAllowlist.iban],
        set: { name, updatedAt: new Date() } as any,
      })

    if (statuskonto) {
      await trx
        .insert(bankingAgreementAccountDimension)
        .values({
          provider: provider as any,
          iban,
          dimensionKey: 'statuskonto',
          dimensionValue: statuskonto,
          updatedAt: new Date(),
        } as any)
        .onConflictDoUpdate({
          target: [
            bankingAgreementAccountDimension.provider,
            bankingAgreementAccountDimension.iban,
            bankingAgreementAccountDimension.dimensionKey,
          ],
          set: { dimensionValue: statuskonto, updatedAt: new Date() } as any,
        })
    }

    await trx
      .insert(bankingAgreementAccountDimension)
      .values({
        provider: provider as any,
        iban,
        dimensionKey: 'ignore_ingestion',
        dimensionValue: ignoreIngestion ? 'true' : 'false',
        updatedAt: new Date(),
      } as any)
      .onConflictDoUpdate({
        target: [
          bankingAgreementAccountDimension.provider,
          bankingAgreementAccountDimension.iban,
          bankingAgreementAccountDimension.dimensionKey,
        ],
        set: { dimensionValue: ignoreIngestion ? 'true' : 'false', updatedAt: new Date() } as any,
      })

    if (name) {
      await trx
        .update(account)
        .set({ name })
        .where(and(
          eq(account.provider, provider as any),
          eq(account.iban, iban),
        ))
    }
  })

  const rows = await db
    .select()
    .from(bankingAgreementAccountAllowlist)
    .where(eq(bankingAgreementAccountAllowlist.provider, provider as any))

  return rows
})
