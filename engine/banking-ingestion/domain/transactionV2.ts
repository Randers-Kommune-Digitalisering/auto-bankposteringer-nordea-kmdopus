// Normalize and deduplicate transaction data from various sources, ensuring consistent representation.

export type TransactionDirectionV2 = 'debit' | 'credit'

export type TransactionSourceScopeV2 = 'entry' | 'tx' | 'remittance' | 'party'

export type TransactionReferenceTypeV2 =
  | 'reference'
  | 'freetext'
  | 'technical'
  | 'remittance'

export type TransactionPartyRoleV2 =
  | 'debtor'
  | 'creditor'
  | 'ultimateDebtor'
  | 'ultimateCreditor'

export type TransactionCounterpartyRoleV2 = 'sender' | 'receiver'

export type TransactionCoreV2 = {
  transactionId: string
  runId: string
  accountId: string
  bookingDate: Date
  valueDate: Date | null
  amount: string
  currency: string | null
  direction: TransactionDirectionV2
  status: string | null
  transactionType: string | null
}

export type TransactionReferenceV2 = {
  xmlPath: string
  sourceScope: TransactionSourceScopeV2
  referenceType: TransactionReferenceTypeV2
  sequenceNo: number
  valueRaw: string
  valueNormalized: string
}

export type TransactionPartyV2 = {
  role: TransactionPartyRoleV2
  displayName: string | null
  identifier: string | null
  accountIban: string | null
  xmlPathName: string | null
  xmlPathId: string | null
  sequenceNo: number
}

export type TransactionRemittanceV2 = {
  unstructured: string[]
  creditorReference: string | null
  additional: string[]
}

export type TransactionEnvelopeV2 = {
  core: TransactionCoreV2
  references: TransactionReferenceV2[]
  parties: TransactionPartyV2[]
  remittance: TransactionRemittanceV2
}

export function normalizeReferenceValueV2(value: string): string {
  return String(value ?? '').trim()
}

// Dedupe must preserve provenance. Same value in two XML paths is not the same record.
export function buildReferenceDedupKeyV2(input: {
  xmlPath: string
  valueNormalized: string
}): string {
  return `${input.xmlPath}::${input.valueNormalized.toLowerCase()}`
}

export function resolveCounterpartyRoleV2(
  direction: TransactionDirectionV2,
): TransactionCounterpartyRoleV2 {
  return direction === 'credit' ? 'sender' : 'receiver'
}

export function resolvePrimaryCounterpartyV2(input: {
  direction: TransactionDirectionV2
  parties: TransactionPartyV2[]
}): string | null {
  const senderOrder: TransactionPartyRoleV2[] = ['debtor', 'ultimateDebtor', 'creditor', 'ultimateCreditor']
  const receiverOrder: TransactionPartyRoleV2[] = ['creditor', 'ultimateCreditor', 'debtor', 'ultimateDebtor']
  const roleOrder = input.direction === 'credit' ? senderOrder : receiverOrder

  for (const role of roleOrder) {
    const candidates = input.parties.filter((party) => party.role === role)
    for (const party of candidates) {
      if (party.displayName && party.displayName.trim()) return party.displayName.trim()
      if (party.identifier && party.identifier.trim()) return party.identifier.trim()
      if (party.accountIban && party.accountIban.trim()) return party.accountIban.trim()
    }
  }

  return null
}
