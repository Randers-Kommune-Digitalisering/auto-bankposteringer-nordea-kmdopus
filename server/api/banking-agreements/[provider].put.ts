import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import {
  bankingAgreement,
  bankProviderValues,
  bankChannelValues,
} from '~/lib/db/schema/bankingAgreement'
import type {
  BankingAgreementInsertSchema,
  BankingAgreementUpdateSchema,
} from '~/lib/db/schema/bankingAgreement'
import { ZodError } from 'zod'
import {
  extractKeysFromZod,
  validateProviderEnvOrThrow as validateProviderEnvOrThrowShared,
} from '~/../engine/banking-ingestion/infrastructure/providerEnv'
import { syncTransactionCodeCatalogForProvider } from '~/../engine/banking-ingestion/handlers/syncTransactionCodeCatalog'
import { logger } from '~/lib/logger'
import { bankingAgreementDiscoveryRun } from '~/lib/db/schema/bankingAgreementDiscoveryRun'
import { enqueueJob } from '~/../engine/queue/handlers/enqueueJob'

const bodySchema = z.object({
  enabled: z.boolean(),
  channel: z.enum(bankChannelValues).optional(),
})

function formatEnvValidationError(err: unknown): string {
  if (err instanceof ZodError) {
    const keys = extractKeysFromZod(err)
    if (keys.length) return `Manglende/ugyldige env vars: ${keys.join(', ')}`
    return 'Manglende/ugyldige env vars'
  }

  const msg = String((err as any)?.message ?? err)
  return msg || 'Ugyldig env-konfiguration'
}

export default defineEventHandler(async (event) => {
  const log = logger.child({ scope: 'api.bankingAgreements.update' })
  const provider = event.context.params?.provider

  if (!provider || !bankProviderValues.includes(provider as any)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ugyldig provider',
    })
  }

  const body = await readBody(event)
  const parsedBody = bodySchema.safeParse(body)

  if (!parsedBody.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsedBody.error.message,
    })
  }

  const now = new Date()

  const existing = await db
    .select()
    .from(bankingAgreement)
    .where(eq(bankingAgreement.provider, provider as any))
    .limit(1)
    .then((rows) => rows[0] ?? null)

  const nextChannel = (
    parsedBody.data.channel ??
    (existing?.channel as any) ??
    'iso20022'
  ) as (typeof bankChannelValues)[number]

  const nextEnabled =
    typeof parsedBody.data.enabled === 'boolean'
      ? parsedBody.data.enabled
      : (existing?.enabled ?? false)

  if (nextEnabled) {
    try {
      validateProviderEnvOrThrowShared(provider, nextChannel)
    } catch (err) {
      throw createError({
        statusCode: 400,
        statusMessage: formatEnvValidationError(err),
      })
    }
  }

  // Important behavior: enabling an agreement must NOT start transaction ingestion.
  // Ingestion is always initiated explicitly via run endpoints/tasks with a booking date.

  const updateValues: BankingAgreementUpdateSchema = {
    enabled: parsedBody.data.enabled,
    updatedAt: now,
    ...(parsedBody.data.channel ? { channel: parsedBody.data.channel } : {}),
  }

  const [updated] = await db
    .update(bankingAgreement)
    .set(updateValues)
    .where(eq(bankingAgreement.provider, provider as any))
    .returning()

  let agreement = updated

  if (!agreement) {
    const insertValues: BankingAgreementInsertSchema = {
      provider: provider as any,
      enabled: parsedBody.data.enabled,
      channel: parsedBody.data.channel ?? 'iso20022',
      createdAt: now,
    }

    const [inserted] = await db
      .insert(bankingAgreement)
      .values(insertValues as any)
      .returning()

    agreement = inserted
  }

  const shouldRunDiscovery = nextEnabled && nextChannel === 'iso20022'
  const shouldSyncCatalog = nextEnabled

  let catalogSync: Awaited<ReturnType<typeof syncTransactionCodeCatalogForProvider>> | null = null
  if (shouldSyncCatalog) {
    catalogSync = await syncTransactionCodeCatalogForProvider(db as any, provider as any)
    if (catalogSync.status === 'loaded') {
      log.info('Transaction code catalog synced on agreement activation', {
        provider,
        sourcePath: catalogSync.sourcePath,
        upserted: catalogSync.upserted,
      })
    } else {
      log.warn('Transaction code catalog sync skipped on agreement activation', {
        provider,
        sourcePath: catalogSync.sourcePath,
        reason: catalogSync.reason,
      })
    }
  }

  let discoveryOperation: {
    id: string
    status: 'started'
    provider: string
    channel: string
    requestedAt: string
    jobId: string
  } | null = null

  if (shouldRunDiscovery) {
    const [created] = await db
      .insert(bankingAgreementDiscoveryRun)
      .values({
        provider: provider as any,
        channel: nextChannel,
        status: 'started',
        requestedAt: now,
        updatedAt: now,
        triggerSource: 'agreement_activation',
      } as any)
      .returning({
        id: bankingAgreementDiscoveryRun.id,
        requestedAt: bankingAgreementDiscoveryRun.requestedAt,
      })

    if (!created) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Kunne ikke oprette discovery-kørsel',
      })
    }

    const jobId = await enqueueJob('banking.accountDiscovery', {
      discoveryRunId: created.id,
      provider,
      channel: nextChannel,
    })

    await db
      .update(bankingAgreementDiscoveryRun)
      .set({
        jobId,
        updatedAt: new Date(),
      })
      .where(eq(bankingAgreementDiscoveryRun.id, created.id))

    discoveryOperation = {
      id: created.id,
      status: 'started',
      provider,
      channel: nextChannel,
      requestedAt: created.requestedAt.toISOString(),
      jobId,
    }

    log.info('Account discovery scheduled after agreement activation', {
      provider,
      channel: nextChannel,
      discoveryRunId: created.id,
      jobId,
    })
  } else {
    log.info('Account discovery skipped after agreement update', {
      provider,
      channel: nextChannel,
      enabled: nextEnabled,
      reason: nextEnabled ? 'channel_not_iso20022' : 'agreement_disabled',
    })
  }

  return {
    success: true,
    agreement,
    catalogSync,
    discoveryOperation,
    // Deprecated compatibility keys: operation is now asynchronous.
    discovery: null,
    accountDiscovery: null,
  }
})