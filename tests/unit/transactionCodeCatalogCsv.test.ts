import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { parseTransactionCodeCatalogCsv } from '../../engine/banking-ingestion/domain/transactionCodeCatalogCsv'

const headers = 'provider,codeKey,displayName,domain,family,subFamily,proprietary,description,sourceDocument,isActive'

describe('parseTransactionCodeCatalogCsv', () => {
  it('normalizes keys and optional fields for the expected provider', () => {
    const rows = parseTransactionCodeCatalogCsv(
      `${headers}\nnordea,prtry: bgs ,Betalingsservice,,,,BGS,,,true`,
      'nordea',
    )

    expect(rows).toEqual([{
      codeKey: 'PRTRY:BGS',
      displayName: 'Betalingsservice',
      domain: undefined,
      family: undefined,
      subFamily: undefined,
      proprietary: 'BGS',
      description: undefined,
      sourceDocument: undefined,
      isActive: true,
    }])
  })

  it('rejects empty catalogs and provider mismatches', () => {
    expect(() => parseTransactionCodeCatalogCsv(headers, 'nordea')).toThrow('contains no rows')
    expect(() => parseTransactionCodeCatalogCsv(
      `${headers}\ndanskebank,PMNT/ICDT/CORT,Overførsel,,,,,,,true`,
      'nordea',
    )).toThrow('provider must be nordea')
  })

  it('rejects duplicate keys and rows missing required labels', () => {
    const duplicateRows = `${headers}\nnordea,PMNT/ICDT,Credit,,,,,,,true\nnordea,PMNT/ICDT,Another label,,,,,,,true`
    const invalidRow = `${headers}\nnordea,PMNT/ICDT,,,,,,,,true`

    expect(() => parseTransactionCodeCatalogCsv(duplicateRows, 'nordea')).toThrow('duplicate codeKey PMNT/ICDT')
    expect(() => parseTransactionCodeCatalogCsv(invalidRow, 'nordea')).toThrow('Row 2:')
  })

  it.each(['danskebank', 'nordea'] as const)('accepts the committed %s catalog', async (provider) => {
    const csv = await readFile(
      new URL(`../../resources/banking/${provider}/transaction-code-catalog.dk.csv`, import.meta.url),
      'utf8',
    )

    expect(parseTransactionCodeCatalogCsv(csv, provider).length).toBeGreaterThan(0)
  })
})