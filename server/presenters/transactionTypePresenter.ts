export type TransactionCodeCatalogMap = Map<string, string>

export type TransactionCodeCatalogRow = {
  provider: string | null
  codeKey: string | null
  displayName: string | null
}

type TransactionTypeInput = {
  provider: string | null
  bkTxCdProprietary: string | null
  bkTxCdDomain: string | null
  bkTxCdFamily: string | null
  bkTxCdSubFamily: string | null
  catalogByProviderCodeKey: TransactionCodeCatalogMap
}

export function normalizeTransactionCodeKey(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

export function buildTransactionCodeCatalogMap(rows: TransactionCodeCatalogRow[]): TransactionCodeCatalogMap {
  const catalog = new Map<string, string>()
  for (const row of rows) {
    const provider = normalizeString(row.provider)?.toLowerCase()
    const codeKey = normalizeString(row.codeKey)
    const displayName = normalizeString(row.displayName)
    if (!provider || !codeKey || !displayName) continue
    catalog.set(`${provider}:${normalizeTransactionCodeKey(codeKey)}`, displayName)
  }
  return catalog
}

export function resolveTransactionType(input: TransactionTypeInput): {
  value: string | null
  code: string | null
  hint: string | null
} {
  const provider = normalizeString(input.provider)?.toLowerCase() ?? null
  const proprietary = normalizeString(input.bkTxCdProprietary)

  if (proprietary) {
    const code = normalizeTransactionCodeKey(`PRTRY:${proprietary}`)
    return {
      value: catalogValue(provider, code, input.catalogByProviderCodeKey) ?? proprietary,
      code,
      hint: 'bkTxCdProprietary',
    }
  }

  const parts = [input.bkTxCdDomain, input.bkTxCdFamily, input.bkTxCdSubFamily]
    .map((value) => normalizeString(value))
    .filter((value): value is string => Boolean(value))
    .filter((value, index, values) => values.findIndex((candidate) => candidate.toLowerCase() === value.toLowerCase()) === index)

  if (!parts.length) return { value: null, code: null, hint: null }

  const code = normalizeTransactionCodeKey(parts.join('/'))
  return {
    value: catalogValue(provider, code, input.catalogByProviderCodeKey) ?? parts.join('/'),
    code,
    hint: 'bkTxCdDomain + bkTxCdFamily + bkTxCdSubFamily',
  }
}

function catalogValue(provider: string | null, code: string, catalog: TransactionCodeCatalogMap): string | undefined {
  return provider ? catalog.get(`${provider}:${code}`) : undefined
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}