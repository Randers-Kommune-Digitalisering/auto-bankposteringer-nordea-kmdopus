import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import type { Server } from 'node:http'
import { startWorkerStatusServer } from '../../scripts/runtime/worker-status-server'

describe('worker status server', () => {
  let server: Server | undefined

  afterEach(async () => {
    if (!server) return
    await new Promise<void>((resolve, reject) => {
      server?.close(error => error ? reject(error) : resolve())
    })
    server = undefined
  })

  it('reports provider env readiness without exposing values', async () => {
    server = await startWorkerStatusServer(0, {})
    const address = server.address() as AddressInfo
    const response = await fetch(`http://127.0.0.1:${address.port}/internal/status/config`)
    const body = await response.json() as {
      providers: Record<string, { readiness: { status: string; env?: { missingKeys: string[] } } }>
    }

    expect(response.status).toBe(200)
    expect(body.providers['nordea/iso20022']?.readiness.status).toBe('not_configured')
    expect(body.providers['nordea/iso20022']?.readiness.env?.missingKeys).toContain('NORDEA_CA_WS_SENDER_ID')
    expect(JSON.stringify(body)).not.toContain('dummy')
  })
})
