import {
  projectCanonicalTransactionText,
  type TransactionReferenceDetail,
} from '~~/engine/matching/domain/transactionTextProjection'

export type CanonicalTransactionProjectionInput = {
  id: string
  runId: string
  bookingDate: string
  amount: number
  creditDebitIndicator: string | null
  underlyingTransactionCount?: number
  counterpartName?: string | null
  counterpartNameSource?: string | null
  entryAdditionalInfo: string | null
  ntryAcctSvcrRef: string | null
  ntryRef: string | null
}

export type CanonicalTransactionProjection = {
  counterpart: string | null
  counterpartHint: string | null
  referenceDetails: TransactionReferenceDetail[]
  references: string[]
  preferredReference: string | null
  postingText: string
}

export function projectCanonicalTransactionFields(
  input: CanonicalTransactionProjectionInput,
): CanonicalTransactionProjection {
  const projection = projectCanonicalTransactionText({
    transactionId: input.id,
    amount: input.amount,
    creditDebitIndicator: input.creditDebitIndicator,
    entryAdditionalInfo: input.entryAdditionalInfo,
    ntryAcctSvcrRef: input.ntryAcctSvcrRef,
  })

  return {
    counterpart: input.underlyingTransactionCount === 1 ? input.counterpartName ?? null : null,
    counterpartHint: input.underlyingTransactionCount === 1 ? input.counterpartNameSource ?? null : null,
    referenceDetails: projection.referenceDetails,
    references: projection.references,
    preferredReference: projection.preferredReference,
    postingText: projection.postingText,
  }
}
