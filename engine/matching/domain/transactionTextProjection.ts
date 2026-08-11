import { applyPostingTextPolicy } from './postingTextPolicy'

export type TransactionReferenceDetail = {
  value: string
  source: string
}

export type CanonicalTransactionTextInput = {
  transactionId: string
  amount: number
  creditDebitIndicator: string | null
  debtorName?: string | null
  debtorId?: string | null
  creditorName?: string | null
  creditorId?: string | null
  remittanceUstrd?: string[] | null
  remittanceAdditional?: string[] | null
  remittanceCreditorReference?: string | null
  entryAdditionalInfo?: string | null
  txAdditionalInfo?: string | null
  refsEndToEndId?: string | null
  refsInstrId?: string | null
  refsPmtInfId?: string | null
  uetr?: string | null
  txAcctSvcrRef?: string | null
  ntryAcctSvcrRef?: string | null
  ntryRef?: string | null
}

export type CanonicalTransactionTextProjection = {
  counterpart: string | null
  counterpartHint: string | null
  referenceDetails: TransactionReferenceDetail[]
  references: string[]
  preferredReference: string | null
  bankMessage: string
  postingText: string
}

export function projectCanonicalTransactionText(
  input: CanonicalTransactionTextInput,
): CanonicalTransactionTextProjection {
  const counterpart = resolveCounterpartAndHint({
    amount: input.amount,
    creditDebitIndicator: input.creditDebitIndicator,
    debtorName: input.debtorName ?? null,
    debtorId: input.debtorId ?? null,
    creditorName: input.creditorName ?? null,
    creditorId: input.creditorId ?? null,
  })

  const referenceDetails = buildReferenceDetails({
    remittanceUstrd: input.remittanceUstrd ?? null,
    remittanceAdditional: input.remittanceAdditional ?? null,
    remittanceCreditorReference: input.remittanceCreditorReference ?? null,
    entryAdditionalInfo: input.entryAdditionalInfo ?? null,
    txAdditionalInfo: input.txAdditionalInfo ?? null,
    refsEndToEndId: input.refsEndToEndId ?? null,
    refsInstrId: input.refsInstrId ?? null,
    refsPmtInfId: input.refsPmtInfId ?? null,
    uetr: input.uetr ?? null,
    txAcctSvcrRef: input.txAcctSvcrRef ?? null,
    ntryAcctSvcrRef: input.ntryAcctSvcrRef ?? null,
    ntryRef: input.ntryRef ?? null,
  })

  const references = referenceDetails.map((entry) => entry.value)
  const preferredReference = resolvePreferredReference(referenceDetails)
  const bankMessage = resolveBankMessage({
    txAdditionalInfo: input.txAdditionalInfo ?? null,
    remittanceCreditorReference: input.remittanceCreditorReference ?? null,
    remittanceUstrd: input.remittanceUstrd ?? null,
    remittanceAdditional: input.remittanceAdditional ?? null,
    entryAdditionalInfo: input.entryAdditionalInfo ?? null,
  })

  const policyText = applyPostingTextPolicy(bankMessage, counterpart.counterpart ?? undefined)
  const pairedPostingText = [counterpart.counterpart, preferredReference].filter(Boolean).join(' — ')
  const postingText =
    policyText
    || pairedPostingText
    || preferredReference
    || counterpart.counterpart
    || bankMessage
    || input.transactionId

  return {
    counterpart: counterpart.counterpart,
    counterpartHint: counterpart.counterpartHint,
    referenceDetails,
    references,
    preferredReference,
    bankMessage,
    postingText,
  }
}

export function resolveCounterpartAndHint(input: {
  amount: number
  creditDebitIndicator: string | null
  debtorName: string | null
  debtorId: string | null
  creditorName: string | null
  creditorId: string | null
}): { counterpart: string | null; counterpartHint: string | null } {
  const isOutgoing = input.creditDebitIndicator === 'DBIT' || input.amount < 0
  if (isOutgoing) {
    const counterpart = normalizeString(input.creditorName) ?? normalizeString(input.creditorId)
    if (counterpart) {
      return {
        counterpart,
        counterpartHint: normalizeString(input.creditorName) ? 'creditorName' : 'creditorId',
      }
    }

    return { counterpart: null, counterpartHint: null }
  }

  const counterpart = normalizeString(input.debtorName) ?? normalizeString(input.debtorId)
  if (counterpart) {
    return {
      counterpart,
      counterpartHint: normalizeString(input.debtorName) ? 'debtorName' : 'debtorId',
    }
  }

  return {
    counterpart: null,
    counterpartHint: null,
  }
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
  const details: TransactionReferenceDetail[] = []

  const pushReferenceValues = (raw: string | null | undefined, source: string) => {
    const normalizedRaw = normalizeString(raw)
    if (!normalizedRaw) return

    for (const token of normalizedRaw.split(';')) {
      const normalizedToken = normalizeString(token)
      if (!normalizedToken) continue

      const triadMatch = /^(\d{2,3}):([^:]+):(.*)$/.exec(normalizedToken)
      if (triadMatch) {
        const code = triadMatch[1]?.trim()
        const value = normalizeString(triadMatch[3])
        if (!value) continue
        const triadSource = code ? `${source}#${code}` : source
        details.push({ value, source: triadSource })
        continue
      }

      details.push({ value: normalizedToken, source })
    }
  }

  for (const value of input.remittanceAdditional ?? []) {
    pushReferenceValues(value, '/Purp/Prtry')
  }

  for (const value of input.remittanceUstrd ?? []) {
    pushReferenceValues(value, '/RmtInf/Ustrd')
  }

  const singleFieldCandidates: Array<{ value: string | null; source: string }> = [
    { value: input.remittanceCreditorReference, source: '/RmtInf/Strd/CdtrRefInf/Ref' },
    { value: input.entryAdditionalInfo, source: '/Ntry/AddtlNtryInf' },
    { value: input.txAdditionalInfo, source: '/TxDtls/AddtlTxInf' },
    { value: input.refsEndToEndId, source: '/TxDtls/Refs/EndToEndId' },
    { value: input.refsInstrId, source: '/TxDtls/Refs/InstrId' },
    { value: input.refsPmtInfId, source: '/TxDtls/Refs/PmtInfId' },
    { value: input.uetr, source: '/TxDtls/Refs/UETR' },
    { value: input.txAcctSvcrRef, source: '/TxDtls/Refs/AcctSvcrRef' },
    { value: input.ntryAcctSvcrRef, source: '/Ntry/AcctSvcrRef' },
    { value: input.ntryRef, source: '/Ntry/NtryRef' },
  ]

  for (const candidate of singleFieldCandidates) {
    pushReferenceValues(candidate.value, candidate.source)
  }

  const seen = new Set<string>()
  return details.filter((entry) => {
    const key = `${entry.source}:${entry.value}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function resolvePreferredReference(referenceDetails: TransactionReferenceDetail[]): string | null {
  const buckets = buildReferenceBuckets(referenceDetails)

  return (
    firstNonLowSignal(buckets.reference)
    || firstValue(buckets.reference)
    || firstNonLowSignal(buckets.technical)
    || firstValue(buckets.technical)
  )
}

export function resolveBankMessage(input: {
  txAdditionalInfo: string | null
  remittanceCreditorReference: string | null
  remittanceUstrd: string[] | null
  remittanceAdditional: string[] | null
  entryAdditionalInfo: string | null
}): string {
  return (
    input.txAdditionalInfo
    || input.remittanceCreditorReference
    || input.remittanceUstrd?.find(Boolean)
    || input.remittanceAdditional?.find(Boolean)
    || input.entryAdditionalInfo
    || ''
  )
}

type ReferenceBuckets = {
  reference: TransactionReferenceDetail[]
  technical: TransactionReferenceDetail[]
}

export type TransactionReferenceBuckets = {
  reference: TransactionReferenceDetail[]
  teknisk: TransactionReferenceDetail[]
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function classifyReferenceToken(input: TransactionReferenceDetail): keyof ReferenceBuckets {
  const source = String(input.source ?? '').toLowerCase()

  if (source.includes('/rmtinf/ustrd')) return 'reference'
  if (source.includes('/purp/prtry')) return 'reference'
  if (source.includes('/rmtinf/addtlrmtinf')) return 'reference'
  if (source.includes('/addtltxinf')) return 'reference'
  if (source.includes('/addtlntryinf')) return 'technical'

  return 'technical'
}

function buildReferenceBuckets(referenceDetails: TransactionReferenceDetail[]): ReferenceBuckets {
  const seen = {
    reference: new Set<string>(),
    technical: new Set<string>(),
  }

  const buckets: ReferenceBuckets = {
    reference: [],
    technical: [],
  }

  for (const token of splitReferenceTokens(referenceDetails)) {
    const value = normalizeString(token.value)
    if (!value) continue

    const source = normalizeString(token.source) ?? 'Ukendt XML-felt'
    const bucket = classifyReferenceToken({ value, source })
    const dedupKey = `${bucket}:${value.toLowerCase()}`
    if (seen[bucket].has(dedupKey)) continue
    seen[bucket].add(dedupKey)

    buckets[bucket].push({ value, source })
  }

  if (!buckets.reference.length) {
    const promoted = buckets.technical.filter((chip) => isPromotableAddtlNtryInfoReference(chip))
    if (promoted.length) {
      buckets.reference = promoted
      const promotedSet = new Set(promoted.map((chip) => `${chip.source}:${chip.value}`.toLowerCase()))
      buckets.technical = buckets.technical.filter(
        (chip) => !promotedSet.has(`${chip.source}:${chip.value}`.toLowerCase()),
      )
    }
  }

  return buckets
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

function splitReferenceTokens(values: TransactionReferenceDetail[]): TransactionReferenceDetail[] {
  const tokens: TransactionReferenceDetail[] = []
  for (const entry of values) {
    const source = normalizeString(entry.source) ?? 'Ukendt XML-felt'
    const rawValue = String(entry.value ?? '')

    for (const token of rawValue.split(';')) {
      const normalized = normalizeString(token)
      if (!normalized) continue

      const triadMatch = /^(\d{2,3}):([^:]+):(.*)$/.exec(normalized)
      if (triadMatch) {
        const code = triadMatch[1]?.trim()
        const value = normalizeString(triadMatch[3])
        if (!value) continue
        tokens.push({ value, source: code ? `${source}#${code}` : source })
        continue
      }

      tokens.push({ value: normalized, source })
    }
  }

  return tokens
}

function isPromotableAddtlNtryInfoReference(chip: TransactionReferenceDetail): boolean {
  const source = String(chip.source ?? '').toLowerCase()
  const value = String(chip.value ?? '').trim()
  if (!value.length) return false
  if (isLowSignalReference(value)) return false

  return source.includes('/addtlntryinf#500') || source.includes('/addtlntryinf#502')
}

function firstNonLowSignal(values: TransactionReferenceDetail[]): string | null {
  for (const entry of values) {
    const value = String(entry.value ?? '').trim()
    if (!value.length) continue
    if (isLowSignalReference(value)) continue
    return value
  }

  return null
}

function firstValue(values: TransactionReferenceDetail[]): string | null {
  for (const entry of values) {
    const value = String(entry.value ?? '').trim()
    if (!value.length) continue
    return value
  }

  return null
}

function isLowSignalReference(value: string): boolean {
  return /^kon\s+konto\b/i.test(value)
}