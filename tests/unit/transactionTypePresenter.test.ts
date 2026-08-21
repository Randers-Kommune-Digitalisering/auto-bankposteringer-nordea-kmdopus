import { describe, expect, it } from 'vitest'

import { buildTransactionCodeCatalogMap, normalizeTransactionCodeKey, resolveTransactionType } from '../../server/presenters/transactionTypePresenter'

describe('transactionTypePresenter', () => {
  it('resolves provider-scoped proprietary catalog labels', () => {
    const result = resolveTransactionType({
      provider: 'Nordea',
      bkTxCdProprietary: ' BGS ',
      bkTxCdDomain: null,
      bkTxCdFamily: null,
      bkTxCdSubFamily: null,
      catalogByProviderCodeKey: new Map([['nordea:PRTRY:BGS', 'Betalingsservice']]),
    })

    expect(result).toEqual({
      value: 'Betalingsservice',
      code: 'PRTRY:BGS',
      hint: 'bkTxCdProprietary',
    })
  })

  it('deduplicates domain code components case-insensitively before lookup', () => {
    const result = resolveTransactionType({
      provider: 'nordea',
      bkTxCdProprietary: null,
      bkTxCdDomain: 'PMNT',
      bkTxCdFamily: 'pmnt',
      bkTxCdSubFamily: 'ICDT',
      catalogByProviderCodeKey: new Map([['nordea:PMNT/ICDT', 'Kreditoverførsel']]),
    })

    expect(result).toEqual({
      value: 'Kreditoverførsel',
      code: 'PMNT/ICDT',
      hint: 'bkTxCdDomain + bkTxCdFamily + bkTxCdSubFamily',
    })
  })

  it('falls back to the normalized source code when no catalog label exists', () => {
    const result = resolveTransactionType({
      provider: null,
      bkTxCdProprietary: null,
      bkTxCdDomain: ' PMNT ',
      bkTxCdFamily: 'ICDT',
      bkTxCdSubFamily: null,
      catalogByProviderCodeKey: new Map(),
    })

    expect(result).toEqual({
      value: 'PMNT/ICDT',
      code: 'PMNT/ICDT',
      hint: 'bkTxCdDomain + bkTxCdFamily + bkTxCdSubFamily',
    })
  })

  it('normalizes whitespace and casing in catalog keys', () => {
    expect(normalizeTransactionCodeKey(' prtry: BGS ')).toBe('PRTRY:BGS')
  })

  it('builds the same provider-scoped catalog map used by API presenters', () => {
    const catalog = buildTransactionCodeCatalogMap([
      { provider: ' Nordea ', codeKey: ' prtry: BGS ', displayName: 'Betalingsservice' },
      { provider: null, codeKey: 'IGNORED', displayName: 'Ignored' },
    ])

    expect(catalog).toEqual(new Map([['nordea:PRTRY:BGS', 'Betalingsservice']]))
  })
})
