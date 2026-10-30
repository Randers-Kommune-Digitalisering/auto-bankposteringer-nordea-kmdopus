export type TransactionReferenceDetail = {
  value: string
  source: string
}

export type CanonicalTransactionTextInput = {
  transactionId: string
  amount: number
  creditDebitIndicator: string | null
  entryAdditionalInfo?: string | null
  ntryAcctSvcrRef?: string | null
  ntryRef?: string | null
}

export type CanonicalTransactionTextProjection = {
  counterpart: null
  counterpartHint: null
  referenceDetails: TransactionReferenceDetail[]
  references: string[]
  preferredReference: string | null
  bankMessage: string
  postingText: string
}

export function projectCanonicalTransactionText(
  input: CanonicalTransactionTextInput,
): CanonicalTransactionTextProjection {
  const referenceDetails = buildReferenceDetails({
    entryAdditionalInfo: input.entryAdditionalInfo ?? null,
    ntryAcctSvcrRef: input.ntryAcctSvcrRef ?? null,
    ntryRef: input.ntryRef ?? null,
  })
  const references = referenceDetails.map((entry) => entry.value)
  const preferredReference = resolvePreferredReference(referenceDetails)
  const bankMessage = resolveBankMessage(input.entryAdditionalInfo ?? null)
  const postingText = preferredReference || bankMessage || input.transactionId

  return {
    counterpart: null,
    counterpartHint: null,
    referenceDetails,
    references,
    preferredReference,
    bankMessage,
    postingText,
  }
}

export function buildReferenceDetails(input: {
  entryAdditionalInfo: string | null
  ntryAcctSvcrRef: string | null
  ntryRef: string | null
}): TransactionReferenceDetail[] {
  const candidates: Array<{ value: string | null; source: string }> = [
    { value: input.entryAdditionalInfo, source: '/Ntry/AddtlNtryInf' },
    { value: input.ntryAcctSvcrRef, source: '/Ntry/AcctSvcrRef' },
    { value: input.ntryRef, source: '/Ntry/NtryRef' },
  ]
  const seen = new Set<string>()
  const details: TransactionReferenceDetail[] = []

  for (const candidate of candidates) {
    const value = normalizeString(candidate.value)
    if (!value) continue
    const key = `${candidate.source}:${value}`.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    details.push({ value, source: candidate.source })
  }

  return details
}

export function resolvePreferredReference(referenceDetails: TransactionReferenceDetail[]): string | null {
  const buckets = buildReferenceBuckets(referenceDetails)
  return firstNonLowSignal(buckets.reference)
    || firstValue(buckets.reference)
    || firstNonLowSignal(buckets.technical)
    || firstValue(buckets.technical)
}

export function resolveBankMessage(entryAdditionalInfo: string | null): string {
  return entryAdditionalInfo ?? ''
}

type ReferenceBuckets = {
  reference: TransactionReferenceDetail[]
  technical: TransactionReferenceDetail[]
}

export type TransactionReferenceBuckets = {
  reference: TransactionReferenceDetail[]
  teknisk: TransactionReferenceDetail[]
}

export function buildTransactionReferenceBuckets(
  referenceDetails: TransactionReferenceDetail[],
): TransactionReferenceBuckets {
  const buckets = buildReferenceBuckets(referenceDetails)
  return {
    reference: buckets.reference,
    teknisk: buckets.technical,
  }
}

function buildReferenceBuckets(referenceDetails: TransactionReferenceDetail[]): ReferenceBuckets {
  const buckets: ReferenceBuckets = { reference: [], technical: [] }
  const seen = new Set<string>()

  for (const entry of referenceDetails) {
    const value = normalizeString(entry.value)
    if (!value) continue
    const source = normalizeString(entry.source) ?? 'Ukendt XML-felt'
    const bucket = source.toLowerCase().includes('/addtlntryinf') ? 'technical' : 'reference'
    const key = `${bucket}:${value.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    buckets[bucket].push({ value, source })
  }

  if (!buckets.reference.length) {
    const promoted = buckets.technical.filter(isPromotableAddtlNtryInfoReference)
    if (promoted.length) {
      buckets.reference = promoted
      const promotedValues = new Set(promoted.map((entry) => `${entry.source}:${entry.value}`.toLowerCase()))
      buckets.technical = buckets.technical.filter(
        (entry) => !promotedValues.has(`${entry.source}:${entry.value}`.toLowerCase()),
      )
    }
  }

  return buckets
}

function isPromotableAddtlNtryInfoReference(entry: TransactionReferenceDetail): boolean {
  const source = entry.source.toLowerCase()
  return (source.includes('#500') || source.includes('#502'))
    && Boolean(entry.value.trim())
    && !isLowSignalReference(entry.value)
}

function firstNonLowSignal(values: TransactionReferenceDetail[]): string | null {
  return values.find((entry) => entry.value.trim() && !isLowSignalReference(entry.value))?.value ?? null
}

function firstValue(values: TransactionReferenceDetail[]): string | null {
  return values.find((entry) => entry.value.trim())?.value ?? null
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function isLowSignalReference(value: string): boolean {
  return /^kon\s+konto\b/i.test(value)
}
