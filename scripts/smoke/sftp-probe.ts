import crypto from 'node:crypto'
import path from 'node:path'
import process from 'node:process'
import SftpClient from 'ssh2-sftp-client'

import 'dotenv/config'

type ProbeArgs = {
  limit: number
  write: boolean
  downloadOneResponseFile: boolean
}

function parseArgs(argv: string[]): ProbeArgs {
  const args: ProbeArgs = {
    limit: 10,
    write: false,
    downloadOneResponseFile: false,
  }

  for (const raw of argv) {
    if (raw === '--write') {
      args.write = true
      continue
    }

    if (raw === '--download-one-response-file') {
      args.downloadOneResponseFile = true
      continue
    }

    if (raw.startsWith('--limit=')) {
      const parsed = Number.parseInt(raw.slice('--limit='.length), 10)
      if (Number.isFinite(parsed) && parsed >= 0) {
        args.limit = parsed
      }
      continue
    }

    if (raw === '--help' || raw === '-h') {
      printHelp()
      process.exit(0)
    }
  }

  return args
}

function printHelp(): void {
  // Intentionally plain output (used in CI / terminals)
  console.log(`\nSFTP probe (dry-run by default)\n\nRequired env:\n  SFTP_URL, SFTP_USERNAME, SFTP_PASSWORD, SFTP_REQUEST_DIR, SFTP_RESPONSE_DIR\n\nUsage:\n  pnpm smoke:sftp\n\nOptions:\n  --limit=N                       Show up to N entries per dir (default 10)\n  --download-one-response-file     Download first response file (no delete)\n  --write                          Upload+delete a small probe file in request dir\n`)
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

function normalizeHostPort(rawHost: string, fallbackPort: number): { host: string; port: number } {
  const host = rawHost.trim()
  if (!host) {
    return { host, port: fallbackPort }
  }

  if (host.includes('://')) {
    try {
      const url = new URL(host)
      const portFromUrl = url.port ? Number.parseInt(url.port, 10) : undefined
      return {
        host: url.hostname,
        port:
          typeof portFromUrl === 'number' && Number.isFinite(portFromUrl)
            ? portFromUrl
            : fallbackPort,
      }
    } catch {
      // fall through
    }
  }

  const hostPortMatch = /^(?<hostname>[^:]+):(?<port>\d+)$/.exec(host)
  if (hostPortMatch?.groups?.hostname && hostPortMatch.groups.port) {
    const parsedPort = Number.parseInt(hostPortMatch.groups.port, 10)
    return {
      host: hostPortMatch.groups.hostname,
      port: Number.isFinite(parsedPort) ? parsedPort : fallbackPort,
    }
  }

  return { host, port: fallbackPort }
}

function buildRemotePath(dir: string, file: string): string {
  const normalizedDir = dir.endsWith('/') ? dir : `${dir}/`
  return path.posix.join(normalizedDir, file)
}

async function ensureDir(client: SftpClient, remoteDir: string): Promise<void> {
  const exists = await client.exists(remoteDir)
  if (exists) {
    return
  }

  await client.mkdir(remoteDir, true)
}

function formatEntry(entry: any): string {
  const name = String(entry?.name ?? '')
  const type = String(entry?.type ?? '')
  const size = typeof entry?.size === 'number' ? entry.size : undefined
  const mtime = typeof entry?.modifyTime === 'number' ? new Date(entry.modifyTime).toISOString() : undefined
  return `${type} ${name}${typeof size === 'number' ? ` (${size} bytes)` : ''}${mtime ? ` mtime=${mtime}` : ''}`
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))

  const rawUrl = requireEnv('SFTP_URL')
  const username = requireEnv('SFTP_USERNAME')
  const password = requireEnv('SFTP_PASSWORD')
  const requestDir = requireEnv('SFTP_REQUEST_DIR')
  const responseDir = requireEnv('SFTP_RESPONSE_DIR')

  const normalized = normalizeHostPort(rawUrl, 22)

  const client = new SftpClient()
  try {
    await client.connect({
      host: normalized.host,
      port: normalized.port,
      username,
      password,
      readyTimeout: 20_000,
    })

    console.log(`Connected to ${normalized.host}:${normalized.port} as ${username}`)

    const requestExists = await client.exists(requestDir)
    const responseExists = await client.exists(responseDir)
    console.log(`Request dir:  ${requestDir} (${requestExists ? 'exists' : 'missing'})`)
    console.log(`Response dir: ${responseDir} (${responseExists ? 'exists' : 'missing'})`)

    if (requestExists) {
      const entries = await client.list(requestDir)
      console.log(`\nRequest entries: ${entries.length}`)
      for (const entry of entries.slice(0, args.limit)) {
        console.log(`- ${formatEntry(entry)}`)
      }
      if (entries.length > args.limit) {
        console.log(`- … (${entries.length - args.limit} more)`)
      }
    }

    if (responseExists) {
      const entries = await client.list(responseDir)
      console.log(`\nResponse entries: ${entries.length}`)
      for (const entry of entries.slice(0, args.limit)) {
        console.log(`- ${formatEntry(entry)}`)
      }
      if (entries.length > args.limit) {
        console.log(`- … (${entries.length - args.limit} more)`)
      }

      if (args.downloadOneResponseFile) {
        const firstFile = entries.find((e: any) => e?.type === '-' && e?.name)
        if (!firstFile) {
          console.log(`\nNo downloadable response files found.`)
        } else {
          const remotePath = buildRemotePath(responseDir, String(firstFile.name))
          const contents = await client.get(remotePath)
          const buffer = Buffer.isBuffer(contents)
            ? contents
            : Buffer.from(contents as string | Buffer)

          const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')
          console.log(`\nDownloaded: ${remotePath}`)
          console.log(`Bytes: ${buffer.byteLength}`)
          console.log(`SHA256: ${sha256}`)
        }
      }
    }

    if (args.write) {
      const ts = new Date().toISOString().replaceAll(':', '').replaceAll('.', '')
      const filename = `__sftp_probe_${ts}.txt`
      const remotePath = buildRemotePath(requestDir, filename)

      console.log(`\nWrite mode enabled: uploading probe file to request dir…`)
      await ensureDir(client, requestDir)
      await client.put(Buffer.from(`probe ${new Date().toISOString()}\n`, 'utf-8'), remotePath)
      console.log(`Uploaded: ${remotePath}`)
      await client.delete(remotePath)
      console.log(`Deleted:  ${remotePath}`)
    }
  } finally {
    await client.end().catch(() => undefined)
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
