import type {
  OpenTransaction,
  OpenTransactionInput,
  TransactionReferenceDetail,
  TransactionSummary,
  TransactionSummaryChip,
  TransactionSummaryInput,
  TransactionSummarySection,
} from '~/types/transactions'

const currencyFormatter = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
})

const dateFormatter = new Intl.DateTimeFormat('da-DK', {
  dateStyle: 'medium',
})

export function presentOpenTransaction(input: OpenTransactionInput): OpenTransaction {
  return {
    ...input,
    summary: buildTransactionSummaryView({
      id: input.id,
      runId: input.runId,
      bookingDate: input.bookingDate,
      amount: input.amount,
      transactionType: input.transactionType,
      transactionTypeCode: input.transactionTypeCode,
      counterpart: input.counterpart,
      counterpartHint: input.counterpartHint,
      references: input.references,
      referenceDetails: input.referenceDetails,
    }),
  }
}

export function buildTransactionSummaryView(input: TransactionSummaryInput): TransactionSummary {
  const amountValue = typeof input.amount === 'number' ? input.amount : 0
  const direction: TransactionSummary['direction'] = amountValue >= 0 ? 'credit' : 'debit'
  const counterpartRole = direction === 'credit' ? 'Afsender' : 'Modtager'
  const references = Array.isArray(input.references)
    ? input.references.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : []
  const referenceDetails = Array.isArray(input.referenceDetails)
    ? input.referenceDetails
      .filter((entry): entry is TransactionReferenceDetail => Boolean(entry?.value?.trim()))
      .map((entry) => ({
        value: entry.value.trim(),
        source: entry.source?.trim() || 'Ukendt XML-felt',
      }))
    : references.map((value) => ({ value, source: 'Ukendt XML-felt' }))
  const summaryReferences = buildSummaryReferences(referenceDetails)

  const referenceSection: TransactionSummarySection | null = summaryReferences.reference.length
    ? {
      key: 'reference',
      label: 'Reference',
      chips: summaryReferences.reference,
    }
    : null

  const technicalSection: TransactionSummarySection | null = summaryReferences.teknisk.length
    ? {
      key: 'teknisk',
      label: 'Øvrige oplysninger',
      chips: summaryReferences.teknisk,
    }
    : null

  const sections: TransactionSummarySection[] = [
    {
      key: 'part',
      label: counterpartRole,
      items: [
        {
          label: counterpartRole,
          value: input.counterpart ?? 'Ukendt',
          hint: input.counterpartHint?.trim() || undefined,
        },
      ],
    },
    ...(referenceSection ? [referenceSection] : []),
    ...(technicalSection ? [technicalSection] : []),
    {
      key: 'transaktionstype',
      label: 'Transaktionstype',
      items: [
        {
          label: 'Type',
          value: input.transactionType ?? 'Ukendt type',
          hint: input.transactionTypeHint?.trim() || input.transactionTypeCode?.trim() || undefined,
        },
      ],
    },
  ]

  return {
    amount: {
      label: 'Beløb',
      value: formatSignedAmount(amountValue),
      raw: amountValue,
    },
    bookingDate: {
      label: 'Bogføringsdato',
      value: formatDate(input.bookingDate),
    },
    transactionId: {
      label: 'Transaktions-ID',
      value: input.id,
    },
    direction,
    counterpartRole,
    sections,
  }
}

function formatSignedAmount(amount: number): string {
  const value = Number(amount) || 0
  if (value < 0) return `-${currencyFormatter.format(Math.abs(value))}`
  if (value > 0) return `+${currencyFormatter.format(value)}`
  return currencyFormatter.format(0)
}

function splitReferenceTokens(values: TransactionReferenceDetail[]): TransactionReferenceDetail[] {
  const tokens: TransactionReferenceDetail[] = []
  for (const entry of values) {
    const source = String(entry.source ?? '').trim() || 'Ukendt XML-felt'
    for (const token of String(entry.value ?? '').split(';')) {
      const normalized = token.trim()
      if (!normalized) continue
      tokens.push({ value: normalized, source })
    }
  }
  return tokens
}

type ReferenceBuckets = {
  reference: TransactionSummaryChip[]
  teknisk: TransactionSummaryChip[]
}

function classifyReferenceToken(input: TransactionReferenceDetail): keyof ReferenceBuckets {
  const source = String(input.source ?? '').toLowerCase()

  if (source.includes('/rmtinf/ustrd')) return 'reference'
  if (source.includes('/purp/prtry')) return 'reference'
  if (source.includes('/rmtinf/addtlrmtinf')) return 'reference'
  if (source.includes('/addtltxinf')) return 'reference'

  // Nordea AddtlNtryInf triads are treated as supplementary system fields.
  if (source.endsWith('/addtlntryinf')) return 'teknisk'

  return 'teknisk'
}

function buildSummaryReferences(references: TransactionReferenceDetail[]): ReferenceBuckets {
  const seen = {
    reference: new Set<string>(),
    teknisk: new Set<string>(),
  }
  const chips: ReferenceBuckets = {
    reference: [],
    teknisk: [],
  }

  for (const token of splitReferenceTokens(references)) {
    const bucket = classifyReferenceToken(token)
    const dedupKey = token.value.toLowerCase()
    if (seen[bucket].has(dedupKey)) continue
    seen[bucket].add(dedupKey)
    chips[bucket].push({ value: token.value, source: token.source })
  }

  return chips
}

function formatDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return dateFormatter.format(new Date())
  }
  return dateFormatter.format(parsed)
}
