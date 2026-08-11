import {
  buildReferenceDetails as buildReferenceDetailsShared,
  projectCanonicalTransactionText,
  resolveCounterpartAndHint as resolveCounterpartAndHintShared,
  type TransactionReferenceDetail,
} from '~~/engine/matching/domain/transactionTextProjection'

export function resolveCounterpartAndHint(input: {
  creditDebitIndicator: string | null
  debtorName: string | null
  debtorId?: string | null
  creditorName: string | null
  creditorId?: string | null
}): { counterpart: string | null; counterpartHint: string | null } {
  return resolveCounterpartAndHintShared({
    amount: input.creditDebitIndicator === 'DBIT' ? -1 : 1,
    creditDebitIndicator: input.creditDebitIndicator,
    debtorName: input.debtorName,
    debtorId: input.debtorId ?? null,
    creditorName: input.creditorName,
    creditorId: input.creditorId ?? null,
  })
}

export function buildReferenceDetails(input: {
  remittanceUstrd: string[] | null
  remittanceAdditional: string[] | null
  remittanceCreditorReference: string | null
  entryAdditionalInfo: string | null
  txAdditionalInfo: string | null
  refsEndToEndId: string | null
  refsInstrId: string | null
  refsPmtInfId: string | null
  uetr: string | null
  txAcctSvcrRef: string | null
  ntryAcctSvcrRef: string | null
  ntryRef: string | null
}): TransactionReferenceDetail[] {
  return buildReferenceDetailsShared(input)
}

export type CanonicalTransactionProjectionInput = {
  id: string
  runId: string
  bookingDate: string
  amount: number
  creditDebitIndicator: string | null
  debtorName: string | null
  debtorId: string | null
  creditorName: string | null
  creditorId: string | null
  remittanceUstrd: string[] | null
  remittanceAdditional: string[] | null
  remittanceCreditorReference: string | null
  entryAdditionalInfo: string | null
  txAdditionalInfo: string | null
  refsEndToEndId: string | null
  refsInstrId: string | null
  refsPmtInfId: string | null
  uetr: string | null
  txAcctSvcrRef: string | null
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
    debtorName: input.debtorName,
    debtorId: input.debtorId,
    creditorName: input.creditorName,
    creditorId: input.creditorId,
    remittanceUstrd: input.remittanceUstrd,
    remittanceAdditional: input.remittanceAdditional,
    remittanceCreditorReference: input.remittanceCreditorReference,
    entryAdditionalInfo: input.entryAdditionalInfo,
    txAdditionalInfo: input.txAdditionalInfo,
    refsEndToEndId: input.refsEndToEndId,
    refsInstrId: input.refsInstrId,
    refsPmtInfId: input.refsPmtInfId,
    uetr: input.uetr,
    txAcctSvcrRef: input.txAcctSvcrRef,
    ntryAcctSvcrRef: input.ntryAcctSvcrRef,
    ntryRef: input.ntryRef,
  })

  return {
    counterpart: projection.counterpart,
    counterpartHint: projection.counterpartHint,
    referenceDetails: projection.referenceDetails,
    references: projection.references,
    preferredReference: projection.preferredReference,
    postingText: projection.postingText,
  }
}