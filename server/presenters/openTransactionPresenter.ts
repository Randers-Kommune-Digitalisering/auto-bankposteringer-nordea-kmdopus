import type {
  OpenTransaction,
  OpenTransactionInput,
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
      transactionType: input.transactionType,
      counterpart: input.counterpart,
      references: input.references,
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

  const sections: TransactionSummarySection[] = [
    {
      key: 'part',
      label: 'Part',
      items: [
        {
          label: counterpartRole,
          value: input.counterpart ?? 'Ukendt modpart',
        },
      ],
    },
    {
      key: 'fritekst',
      label: 'Fritekst',
      chips: references,
    },
    {
      key: 'transaktionstype',
      label: 'Transaktionstype',
      items: [
        {
          label: 'Type',
          value: input.transactionType ?? 'Ukendt type',
        },
        {
          label: 'Kørsels-ID',
          value: input.runId,
        },
        {
          label: 'Transaktions-ID',
          value: input.id,
        },
      ],
    },
  ]

  return {
    amount: {
      label: 'Beløb',
      value: currencyFormatter.format(amountValue),
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

function formatDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return dateFormatter.format(new Date())
  }
  return dateFormatter.format(parsed)
}
