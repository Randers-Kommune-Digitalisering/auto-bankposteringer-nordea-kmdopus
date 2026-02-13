import path from "node:path";
import SftpClient from 'ssh2-sftp-client'
import env from "../../app/lib/env";

export interface SftpConnectionOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  sendDir: string;
  receiveDir: string;
}

export interface UploadFileOptions {
  filename: string;
  content: string | Buffer;
  remoteDir?: string;
}

export interface RemoteFile {
  path: string;
  name: string;
  size: number;
  modifiedAt?: Date;
  contents: Buffer;
}

const defaultOptions: SftpConnectionOptions = {
  host: env.SFTP_URL,
  port: 22,
  username: env.SFTP_USERNAME,
  password: env.SFTP_PASSWORD,
  sendDir: env.SFTP_SEND_DIR,
  receiveDir: env.SFTP_RECEIVE_DIR,
};

export class ErpSftpClient {
  private readonly options: SftpConnectionOptions;

  constructor(options: Partial<SftpConnectionOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  async uploadFile(options: UploadFileOptions): Promise<string> {
    const remoteDir = options.remoteDir ?? this.options.sendDir;
    const remotePath = buildRemotePath(remoteDir, options.filename);

    await this.withClient(async (client) => {
      await ensureDir(client, remoteDir);
      await client.put(
        typeof options.content === "string" ? Buffer.from(options.content, "utf-8") : options.content,
        remotePath,
      );
    });

    return remotePath;
  }

  async fetchResponseFiles(limit?: number): Promise<RemoteFile[]> {
    const files: RemoteFile[] = [];
    await this.withClient(async (client) => {
      const entries = await client.list(this.options.receiveDir);
      const limitedEntries = typeof limit === "number" ? entries.slice(0, limit) : entries;

      for (const entry of limitedEntries) {
        if (entry.type !== "-" || !entry.name) {
          continue;
        }

        const remotePath = buildRemotePath(this.options.receiveDir, entry.name);
        const contents = await client.get(remotePath);
        files.push({
          path: remotePath,
          name: entry.name,
          size: entry.size ?? 0,
          modifiedAt: entry.modifyTime ? new Date(entry.modifyTime) : undefined,
          contents: Buffer.isBuffer(contents) ? contents : Buffer.from(contents as string | Buffer),
        });
      }
    });

    return files;
  }

  async deleteRemoteFile(remotePath: string): Promise<void> {
    await this.withClient((client) => client.delete(remotePath));
  }

  private async withClient<T>(handler: (client: SftpClient) => Promise<T>): Promise<T> {
    const client = new SftpClient();
    try {
      await client.connect({
        host: this.options.host,
        port: this.options.port,
        username: this.options.username,
        password: this.options.password,
      });
      return await handler(client);
    } finally {
      await client.end().catch(() => undefined);
    }
  }
}

function buildRemotePath(dir: string, file: string): string {
  const normalizedDir = dir.endsWith("/") ? dir : `${dir}/`;
  return path.posix.join(normalizedDir, file);
}

async function ensureDir(client: SftpClient, remoteDir: string): Promise<void> {
  const exists = await client.exists(remoteDir);
  if (exists) {
    return;
  }

  await client.mkdir(remoteDir, true).catch((error: unknown) => {
    if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "ERR_GENERIC_CLIENT") {
      return;
    }
    throw error;
  });
}
