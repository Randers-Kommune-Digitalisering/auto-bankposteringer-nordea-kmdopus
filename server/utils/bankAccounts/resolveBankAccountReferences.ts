export type BankAccountReferenceCandidate = {
  id: string
  iban: string
}

export type BankAccountReferenceResolution =
  | { kind: 'resolved'; accountId: string }
  | { kind: 'unknown' }
  | { kind: 'ambiguous' }

export function normalizeIbanReference(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase()
}

export function resolveBankAccountReferences(
  references: string[],
  candidates: BankAccountReferenceCandidate[],
): Map<string, BankAccountReferenceResolution> {
  const accountById = new Map(candidates.map(candidate => [candidate.id, candidate.id]))
  const accountsByIban = new Map<string, string[]>()

  for (const candidate of candidates) {
    const iban = normalizeIbanReference(candidate.iban)
    const accountIds = accountsByIban.get(iban) ?? []
    accountIds.push(candidate.id)
    accountsByIban.set(iban, accountIds)
  }

  return new Map<string, BankAccountReferenceResolution>(references.map((reference): [string, BankAccountReferenceResolution] => {
    const exactAccountId = accountById.get(reference)
    if (exactAccountId) {
      return [reference, { kind: 'resolved', accountId: exactAccountId }]
    }

    const matchingAccountIds = accountsByIban.get(normalizeIbanReference(reference)) ?? []
    if (matchingAccountIds.length === 1) {
      return [reference, { kind: 'resolved', accountId: matchingAccountIds[0]! }]
    }
    if (matchingAccountIds.length > 1) {
      return [reference, { kind: 'ambiguous' }]
    }
    return [reference, { kind: 'unknown' }]
  }))
}
