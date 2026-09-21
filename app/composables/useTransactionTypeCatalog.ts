export type TransactionTypeCatalogRow = {
  provider: string
  codeKey: string
  displayName: string
  domain: string | null
  family: string | null
  subFamily: string | null
  proprietary: string | null
}

export type TransactionTypeOption = {
  label: string
  value: string
  codeKeys: string[]
  rows: TransactionTypeCatalogRow[]
}

export function buildTransactionTypeOptions(rows: TransactionTypeCatalogRow[]): TransactionTypeOption[] {
  const byDisplayName = new Map<string, TransactionTypeOption>()

  for (const row of rows) {
    const label = row.displayName.trim()
    const codeKey = row.codeKey.trim()
    if (!label || !codeKey) continue

    const existing = byDisplayName.get(label)
    if (existing) {
      if (!existing.codeKeys.includes(codeKey)) existing.codeKeys.push(codeKey)
      existing.rows.push(row)
      continue
    }

    byDisplayName.set(label, {
      label,
      value: label,
      codeKeys: [codeKey],
      rows: [row],
    })
  }

  return Array.from(byDisplayName.values()).sort((left, right) =>
    left.label.localeCompare(right.label, 'da', { sensitivity: 'base' }),
  )
}

export function useTransactionTypeCatalog() {
  const { data, pending, error } = useFetch<TransactionTypeCatalogRow[]>('/api/transaction-code-catalog', {
    key: 'transaction-code-catalog',
    default: () => [],
  })

  const options = computed(() => buildTransactionTypeOptions(data.value ?? []))

  return { data, pending, error, options }
}
