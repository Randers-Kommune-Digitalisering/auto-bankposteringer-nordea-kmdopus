import { z } from 'zod'
import type { ProviderEnvStatus } from '../../engine/banking-ingestion/infrastructure/providerEnv'

const requirementStatusSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('key'),
    key: z.string(),
    present: z.boolean(),
    invalid: z.boolean(),
  }),
  z.object({
    type: z.literal('anyOf'),
    label: z.string(),
    keys: z.array(z.string()),
    presentKeys: z.array(z.string()),
    satisfied: z.boolean(),
    invalidKeys: z.array(z.string()),
  }),
])

const envStatusSchema = z.object({
  requirements: z.array(requirementStatusSchema),
  presentKeys: z.array(z.string()),
  missingKeys: z.array(z.string()),
  invalidKeys: z.array(z.string()),
})

const readinessSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.enum(['ready', 'missing_env', 'not_configured']),
    message: z.string().optional(),
    missingKeys: z.array(z.string()),
    env: envStatusSchema,
  }),
  z.object({ status: z.literal('not_implemented'), message: z.string() }),
])

const certificateSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('not_applicable'), message: z.string() }),
  z.object({ status: z.enum(['missing', 'invalid']), message: z.string() }),
  z.object({
    status: z.enum(['ok', 'expires_soon', 'expired']),
    expiresAt: z.string(),
    daysRemaining: z.number(),
    fingerprintSha256Hex: z.string().optional(),
  }),
])

const workerConfigurationSchema = z.object({
  providers: z.record(z.string(), z.object({
    readiness: readinessSchema,
    certificate: certificateSchema,
  })),
})

const validationResponseSchema = z.object({
  valid: z.boolean(),
  missingKeys: z.array(z.string()).optional(),
  message: z.string().optional(),
})

export type WorkerProviderConfiguration = {
  readiness: ProviderEnvStatus | { status: 'worker_unavailable'; message: string }
  certificate: z.infer<typeof certificateSchema>
}

export type WorkerConfiguration = {
  providers: Record<string, WorkerProviderConfiguration>
}

function workerStatusUrl(path: string): URL {
  const configuredUrl = process.env.WORKER_STATUS_URL
  if (!configuredUrl) {
    throw new Error('WORKER_STATUS_URL is not configured')
  }

  const baseUrl = new URL(configuredUrl)
  if (baseUrl.protocol !== 'http:') {
    throw new Error('WORKER_STATUS_URL must use the internal HTTP service')
  }

  return new URL(path, baseUrl)
}

export async function getWorkerConfiguration(): Promise<WorkerConfiguration> {
  const response = await fetch(workerStatusUrl('/internal/status/config'), {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(3000),
  })
  if (!response.ok) {
    throw new Error(`Worker status request failed with HTTP ${response.status}`)
  }

  return workerConfigurationSchema.parse(await response.json())
}

export async function validateWorkerProviderConfiguration(
  provider: string,
  channel: string,
): Promise<z.infer<typeof validationResponseSchema>> {
  const response = await fetch(workerStatusUrl('/internal/status/validate'), {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ provider, channel }),
    signal: AbortSignal.timeout(3000),
  })
  if (!response.ok) {
    throw new Error(`Worker configuration validation failed with HTTP ${response.status}`)
  }

  return validationResponseSchema.parse(await response.json())
}
