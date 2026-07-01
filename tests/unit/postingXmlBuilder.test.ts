import { describe, expect, it } from 'vitest'
import { buildErpPostingXml } from '../../engine/erp-integration/infrastructure/adapters/kmd/postingXmlBuilder'

describe('buildErpPostingXml', () => {
  const basePosting = {
    transactionId: 'tx-1',
    debetOrCredit: 'Debet' as const,
    dimensions: { artskonto: '12345678' },
    text: 'Test',
  }

  it('parses dot-decimal amounts without shifting decimal places', () => {
    const result = buildErpPostingXml([
      {
        ...basePosting,
        amount: '2564.5',
      },
    ], {
      bookingDate: '20260131',
      metadataOverride: {
        integrationFileNameMask: 'TEST.xml',
      },
    })

    expect(result.payload).toContain('<AMT_DOCCUR>2564.50</AMT_DOCCUR>')
    expect(result.debitSumInOre).toBe(256450)
  })

  it('parses comma-decimal amounts consistently', () => {
    const result = buildErpPostingXml([
      {
        ...basePosting,
        amount: '2564,5',
      },
    ], {
      bookingDate: '20260131',
      metadataOverride: {
        integrationFileNameMask: 'TEST.xml',
      },
    })

    expect(result.payload).toContain('<AMT_DOCCUR>2564.50</AMT_DOCCUR>')
    expect(result.debitSumInOre).toBe(256450)
  })

  it('builds placeholder filename mask with municipality before integration id', () => {
    const result = buildErpPostingXml([
      {
        ...basePosting,
        amount: 10,
      },
    ], {
      bookingDate: '20260131',
      documentDate: new Date(2026, 0, 31, 12, 34, 56),
      metadataOverride: {
        municipalityCode: '730',
        integrationId: '6ROB',
        integrationFileNameMask: 'ZFIR_KMD_Opus_Posteringer_IND_{municipalityCode}_{integrationId}_{docDate}_{docTime}.xml',
      },
    })

    expect(result.filename).toBe('ZFIR_KMD_Opus_Posteringer_IND_730_6ROB_20260131_123456.xml')
  })
})
