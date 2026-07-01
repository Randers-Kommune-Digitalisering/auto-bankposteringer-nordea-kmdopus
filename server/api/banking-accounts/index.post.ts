import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import db from '~/lib/db'
import { ibanSchema } from '~~/utils/schema'
import { account } from '~/lib/db/schema/account'
import { bankingAgreement } from '~/lib/db/schema/bankingAgreement'
import { bankingAgreementAccountAllowlist } from '~/lib/db/schema/bankingAgreementAccountAllowlist'
import { bankingAgreementAccountDimension } from '~/lib/db/schema/bankingAgreementAccountDimension'
import { getActiveErpSupplier, listAccountingDimensionDefinitions } from '~~/server/utils/accountingDimensions'

function normalizeIban(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase()
}

const bodySchema = z.object({
  provider: z.enum(['danskebank', 'nordea', 'bankconnect']),
  iban: ibanSchema,
  statuskonto: z.string().trim().min(1).max(32).optional(),
  name: z.string().trim().min(1).max(80).optional(),
  ignoreIngestion: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.message })
  }

  const provider = parsed.data.provider
  const iban = normalizeIban(parsed.data.iban)
  const statuskonto = (parsed.data.statuskonto ?? '').trim() || null
  const name = parsed.data.name?.trim().length ? parsed.data.name.trim() : null
  const ignoreIngestion = Boolean(parsed.data.ignoreIngestion)

  // Validate statuskonto format against active ERP dimension definitions (data-driven).
  const supplier = await getActiveErpSupplier()
  const definitions = await listAccountingDimensionDefinitions(supplier)
  const statuskontoDef = definitions.find((d) => d.key === 'statuskonto')
  if (statuskonto && statuskontoDef?.valueRegex) {
    let re: RegExp
    try {
      re = new RegExp(statuskontoDef.valueRegex, statuskontoDef.valueRegexFlags ?? '')
    } catch {
      throw createError({ statusCode: 500, statusMessage: `Ugyldig ERP-regex for statuskonto (${supplier})` })
    }
    if (!re.test(statuskonto)) {
      throw createError({ statusCode: 400, statusMessage: 'Ugyldigt format for statuskonto (valideres mod ERP)' })
    }
  }

  const valid = ibanSchema.safeParse(iban)
  if (!valid.success) {
    throw createError({ statusCode: 400, statusMessage: valid.error.issues[0]?.message ?? 'Ugyldig IBAN' })
  }

  const [agreement] = await db
    .select({ enabled: bankingAgreement.enabled, channel: bankingAgreement.channel })
    .from(bankingAgreement)
    .where(eq(bankingAgreement.provider, provider as any))
    .limit(1)

  if (!agreement) {
    throw createError({ statusCode: 409, statusMessage: 'Bankaftalen findes ikke endnu' })
  }

  if (String(agreement.channel) !== 'rest') {
    throw createError({ statusCode: 409, statusMessage: 'Aftalen er ikke sat til REST API' })
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
        .values({ provider: provider as any, iban, dimensionKey: 'statuskonto', dimensionValue: statuskonto, updatedAt: new Date() } as any)
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

  return { success: true }
})
