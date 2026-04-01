import path from 'node:path'
import SftpClient from 'ssh2-sftp-client'
import env from '~/lib/env/env'
import { logger } from '~/lib/logger'

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
  private readonly log = logger.child({ scope: 'erp.sftp' })

  constructor(options: Partial<SftpConnectionOptions> = {}) {
    this.options = { ...defaultOptions, ...options }
  }

  async uploadFile(options: UploadFileOptions): Promise<string> {
    const remoteDir = options.remoteDir ?? this.options.requestDir
    const remotePath = buildRemotePath(remoteDir, options.filename)

    const bytes =
      typeof options.content === 'string'
        ? Buffer.byteLength(options.content, 'utf-8')
        : options.content.byteLength

    this.log.info('SFTP upload start', {
      remotePath,
      remoteDir,
      filename: options.filename,
      bytes,
    })

    const startedAt = Date.now()
    await this.withClient(async client => {
      await ensureDir(client, remoteDir)
      await client.put(
        typeof options.content === 'string'
          ? Buffer.from(options.content, 'utf-8')
          : options.content,
        remotePath,
      )
    })

    this.log.info('SFTP upload done', { remotePath, ms: Date.now() - startedAt })

    return remotePath
  }

  async fetchResponseFiles(limit?: number): Promise<RemoteFile[]> {
    const files: RemoteFile[] = []
    const startedAt = Date.now()

    this.log.info('SFTP fetch responses start', {
      responseDir: this.options.responseDir,
      limit,
    })

    await this.withClient(async client => {
      const entries = await client.list(this.options.responseDir)
      const limitedEntries = typeof limit === 'number' ? entries.slice(0, limit) : entries

      this.log.debug('SFTP response dir listed', {
        responseDir: this.options.responseDir,
        entries: entries.length,
        picked: limitedEntries.length,
      })

      for (const entry of limitedEntries) {
        if (entry.type !== '-' || !entry.name) {
          continue
        }

        const remotePath = buildRemotePath(this.options.responseDir, entry.name)
        this.log.debug('SFTP download start', { remotePath, size: entry.size ?? 0 })
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

    this.log.info('SFTP fetch responses done', {
      responseDir: this.options.responseDir,
      files: files.length,
      ms: Date.now() - startedAt,
    })

    return files
  }

  async deleteRemoteFile(remotePath: string): Promise<void> {
    const startedAt = Date.now()
    this.log.info('SFTP delete start', { remotePath })
    await this.withClient(client => client.delete(remotePath))
    this.log.info('SFTP delete done', { remotePath, ms: Date.now() - startedAt })
  }

  private async withClient<T>(handler: (client: SftpClient) => Promise<T>): Promise<T> {
    const client = new SftpClient()
    try {
      const normalized = normalizeHostPort(this.options.host, this.options.port)

      this.log.debug('SFTP connect start', {
        host: normalized.host,
        port: normalized.port,
        username: this.options.username,
        requestDir: this.options.requestDir,
        responseDir: this.options.responseDir,
      })

      const connectStartedAt = Date.now()
      await client.connect({
        host: normalized.host,
        port: normalized.port,
        username: this.options.username,
        password: this.options.password,
      })

      this.log.debug('SFTP connect done', {
        host: normalized.host,
        port: normalized.port,
        ms: Date.now() - connectStartedAt,
      })

      return await handler(client)
    } catch (error: unknown) {
      this.log.error('SFTP operation failed', { error })
      throw error
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
