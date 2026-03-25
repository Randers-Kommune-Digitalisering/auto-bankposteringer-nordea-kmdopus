import { asc } from 'drizzle-orm'
import db from '~/lib/db'
import { bankingAgreement, bankProviderValues } from '~/lib/db/schema/bankingAgreement'
import { ZodError } from 'zod'

import { loadDanskeBankEdiEnvConfig } from '~/../engine/banking-ingestion/infrastructure/danskebank/danskeBankEdiEnvConfig'
import { loadDanskeBankEnvSecrets } from '~/../engine/banking-ingestion/infrastructure/danskebank/danskeBankEnvSecrets'
import { loadNordeaCorporateAccessEnvConfig } from '~/../engine/banking-ingestion/infrastructure/nordea/nordeaCorporateAccessEnvConfig'
import { loadNordeaEnvSecrets } from '~/../engine/banking-ingestion/infrastructure/nordea/nordeaEnvSecrets'

type Readiness =
  | { status: 'ready' }
  | { status: 'not_configured'; message: string }
  | { status: 'missing_env'; message: string; missingKeys: string[] }
  | { status: 'not_implemented'; message: string }

function nonEmpty(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function envHasAnyPrefix(prefix: string): boolean {
  for (const [k, v] of Object.entries(process.env)) {
    if (!k.startsWith(prefix)) continue
    if (nonEmpty(v)) return true
  }
  return false
}

function formatMissingFromZod(err: ZodError): string[] {
  return Array.from(
    new Set(
      err.issues
        .map((i) => (i.path.length ? i.path.map(String).join('.') : '(root)'))
        .filter(Boolean),
    ),
  )
}

function computeProviderReadiness(provider: string): Readiness {
  if (provider === 'danskebank') {
    if (!envHasAnyPrefix('DANSKE_BANK_')) {
      return { status: 'not_configured', message: 'Ingen DANSKE_BANK_* env vars sat' }
    }
    try {
      loadDanskeBankEdiEnvConfig()
      loadDanskeBankEnvSecrets()
      return { status: 'ready' }
    } catch (err) {
      if (err instanceof ZodError) {
        const missingKeys = formatMissingFromZod(err)
        return {
          status: 'missing_env',
          message: 'Mangler/ugyldige env vars for Danske Bank',
          missingKeys,
        }
      }
      return {
        status: 'missing_env',
        message: String((err as any)?.message ?? err),
        missingKeys: [],
      }
    }
  }

  if (provider === 'nordea') {
    if (!envHasAnyPrefix('NORDEA_') && !envHasAnyPrefix('NORDEA_CA_')) {
      return { status: 'not_configured', message: 'Ingen NORDEA_* env vars sat' }
    }
    try {
      loadNordeaCorporateAccessEnvConfig()
      loadNordeaEnvSecrets()
      return { status: 'ready' }
    } catch (err) {
      if (err instanceof ZodError) {
        const missingKeys = formatMissingFromZod(err)
        return {
          status: 'missing_env',
          message: 'Mangler/ugyldige env vars for Nordea',
          missingKeys,
        }
      }
      return {
        status: 'missing_env',
        message: String((err as any)?.message ?? err),
        missingKeys: [],
      }
    }
  }

  return { status: 'not_implemented', message: 'Ikke implementeret endnu' }
}

export default defineEventHandler(async () => {
  // Ensure baseline rows exist for each provider.
  await db
    .insert(bankingAgreement)
    .values(bankProviderValues.map((provider) => ({ provider, enabled: false })))
    .onConflictDoNothing({ target: bankingAgreement.provider })

  const agreements = await db.select().from(bankingAgreement).orderBy(asc(bankingAgreement.provider))
  return agreements.map((a) => ({
    ...a,
    readiness: computeProviderReadiness(String(a.provider)),
  }))
})
