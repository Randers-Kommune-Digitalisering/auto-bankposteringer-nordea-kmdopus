import { describe, expect, it } from 'vitest'
import {
  buildNordeaDeterministicGroupKey,
  extractNordeaGroupingIdentifiers,
  findNordeaAdditionalEntryInfoValueByCode,
  parseNordeaAdditionalEntryInfo,
} from '../../engine/banking-ingestion/handlers/camt053/nordeaAdditionalEntryInfo'

describe('nordeaAdditionalEntryInfo', () => {
  it('parses deterministic code:label:value segments', () => {
    const input = '502:REFERENCE:02003503530012805265;501:REFERENCE:tub310l90zyz7lxxknk1;559:GSIPTRANSACTIONDETKEY:20260529GIDK37116671;804:NOTICE NUMBER:20956766626149;502:REFERENCE:KON konto 0970205918'
    const segments = parseNordeaAdditionalEntryInfo(input)

    expect(segments).toHaveLength(5)
    expect(segments[0]).toEqual({ code: '502', label: 'REFERENCE', value: '02003503530012805265' })
    expect(segments[2]).toEqual({ code: '559', label: 'GSIPTRANSACTIONDETKEY', value: '20260529GIDK37116671' })
    expect(segments[3]).toEqual({ code: '804', label: 'NOTICE NUMBER', value: '20956766626149' })
  })

  it('extracts grouping identifiers with 528 preferred over 559', () => {
    const input = '500:REFERENCE:NKS-KY;196:ID.:47447409132;528:SUMMARY ITEM:013711357;559:GSIPTRANSACTIONDETKEY:20260529GIDK37116671'
    const ids = extractNordeaGroupingIdentifiers(input)

    expect(ids).toEqual({
      summaryItemId: '013711357',
      gsipTransactionDetailKey: '20260529GIDK37116671',
      idTag: '47447409132',
    })
  })

  it('builds deterministic group key from 528 and falls back to 559', () => {
    const bookingDate = new Date('2026-05-29T00:00:00.000Z')

    const fromSummary = buildNordeaDeterministicGroupKey({
      accountId: 'DK4420000970205918-DKK',
      bookingDate,
      creditDebitIndicator: 'CRDT',
      entryAdditionalInfo: '500:REFERENCE:NKS-KY;196:ID.:47447409132;528:SUMMARY ITEM:013711357',
    })

    const fromGsip = buildNordeaDeterministicGroupKey({
      accountId: 'DK4420000970205918-DKK',
      bookingDate,
      creditDebitIndicator: 'CRDT',
      entryAdditionalInfo: '501:REFERENCE:tub310l90zyz7lxxknk1;559:GSIPTRANSACTIONDETKEY:20260529GIDK37116671',
    })

    expect(fromSummary).toContain('nordea:summary:')
    expect(fromSummary).toContain('013711357')
    expect(fromGsip).toContain('nordea:gsip:')
    expect(fromGsip).toContain('20260529GIDK37116671')
  })

  it('falls back to Ntry entry identity when summary identifiers are absent', () => {
    const bookingDate = new Date('2026-06-03T00:00:00.000Z')

    const key = buildNordeaDeterministicGroupKey({
      accountId: 'DK6520005908764988-DKK',
      bookingDate,
      creditDebitIndicator: 'CRDT',
      entryAdditionalInfo: '502:REFERENCE:K 84788767-02.06;501:REFERENCE:120260603000005850',
      ntryRef: '141',
      ntryAcctSvcrRef: 'K 84788767-02.06',
    })

    expect(key).toContain('nordea:ntry:')
    expect(key).toContain(':141:')
    expect(key).toContain('K 84788767-02.06')
  })

  it('extracts field 510 value for creditor fallback', () => {
    const segments = parseNordeaAdditionalEntryInfo('510:CREDITOR:Randers Leverandoer;500:REFERENCE:ABC')
    expect(findNordeaAdditionalEntryInfoValueByCode(segments, '510')).toBe('Randers Leverandoer')
  })
})
