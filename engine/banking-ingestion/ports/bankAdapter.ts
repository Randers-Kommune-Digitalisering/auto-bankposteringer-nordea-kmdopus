/**
 * Port: Bankcentral-adapter.
 *
 * Intention:
 * - Understøt flere bankcentraler direkte (uden en normaliserings-leverandør).
 * - Hent typisk CAMT.053 (XML) og normalisér til en intern, deterministisk model.
 *
 * Bemærk: Dette er kun et scaffold. Den nuværende integration ligger stadig i
 * `engine/banking-ingestion/infrastructure/fetchBankTransactions.ts`.
 */

export type BankAdapterKey = string

export type NormalizedBankTransaction = {
  externalId: string
  accountExternalId: string
  bookingDate: string // YYYY-MM-DD
  valueDate?: string // YYYY-MM-DD
  amount: number
  currency?: string
  text?: string
  endToEndId?: string
  ocrReference?: string
  debtorName?: string
  debtorId?: string
  creditorName?: string
  creditorId?: string
  raw?: unknown
}

export interface BankAdapter {
  key: BankAdapterKey

  /**
   * Fetch and normalize transactions since the last cursor known in DB.
   * Cursor handling should be persisted in DB (stateless runtime).
   */
  fetchNormalizedTransactions(): Promise<NormalizedBankTransaction[]>
}
