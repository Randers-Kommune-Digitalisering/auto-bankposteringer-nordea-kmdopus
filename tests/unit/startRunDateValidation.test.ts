import { afterEach, describe, expect, it, vi } from 'vitest'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { createApp, createRouter, defineEventHandler, toNodeListener } from 'h3'

describe('manual run date validation', () => {
  let server: ReturnType<typeof createServer> | undefined

  afterEach(async () => {
    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        server!.close(error => error ? reject(error) : resolve())
      })
    }
    server = undefined
    vi.unstubAllGlobals()
  })

  it('rejects weekend dates before enqueueing', async () => {
    vi.stubGlobal('defineEventHandler', defineEventHandler)
    const { default: startRunHandler } = await import('../../server/api/runs/start.post')
    const app = createApp()
    const router = createRouter()
    router.post('/api/runs/start', startRunHandler)
    app.use(router)

    server = createServer(toNodeListener(app))
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')

    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Test server did not bind a TCP port')

    for (const bookingDate of ['2026-10-24', '2026-10-25']) {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/runs/start`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bookingDate }),
      })

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({
        statusMessage: 'Kørsler kan kun startes for hverdage.',
      })
    }
  }, 15_000)
})
