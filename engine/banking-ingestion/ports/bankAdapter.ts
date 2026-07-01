/**
 * Port: Bankcentral-adapter.
 *
 * This port is intentionally narrow and stable:
 * - The adapter fetches raw source documents (typically CAMT.053 XML).
 * - Ingestion/parsing/normalization stays in the application layer
 *   (e.g. ingestCamt053Document) for deterministic behavior.
 * - Cursor/state must be persisted in DB (runtime remains stateless).
 */

export type BankAdapterKey = string

export type BankDocumentFormat = 'camt053' | 'unknown'

export type BankCursor = {
  /** Opaque cursor serialized for storage in DB. */
  value: string
}

export type FetchedBankDocument = {
  format: BankDocumentFormat
  filename?: string | null
  content: string

  /** Optional adapter-provided timestamps (otherwise derived from document content). */
  receivedAt?: Date | null
}

export type FetchBankDocumentsInput = {
  accountId: string
  cursor: BankCursor | null
  limit?: number
  /** Required ISO date (YYYY-MM-DD). Adapters must scope fetches to this booking date. */
  bookingDate: string
}

export type FetchBankDocumentsOutput = {
  documents: FetchedBankDocument[]
  nextCursor: BankCursor | null
}

export interface BankAdapter {
  key: BankAdapterKey
  lookbackDays?: number

  fetchDocuments(input: FetchBankDocumentsInput): Promise<FetchBankDocumentsOutput>
}
