export const TRANSACTION_BADGE_COLUMN_CLASS = 'flex flex-wrap gap-1'

export const TRANSACTION_BADGE_STYLE = {
  counterpart: {
    variant: 'subtle' as const,
    color: 'secondary' as const,
    class: 'capitalize',
  },
  freeTextOrReference: {
    variant: 'subtle' as const,
    color: 'primary' as const,
    class: 'capitalize',
  },
  transactionType: {
    variant: 'subtle' as const,
    color: 'warning' as const,
    class: 'capitalize',
  },
} as const
