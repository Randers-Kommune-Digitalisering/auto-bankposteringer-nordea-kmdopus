import type {
  OpenTransaction,
  OpenTransactionInput,
  TransactionReferenceDetail,
  TransactionSummary,
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
      underlyingTransactionCount: input.underlyingTransactionCount,
      transactionType: input.transactionType,
      transactionTypeCode: input.transactionTypeCode,
      transactionTypeHint: input.transactionTypeHint,
      counterpart: input.counterpart,
      counterpartHint: input.counterpartHint,
      counterpartSource: input.counterpartSource ?? input.counterpartHint,
      references: input.references,
      referenceDetails: input.referenceDetails,
    }),
  }
}

export function buildTransactionSummaryView(input: TransactionSummaryInput): TransactionSummary {
  const amountValue = typeof input.amount === 'number' ? input.amount : 0
  const direction: TransactionSummary['direction'] = amountValue >= 0 ? 'credit' : 'debit'
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
  const sections: TransactionSummarySection[] = [
    {
      key: 'part',
      label: 'Modpart',
      fields: input.counterpart?.trim()
        ? [{
          label: 'Modpart',
          value: input.counterpart.trim(),
          sourcePath: input.counterpartSource?.trim() || input.counterpartHint?.trim() || undefined,
        }]
        : [],
    },
    {
      key: 'reference',
      label: 'Reference',
      fields: referenceDetails.map((entry) => ({
        label: entry.source,
        value: entry.value,
        sourcePath: entry.source,
      })),
    },
    {
      key: 'transaktionstype',
      label: 'Transaktionstype',
      fields: input.transactionType
        ? [{
          label: 'Transaktionstype',
          value: input.transactionType,
          sourcePath: input.transactionTypeHint?.trim() || undefined,
        }]
        : [],
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
      value: input.underlyingTransactionCount && input.underlyingTransactionCount > 1
        ? `Samlepost (${input.underlyingTransactionCount} underliggende transaktioner)`
        : input.id,
    },
    direction,
    sections,
  }
}

function formatSignedAmount(amount: number): string {
  const value = Number(amount) || 0
  if (value < 0) return `-${currencyFormatter.format(Math.abs(value))}`
  if (value > 0) return `${currencyFormatter.format(value)}`
  return currencyFormatter.format(0)
}

function formatDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return dateFormatter.format(new Date())
  }
  return dateFormatter.format(parsed)
}
