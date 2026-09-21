import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseCamt053Xml } from '../../engine/banking-ingestion/handlers/camt053/parseCamt053Xml'

describe('parseCamt053Xml (Nordea example)', () => {
  it('parses statements, balances, and transactions deterministically', async () => {
    const examplePath = join(
      process.cwd(),
      'resources',
      'banking',
      'nordea',
      'examples',
      'camt.053e.xml',
    )
    const xml = await readFile(examplePath, 'utf8')

    const parsed = parseCamt053Xml(xml)

    expect(parsed.statements).toHaveLength(1)
    const stmt = parsed.statements[0]!

    expect(stmt.statementId).toBe('2020-09-25-030731-DKK8496')
    expect(stmt.iban).toBe('DK0320009876543210')
    expect(stmt.currency).toBe('DKK')

    expect(stmt.balances).toHaveLength(3)
    expect(stmt.balances.map((b) => b.typeCode).sort()).toEqual(['CLAV', 'CLBD', 'OPBD'])

    expect(stmt.transactions).toHaveLength(8)

    const firstTx = stmt.transactions[0]!
    expect(firstTx.bookingDate.toISOString().slice(0, 10)).toBe('2020-09-24')
    expect(firstTx.amount).toBe('100.00')
    expect(firstTx.creditDebitIndicator).toBe('CRDT')
    expect(firstTx.remittanceUstrd.length).toBeGreaterThanOrEqual(1)
  })

  it('extracts structured creditor reference (SCOR) when present', async () => {
    const examplePath = join(
      process.cwd(),
      'resources',
      'banking',
      'nordea',
      'examples',
      'camt.053e.xml',
    )
    const xml = await readFile(examplePath, 'utf8')

    const parsed = parseCamt053Xml(xml)
    const txWithStructured = parsed.statements[0]!.transactions.find((tx) => tx.remittanceCreditorReference)

    expect(txWithStructured?.remittanceCreditorReference).toBeTruthy()
  })

  it('prefers the party name and falls back to PstlAdr, while keeping remittance text separate', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt>
    <GrpHdr>
      <MsgId>MSG-1</MsgId>
      <CreDtTm>2026-07-01T00:11:12.913+02:00</CreDtTm>
    </GrpHdr>
    <Stmt>
      <Id>STMT-1</Id>
      <ElctrncSeqNb>1</ElctrncSeqNb>
      <LglSeqNb>1</LglSeqNb>
      <CreDtTm>2026-07-01T00:11:12.913+02:00</CreDtTm>
      <Acct>
        <Id><IBAN>DK0012345678900000</IBAN></Id>
        <Ccy>DKK</Ccy>
      </Acct>
      <Ntry>
        <NtryRef>1</NtryRef>
        <Amt Ccy="DKK">100.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Sts>BOOK</Sts>
        <BookgDt><Dt>2026-06-30</Dt></BookgDt>
        <ValDt><Dt>2026-06-30</Dt></ValDt>
        <NtryDtls>
          <TxDtls>
            <RltdPties>
              <Dbtr>
                <Nm>COUNTERPART NAME</Nm>
                <PstlAdr>
                  <AdrLine>REAL COUNTERPART</AdrLine>
                  <AdrLine>EXAMPLEVEJ 10</AdrLine>
                  <AdrLine>8900 RANDERS C</AdrLine>
                </PstlAdr>
              </Dbtr>
            </RltdPties>
            <Purp>
              <Prtry>FIRST-FREETEXT</Prtry>
            </Purp>
            <RmtInf>
              <Ustrd>SECOND-FREETEXT</Ustrd>
              <AddtlRmtInf>THIRD-FREETEXT</AddtlRmtInf>
            </RmtInf>
          </TxDtls>
        </NtryDtls>
      </Ntry>
    </Stmt>
  </BkToCstmrStmt>
</Document>`

    const parsed = parseCamt053Xml(xml)
    const tx = parsed.statements[0]!.transactions[0]!

    expect(tx.debtorName).toBe('COUNTERPART NAME')
    expect(tx.remittanceAdditional).toEqual(['FIRST-FREETEXT', 'THIRD-FREETEXT'])
    expect(tx.remittanceUstrd).toEqual(['SECOND-FREETEXT'])
  })

  it('falls back to a useful address line when a party name is absent', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt><GrpHdr><MsgId>MSG-2</MsgId></GrpHdr><Stmt>
    <Id>STMT-2</Id><Acct><Id><IBAN>DK0012345678900000</IBAN></Id><Ccy>DKK</Ccy></Acct>
    <Ntry><NtryRef>1</NtryRef><Amt Ccy="DKK">100.00</Amt><CdtDbtInd>CRDT</CdtDbtInd>
      <BookgDt><Dt>2026-06-30</Dt></BookgDt><NtryDtls><TxDtls><RltdPties>
        <Dbtr><PstlAdr><AdrLine>REAL COUNTERPART</AdrLine><AdrLine>EXAMPLEVEJ 10</AdrLine></PstlAdr></Dbtr>
      </RltdPties></TxDtls></NtryDtls>
    </Ntry>
  </Stmt></BkToCstmrStmt>
</Document>`

    const parsed = parseCamt053Xml(xml)

    expect(parsed.statements[0]!.transactions[0]!.debtorName).toBe('REAL COUNTERPART')
  })
})
