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
  entryAdditionalInfo: string | null
  ntryAcctSvcrRef: string | null
  ntryRef: string | null
}

export type CanonicalTransactionProjection = {
  counterpart: null
  counterpartHint: null
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
    ntryRef: input.ntryRef,
  })

  return {
    counterpart: null,
    counterpartHint: null,
    referenceDetails: projection.referenceDetails,
    references: projection.references,
    preferredReference: projection.preferredReference,
    postingText: projection.postingText,
  }
}
