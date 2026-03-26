import path from 'node:path'
import SftpClient from 'ssh2-sftp-client'
import env from '~/lib/env/env'

export interface SftpConnectionOptions {
  host: string
  port: number
  username: string
  password: string
  requestDir: string
  responseDir: string
}

export interface UploadFileOptions {
  filename: string
  content: string | Buffer
  remoteDir?: string
}

export interface RemoteFile {
  path: string
  name: string
  size: number
  modifiedAt?: Date
  contents: Buffer
}

const defaultOptions: SftpConnectionOptions = {
  host: env.SFTP_URL,
  port: 22,
  username: env.SFTP_USERNAME,
  password: env.SFTP_PASSWORD,
  requestDir: env.SFTP_REQUEST_DIR,
  responseDir: env.SFTP_RESPONSE_DIR,
}

export class ErpSftpClient {
  private readonly options: SftpConnectionOptions

  constructor(options: Partial<SftpConnectionOptions> = {}) {
    this.options = { ...defaultOptions, ...options }
  }

  async uploadFile(options: UploadFileOptions): Promise<string> {
    const remoteDir = options.remoteDir ?? this.options.requestDir
    const remotePath = buildRemotePath(remoteDir, options.filename)

    await this.withClient(async client => {
      await ensureDir(client, remoteDir)
      await client.put(
        typeof options.content === 'string'
          ? Buffer.from(options.content, 'utf-8')
          : options.content,
        remotePath,
      )
    })

    return remotePath
  }

  async fetchResponseFiles(limit?: number): Promise<RemoteFile[]> {
    const files: RemoteFile[] = []
    await this.withClient(async client => {
      const entries = await client.list(this.options.responseDir)
      const limitedEntries = typeof limit === 'number' ? entries.slice(0, limit) : entries

      for (const entry of limitedEntries) {
        if (entry.type !== '-' || !entry.name) {
          continue
        }

        const remotePath = buildRemotePath(this.options.responseDir, entry.name)
        const contents = await client.get(remotePath)
        files.push({
          path: remotePath,
          name: entry.name,
          size: entry.size ?? 0,
          modifiedAt: entry.modifyTime ? new Date(entry.modifyTime) : undefined,
          contents: Buffer.isBuffer(contents)
            ? contents
            : Buffer.from(contents as string | Buffer),
        })
      }
    })

    return files
  }

  async deleteRemoteFile(remotePath: string): Promise<void> {
    await this.withClient(client => client.delete(remotePath))
  }

  private async withClient<T>(handler: (client: SftpClient) => Promise<T>): Promise<T> {
    const client = new SftpClient()
    try {
      const normalized = normalizeHostPort(this.options.host, this.options.port)
      await client.connect({
        host: normalized.host,
        port: normalized.port,
        username: this.options.username,
        password: this.options.password,
      })
      return await handler(client)
    } finally {
      await client.end().catch(() => undefined)
    }
  }
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

  await client.mkdir(remoteDir, true).catch((error: unknown) => {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'ERR_GENERIC_CLIENT'
    ) {
      return
    }
    throw error
  })
}
