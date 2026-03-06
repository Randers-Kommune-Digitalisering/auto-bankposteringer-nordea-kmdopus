import { readFile } from 'node:fs/promises'
import type {
  BankAdapter,
  BankCursor,
  FetchBankDocumentsInput,
  FetchBankDocumentsOutput,
} from '../ports/bankAdapter'

/**
 * Adapter used for deterministic development/testing.
 *
 * It reads a local file and returns it as a CAMT.053 document.
 */
export class LocalFileBankAdapter implements BankAdapter {
  public readonly key: string
  private readonly filePath: string
  private readonly filename: string

  constructor(options: { key?: string; filePath: string; filename?: string }) {
    this.key = options.key ?? 'local-file'
    this.filePath = options.filePath
    this.filename = options.filename ?? this.filePath.split('/').pop() ?? 'document.xml'
  }

  async fetchDocuments(
    _input: FetchBankDocumentsInput,
  ): Promise<FetchBankDocumentsOutput> {
    const xml = await readFile(this.filePath, 'utf8')

    const cursor: BankCursor = {
      // Static cursor; callers relying on idempotency should use hashing at ingest time.
      value: `local-file:${this.filePath}`,
    }

    return {
      documents: [
        {
          format: 'camt053',
          filename: this.filename,
          content: xml,
          receivedAt: new Date(),
        },
      ],
      nextCursor: cursor,
    }
  }
}
