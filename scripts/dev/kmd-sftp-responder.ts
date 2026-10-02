import path from 'node:path'
import process from 'node:process'
import SftpClient from 'ssh2-sftp-client'
import { buildKmdSftpResponse, type KmdSftpMockMode } from './kmdSftpResponseBuilder'

const host = process.env.KMD_SFTP_MOCK_HOST ?? 'sftp'
const port = Number(process.env.KMD_SFTP_MOCK_PORT ?? 22)
const username = process.env.KMD_SFTP_MOCK_USERNAME ?? 'test'
const password = process.env.KMD_SFTP_MOCK_PASSWORD ?? 'pass'
const requestDir = process.env.KMD_SFTP_MOCK_REQUEST_DIR ?? '/test-from-randers'
const responseDir = process.env.KMD_SFTP_MOCK_RESPONSE_DIR ?? '/test-to-randers'
const configuredMode = process.env.KMD_SFTP_MOCK_MODE ?? 'random'
const pollIntervalMs = Number(process.env.KMD_SFTP_MOCK_POLL_INTERVAL_MS ?? 5000)
const allowedModes: KmdSftpMockMode[] = ['random', 'success', 'mixed', 'error']
const mode = allowedModes.includes(configuredMode as KmdSftpMockMode)
  ? configuredMode as KmdSftpMockMode
  : 'random'
const observed = new Map<string, string>()
const attempted = new Map<string, string>()
let client: SftpClient | null = null

async function disconnect(): Promise<void> {
  if (!client) return
  const current = client
  client = null
  await current.end().catch(() => undefined)
}

async function connect(): Promise<SftpClient> {
  const next = new SftpClient()
  await next.connect({
    host,
    port,
    username,
    password,
    keepaliveInterval: 30000,
  })
  client = next
  console.info(`Connected to SFTP ${host}:${port}`)
  return next
}

console.info(`KMD SFTP responder polling ${host}:${port}${requestDir} (${mode} mode)`)

process.once('SIGINT', () => void disconnect().finally(() => process.exit(0)))
process.once('SIGTERM', () => void disconnect().finally(() => process.exit(0)))

while (true) {
  try {
    const activeClient = client ?? await connect()
    const entries = await activeClient.list(requestDir)

    for (const entry of entries) {
      const filename = path.posix.basename(entry.name)
      if (entry.type !== '-' || !filename.toLowerCase().endsWith('.xml')) continue

      const requestPath = path.posix.join(requestDir, filename)
      const responsePath = path.posix.join(responseDir, filename)
      if (await activeClient.exists(responsePath)) {
        observed.delete(filename)
        attempted.delete(filename)
        continue
      }

      const signature = `${entry.size}:${entry.modifyTime}`
      if (observed.get(filename) !== signature) {
        observed.set(filename, signature)
        continue
      }
      if (attempted.get(filename) === signature) continue

      let temporaryPath: string | undefined
      try {
        const contents = await activeClient.get(requestPath)
        const requestXml = Buffer.isBuffer(contents) ? contents.toString('utf8') : String(contents)
        const response = buildKmdSftpResponse(requestXml, filename, mode)
        temporaryPath = path.posix.join(requestDir, `.${filename}.${process.pid}.tmp`)
        await activeClient.put(Buffer.from(response.xml, 'utf8'), temporaryPath)
        await activeClient.rename(temporaryPath, responsePath)
        temporaryPath = undefined
        console.info(`Generated KMD mock response ${filename}: ${response.accepted} accepted, ${response.rejected} rejected`)
      } catch (error) {
        attempted.set(filename, signature)
        console.error(`Could not generate KMD response for ${filename}`, error instanceof Error ? error.message : String(error))
      } finally {
        if (temporaryPath) await activeClient.delete(temporaryPath).catch(() => undefined)
      }
    }
  } catch (error) {
    console.error('KMD mock SFTP poll failed', error instanceof Error ? error.message : String(error))
    await disconnect()
  }

  await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
}