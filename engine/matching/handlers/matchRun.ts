import { matchTransactionsForRun } from './transactionMatchingService'

/**
 * Use-case: Matching mellem banktransaktioner.
 *
 * Mål:
 * - Deterministisk evaluering af regler for en given `run`.
 * - Persistér resultat/audit i DB (rule-version, status, locks, etc.).
 *
 * Bemærk:
 * - I nuværende kodebase ligger match-logikken i `services/matching/*`.
 * - Over tid bør regelmotor og match-output modelleres i `engine/matching/domain/*`.
 */
export async function matchRun(runId: string) {
  return matchTransactionsForRun(runId)
}
