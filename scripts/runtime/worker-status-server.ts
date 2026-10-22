import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { ZodError } from 'zod'
import {
  extractKeysFromZod,
  inspectProviderEnv,
  providerEnvRequirements,
  validateProviderEnvOrThrow,
} from '../../engine/banking-ingestion/infrastructure/providerEnv'
import { loadDanskeBankEnvSecrets } from '../../engine/banking-ingestion/infrastructure/danskebank/danskeBankEnvSecrets'
import { loadNordeaEnvSecrets } from '../../engine/banking-ingestion/infrastructure/nordea/nordeaEnvSecrets'
import { getCertificateStatusFromPem } from '../../engine/banking-ingestion/infrastructure/certificateStatus'

const statusPort = 3001
const supportedChecks = [
  { provider: 'danskebank', channel: 'iso20022' },
  { provider: 'danskebank', channel: 'rest' },
  { provider: 'nordea', channel: 'iso20022' },
  { provider: 'nordea', channel: 'rest' },
  { provider: 'bankconnect', channel: 'iso20022' },
  { provider: 'bankconnect', channel: 'rest' },
] as const

function json(response: ServerResponse, statusCode: number, body: unknown) {
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(body))
}

function certificateStatus(provider: string, channel: string, readiness: string, env: NodeJS.ProcessEnv) {
  if (channel !== 'iso20022' || readiness !== 'ready') {
    return { status: 'not_applicable', message: 'Ikke konfigureret' }
  }

  try {
    if (provider === 'danskebank') {
      const secrets = loadDanskeBankEnvSecrets(env)
      const status = getCertificateStatusFromPem({
        certificatePem: secrets.applicationRequestCertificatePem,
        expiresSoonDays: 7,
      })
      return {
        status: status.status,
        ...('expiresAt' in status ? {
          expiresAt: status.expiresAt,
          daysRemaining: status.daysRemaining,
          fingerprintSha256Hex: status.fingerprintSha256Hex,
        } : { message: status.message }),
      }
    }

    if (provider === 'nordea') {
      const secrets = loadNordeaEnvSecrets(env)
      const status = getCertificateStatusFromPem({
        certificatePem: secrets.NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM,
        expiresSoonDays: 7,
      })
      return {
        status: status.status,
        ...('expiresAt' in status ? {
          expiresAt: status.expiresAt,
          daysRemaining: status.daysRemaining,
          fingerprintSha256Hex: status.fingerprintSha256Hex,
        } : { message: status.message }),
      }
    }
  } catch {
    return { status: 'invalid', message: 'Certifikatkonfigurationen kunne ikke valideres' }
  }

  return { status: 'not_applicable', message: 'Ikke relevant for kanal' }
}

function currentConfiguration(env: NodeJS.ProcessEnv) {
  return Object.fromEntries(supportedChecks.map(({ provider, channel }) => {
    const readiness = inspectProviderEnv(provider, channel, env)
    return [`${provider}/${channel}`, {
      readiness,
      certificate: certificateStatus(provider, channel, readiness.status, env),
    }]
  }))
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let bytes = 0

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    bytes += buffer.length
    if (bytes > 4096) throw new Error('Request body too large')
    chunks.push(buffer)
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function handleRequest(request: IncomingMessage, response: ServerResponse, env: NodeJS.ProcessEnv) {
  const path = new URL(request.url ?? '/', 'http://worker').pathname

  if (request.method === 'GET' && path === '/internal/status/config') {
    json(response, 200, { providers: currentConfiguration(env) })
    return
  }

  if (request.method === 'POST' && path === '/internal/status/validate') {
    void (async () => {
      try {
        const body = await readJsonBody(request) as { provider?: unknown; channel?: unknown }
        const provider = typeof body.provider === 'string' ? body.provider : ''
        const channel = typeof body.channel === 'string' ? body.channel : ''

        if (!providerEnvRequirements(provider, channel)) {
          json(response, 200, { valid: false, message: 'Ugyldig eller ikke understøttet provider/kanal' })
          return
        }

        try {
          validateProviderEnvOrThrow(provider, channel)
          json(response, 200, { valid: true })
        } catch (error) {
          json(response, 200, {
            valid: false,
            missingKeys: error instanceof ZodError ? extractKeysFromZod(error) : [],
            message: 'Workerens provider-konfiguration kunne ikke valideres',
          })
        }
      } catch {
        json(response, 400, { valid: false, message: 'Ugyldig statusforespørgsel' })
      }
    })()
    return
  }

  json(response, 404, { message: 'Not found' })
}

export function startWorkerStatusServer(port = statusPort, env = process.env): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = createServer((request, response) => handleRequest(request, response, env))
    server.once('error', reject)
    server.listen(port, '0.0.0.0', () => {
      server.removeListener('error', reject)
      resolve(server)
    })
  })
}
