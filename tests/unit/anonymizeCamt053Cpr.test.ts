import { describe, expect, it } from 'vitest'
import { extractCprFromTransaction } from '../../engine/matching/domain/postingUtils'
import { anonymizeCamt053Cpr, prepareCamt053XmlForIngestion } from '../../engine/banking-ingestion/handlers/camt053/anonymizeCamt053Cpr'
import { parseCamt053Xml } from '../../engine/banking-ingestion/handlers/camt053/parseCamt053Xml'

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt><Stmt><Id>STMT-1</Id><Acct><Id><IBAN>DK0012345678900000</IBAN></Id><Ccy>DKK</Ccy></Acct>
    <Ntry><NtryRef>0102031234</NtryRef><AddtlNtryInf>entry 010203-1234</AddtlNtryInf>
      <Amt Ccy="DKK">100.00</Amt><CdtDbtInd>CRDT</CdtDbtInd><BookgDt><Dt>2026-06-30</Dt></BookgDt>
      <NtryDtls><TxDtls><AddtlTxInf>tx 0203045678</AddtlTxInf>
        <Purp><Prtry>purpose 0304051234</Prtry></Purp>
        <RmtInf><Ustrd>remittance 040506-1234 and 0506071234</Ustrd><AddtlRmtInf>additional 0607081234</AddtlRmtInf>
          <Strd><CdtrRefInf><Ref>0708091234</Ref></CdtrRefInf></Strd>
        </RmtInf>
      </TxDtls></NtryDtls>
    </Ntry>
  </Stmt></BkToCstmrStmt>
</Document>`

describe('anonymizeCamt053Cpr', () => {
  it('redacts matching fields while preserving other XML fields', () => {
    const sanitized = anonymizeCamt053Cpr(xml)
    const parsed = parseCamt053Xml(sanitized)
    const tx = parsed.statements[0]!.transactions[0]!

    expect(sanitized).not.toContain('010203-1234')
    expect(sanitized).not.toContain('0203045678')
    expect(sanitized).not.toContain('0304051234')
    expect(sanitized).not.toContain('040506-1234')
    expect(sanitized).not.toContain('0506071234')
    expect(sanitized).not.toContain('0607081234')
    expect(sanitized).toContain('<NtryRef>0102031234</NtryRef>')
    expect(sanitized).toContain('<Ref>0708091234</Ref>')
    expect(tx.entryAdditionalInfo).toBe('entry [CPR REDACTED]')
    expect(tx.txAdditionalInfo).toBe('tx [CPR REDACTED]')
    expect(tx.remittanceUstrd).toEqual(['remittance [CPR REDACTED] and [CPR REDACTED]'])
    expect(tx.remittanceAdditional).toEqual(['purpose [CPR REDACTED]', 'additional [CPR REDACTED]'])
    expect(extractCprFromTransaction({
      transactionId: '00000000-0000-0000-0000-00000000beef',
      amount: 100,
      statusDimensions: {},
      ...tx,
    })).toBeUndefined()
  })

  it('only sanitizes in development', () => {
    expect(prepareCamt053XmlForIngestion(xml, 'development')).not.toContain('010203-1234')
    expect(prepareCamt053XmlForIngestion(xml, 'production')).toBe(xml)
    expect(prepareCamt053XmlForIngestion(xml, 'test')).toBe(xml)
    expect(prepareCamt053XmlForIngestion(xml, undefined)).toBe(xml)
  })
})