import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import { bankingAgreement, bankProviderValues } from '~/lib/db/schema/bankingAgreement'
import { ZodError } from 'zod'

import { loadDanskeBankEdiEnvConfig } from '~/../engine/banking-ingestion/infrastructure/danskebank/danskeBankEdiEnvConfig'
import { loadDanskeBankEnvSecrets } from '~/../engine/banking-ingestion/infrastructure/danskebank/danskeBankEnvSecrets'
import { loadNordeaCorporateAccessEnvConfig } from '~/../engine/banking-ingestion/infrastructure/nordea/nordeaCorporateAccessEnvConfig'
import { loadNordeaEnvSecrets } from '~/../engine/banking-ingestion/infrastructure/nordea/nordeaEnvSecrets'

const bodySchema = z.object({
  enabled: z.boolean(),
})

function formatEnvValidationError(err: unknown): string {
  if (err instanceof ZodError) {
    const keys = err.issues
      .map((i) => (i.path.length ? i.path.map(String).join('.') : '(root)'))
      .filter(Boolean)
    return `Manglende/ugyldige env vars: ${Array.from(new Set(keys)).join(', ')}`
  }
  const msg = String((err as any)?.message ?? err)
  return msg || 'Ugyldig env-konfiguration'
}

function validateProviderEnvOrThrow(provider: string): void {
  if (provider === 'danskebank') {
    loadDanskeBankEdiEnvConfig()
    loadDanskeBankEnvSecrets()
    return
  }
  if (provider === 'nordea') {
    loadNordeaCorporateAccessEnvConfig()
    loadNordeaEnvSecrets()
    return
  }
  if (provider === 'bankconnect') {
    throw new Error('BankConnect er ikke implementeret endnu')
  }
}

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

  if (parsed.data.enabled === true) {
    try {
      validateProviderEnvOrThrow(provider)
    } catch (err) {
      throw createError({ statusCode: 400, statusMessage: formatEnvValidationError(err) })
    }
  }

  const [updated] = await db
    .update(bankingAgreement)
    .set({ enabled: parsed.data.enabled, updatedAt: new Date() })
    .where(eq(bankingAgreement.provider, provider as any))
    .returning()

  if (!updated) {
    // If row doesn't exist yet, create it.
    const [inserted] = await db
      .insert(bankingAgreement)
      .values({ provider: provider as any, enabled: parsed.data.enabled })
      .returning()

    return { success: true, agreement: inserted }
  }

  return { success: true, agreement: updated }
})
