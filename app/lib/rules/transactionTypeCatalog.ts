const markerPrefix = '__transaction_type_catalog__:'

export const transactionTypeCategory = 'Transaktionstype' as const

type TransactionTypeCatalogReference = {
  label: string
  codeKeys: string[]
}

export function encodeTransactionTypeCatalogReference(reference: TransactionTypeCatalogReference): string {
  return `${markerPrefix}${JSON.stringify(reference)}`
}

export function decodeTransactionTypeCatalogReference(value: string): TransactionTypeCatalogReference | null {
  if (!value.startsWith(markerPrefix)) return null

  try {
    const parsed = JSON.parse(value.slice(markerPrefix.length)) as Partial<TransactionTypeCatalogReference>
    if (typeof parsed.label !== 'string' || !Array.isArray(parsed.codeKeys)) return null
    const codeKeys = parsed.codeKeys.filter((codeKey): codeKey is string => typeof codeKey === 'string' && codeKey.length > 0)
    return codeKeys.length ? { label: parsed.label, codeKeys } : null
  } catch {
    return null
  }
}

export function transactionTypeCatalogValueLabel(value: string): string {
  return decodeTransactionTypeCatalogReference(value)?.label ?? value
}

export function isTransactionTypeCatalogValue(value: string): boolean {
  return decodeTransactionTypeCatalogReference(value) !== null
}

export function matchesTransactionTypeCatalogReference(
  reference: TransactionTypeCatalogReference,
  transaction: {
    bkTxCdDomain?: string | null
    bkTxCdFamily?: string | null
    bkTxCdSubFamily?: string | null
    bkTxCdProprietary?: string | null
  },
): boolean {
  const sourceCode = transaction.bkTxCdProprietary
    ? `PRTRY:${transaction.bkTxCdProprietary}`
    : [transaction.bkTxCdDomain, transaction.bkTxCdFamily, transaction.bkTxCdSubFamily]
        .filter((value): value is string => Boolean(value?.trim()))
        .filter((value, index, values) => values.findIndex(candidate => candidate.toLowerCase() === value.toLowerCase()) === index)
        .join('/')

  return reference.codeKeys.some(codeKey => codeKey.trim().toLowerCase() === sourceCode.trim().toLowerCase())
}
