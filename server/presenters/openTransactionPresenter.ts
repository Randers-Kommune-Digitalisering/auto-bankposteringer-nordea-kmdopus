import type {
  OpenTransaction,
  OpenTransactionInput,
  TransactionReferenceDetail,
  TransactionSummary,
  TransactionSummaryChip,
  TransactionSummaryInput,
  TransactionSummarySection,
} from '~/types/transactions'
import { buildTransactionReferenceBuckets } from '~~/engine/matching/domain/transactionTextProjection'

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
          value: input.counterpart ?? '-',
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
  if (value > 0) return `${currencyFormatter.format(value)}`
  return currencyFormatter.format(0)
}

type ReferenceBuckets = {
  reference: TransactionSummaryChip[]
  teknisk: TransactionSummaryChip[]
}

function buildSummaryReferences(references: TransactionReferenceDetail[]): ReferenceBuckets {
  const buckets = buildTransactionReferenceBuckets(references)
  return {
    reference: buckets.reference.map((chip) => ({ value: chip.value, source: chip.source })),
    teknisk: buckets.teknisk.map((chip) => ({ value: chip.value, source: chip.source })),
  }
}

function formatDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return dateFormatter.format(new Date())
  }
  return dateFormatter.format(parsed)
}
