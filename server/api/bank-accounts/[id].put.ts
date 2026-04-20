import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { and, eq, inArray } from 'drizzle-orm'
import db from '~/lib/db'
import { account } from '~/lib/db/schema/account'
import { bankingAgreementAccountDimension } from '~/lib/db/schema/bankingAgreementAccountDimension'
import { requireRoles } from '~~/server/auth/keycloakAuth'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  statuskonto: z.string().trim().min(1).max(32).optional(),
  // Legacy input
  artskonto: z.string().trim().min(1).max(32).optional(),
})

export default defineEventHandler(async (event) => {
  await requireRoles(event, ['write'])
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
        inArray(bankingAgreementAccountDimension.dimensionKey, ['statuskonto', 'artskonto']),
      ))

    const statuskonto = (() => {
      const preferred = dims.find((d) => String(d.key) === 'statuskonto')
      if (preferred?.value) return String(preferred.value)
      const legacy = dims.find((d) => String(d.key) === 'artskonto')
      if (legacy?.value) return String(legacy.value)
      return null
    })()

    return { ...base, statuskonto }
  })

  const storage = useStorage('bank-accounts')
  await storage.removeItem('list')

  return { success: true, account: updated }
})
