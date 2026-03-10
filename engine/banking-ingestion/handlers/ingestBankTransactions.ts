import { runTransactionBatch } from './runTransactionBatch'

/**
 * Use-case: Hent og normalisér bankdata.
 *
 * Mål:
 * - Hente banktransaktioner (ekstern IO).
 * - Persistér rå payload i `banking_payload`.
 * - Persistér kanoniske rækker i `transaction`.
 * - Opret/afslut en `run` for batchen.
 *
 * Bemærk:
 * - Denne funktion er en tynd wrapper over eksisterende implementation i `services/banking/*`.
 * - Over tid kan normalisering splittes ud til `domain/` og DB-adapters til `infrastructure/`.
 */
export async function ingestBankTransactions(): Promise<{
  runId: string
  insertedCount: number
}> {
  return runTransactionBatch()
}
