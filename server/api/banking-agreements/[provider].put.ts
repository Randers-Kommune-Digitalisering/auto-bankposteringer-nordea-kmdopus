import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import { bankingAgreement, bankProviderValues, bankChannelValues } from '~/lib/db/schema/bankingAgreement'
import { ZodError } from 'zod'

import { loadDanskeBankEdiEnvConfig } from '~/../engine/banking-ingestion/infrastructure/danskebank/danskeBankEdiEnvConfig'
import { loadDanskeBankEnvSecrets } from '~/../engine/banking-ingestion/infrastructure/danskebank/danskeBankEnvSecrets'
import { loadNordeaCorporateAccessEnvConfig } from '~/../engine/banking-ingestion/infrastructure/nordea/nordeaCorporateAccessEnvConfig'
import { loadNordeaEnvSecrets } from '~/../engine/banking-ingestion/infrastructure/nordea/nordeaEnvSecrets'

const bodySchema = z
  .object({
    enabled: z.boolean().optional(),
    channel: z.enum(bankChannelValues).optional(),
  })
  .refine((v) => typeof v.enabled === 'boolean' || typeof v.channel === 'string', {
    message: 'Body skal indeholde enabled og/eller channel',
  })

function extractEnvKeysFromMessage(message: string): string[] {
  const tokens = message.match(/[A-Z][A-Z0-9_]{2,}/g) ?? []
  return Array.from(new Set(tokens.filter((t) => t.includes('_'))))
}

function extractKeysFromZod(err: ZodError): string[] {
  const keys: string[] = []
  for (const issue of err.issues) {
    if (issue.path.length) {
      keys.push(issue.path.map(String).join('.'))
      continue
    }
    if (issue.message) {
      keys.push(...extractEnvKeysFromMessage(issue.message))
    }
  }
  return Array.from(new Set(keys)).filter(Boolean)
}

function formatEnvValidationError(err: unknown): string {
  if (err instanceof ZodError) {
    const keys = extractKeysFromZod(err)
    if (keys.length) return `Manglende/ugyldige env vars: ${keys.join(', ')}`
    return 'Manglende/ugyldige env vars'
  }
  const msg = String((err as any)?.message ?? err)
  return msg || 'Ugyldig env-konfiguration'
}

function validateProviderEnvOrThrow(provider: string, channel: (typeof bankChannelValues)[number]): void {
  if (channel === 'rest') {
    if (provider === 'nordea') {
      throw new Error('Nordea REST (Premium API) er ikke implementeret endnu')
    }
    if (provider === 'danskebank') {
      throw new Error('Danske Bank REST API er ikke implementeret endnu')
    }
    throw new Error('REST kanal er ikke implementeret endnu')
  }

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

  const existing = await db
    .select()
    .from(bankingAgreement)
    .where(eq(bankingAgreement.provider, provider as any))
    .limit(1)
    .then((rows) => rows[0] ?? null)

  const nextChannel = (parsed.data.channel ?? (existing?.channel as any) ?? 'iso20022') as (typeof bankChannelValues)[number]
  const nextEnabled = (typeof parsed.data.enabled === 'boolean' ? parsed.data.enabled : (existing?.enabled ?? false))

  if (nextEnabled === true) {
    try {
      validateProviderEnvOrThrow(provider, nextChannel)
    } catch (err) {
      throw createError({ statusCode: 400, statusMessage: formatEnvValidationError(err) })
    }
  }

  const updatePatch: Record<string, any> = { updatedAt: new Date() }
  if (typeof parsed.data.enabled === 'boolean') updatePatch.enabled = parsed.data.enabled
  if (typeof parsed.data.channel === 'string') updatePatch.channel = parsed.data.channel

  const [updated] = await db.update(bankingAgreement).set(updatePatch).where(eq(bankingAgreement.provider, provider as any)).returning()

  if (!updated) {
    // If row doesn't exist yet, create it.
    const insertValues: Record<string, any> = {
      provider: provider as any,
    }
    if (typeof parsed.data.enabled === 'boolean') insertValues.enabled = parsed.data.enabled
    if (typeof parsed.data.channel === 'string') insertValues.channel = parsed.data.channel

    const [inserted] = await db
      .insert(bankingAgreement)
      .values(insertValues as any)
      .returning()

    return { success: true, agreement: inserted }
  }

  return { success: true, agreement: updated }
})
