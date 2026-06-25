import type { PostingLineInput } from '../../posting/domain/posting'
import { submitErpPostingViaOutbox } from '../infrastructure/erpOutbox'
import type { ErpSupplier } from '~~/app/lib/db/schema/enums.ts'

/**
 * Use-case: Afsendelse af posteringer til ERP.
 *
 * Mål:
 * - Byg payload (XML) og persistér request i DB.
 * - Opret outbox-record for upload (retry/idempotens).
 * - Udfør upload nu eller senere via worker.
 */

export async function submitPostingViaOutbox(input: {
  runId: string
  bookingDate: Date | string
  postings: PostingLineInput[]
  erpSupplier: ErpSupplier
}) {
  return submitErpPostingViaOutbox(input)
}
