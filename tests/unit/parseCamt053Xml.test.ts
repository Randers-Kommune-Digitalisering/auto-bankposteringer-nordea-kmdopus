import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseCamt053Xml } from '../../engine/banking-ingestion/handlers/camt053/parseCamt053Xml'

describe('parseCamt053Xml (Nordea example)', () => {
  it('parses statements, balances, and one transaction per CAMT entry', async () => {
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

    expect(stmt.transactions).toHaveLength(6)

    const firstTx = stmt.transactions[0]!
    expect(firstTx.bookingDate.toISOString().slice(0, 10)).toBe('2020-09-24')
    expect(firstTx.amount).toBe('100.00')
    expect(firstTx.creditDebitIndicator).toBe('CRDT')
    expect(firstTx.underlyingTransactionCount).toBeGreaterThan(0)
  })

  it('keeps entry amount and count without retaining child transaction details', () => {
    const txDetails = Array.from({ length: 9444 }, (_, index) => `
          <TxDtls>
            <Refs><EndToEndId>CHILD-REFERENCE-${index}</EndToEndId></Refs>
            <RltdPties><Dbtr><Nm>CHILD-PERSON-${index}</Nm></Dbtr></RltdPties>
            <AmtDtls><TxAmt><Amt Ccy="DKK">1.00</Amt></TxAmt></AmtDtls>
          </TxDtls>`).join('')
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt>
    <Stmt>
      <Id>STMT-1</Id>
      <Acct>
        <Id><IBAN>DK0012345678900000</IBAN></Id>
        <Ccy>DKK</Ccy>
      </Acct>
      <Ntry>
        <NtryRef>1</NtryRef>
        <Amt Ccy="DKK">9444.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Sts>BOOK</Sts>
        <BookgDt><Dt>2026-06-30</Dt></BookgDt>
        <NtryDtls>${txDetails}</NtryDtls>
      </Ntry>
    </Stmt>
  </BkToCstmrStmt>
</Document>`

    const parsed = parseCamt053Xml(xml)
    const tx = parsed.statements[0]!.transactions[0]!

    expect(parsed.statements[0]!.transactions).toHaveLength(1)
    expect(tx.amount).toBe('9444.00')
    expect(tx.underlyingTransactionCount).toBe(9444)
    expect(JSON.stringify(tx)).not.toContain('CHILD-REFERENCE')
    expect(JSON.stringify(tx)).not.toContain('CHILD-PERSON')
  })

  it('retains an entry when it has no underlying transaction details', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt><Stmt>
    <Id>STMT-2</Id><Acct><Id><IBAN>DK0012345678900000</IBAN></Id><Ccy>DKK</Ccy></Acct>
    <Ntry><NtryRef>1</NtryRef><Amt Ccy="DKK">100.00</Amt><CdtDbtInd>CRDT</CdtDbtInd>
      <BookgDt><Dt>2026-06-30</Dt></BookgDt>
    </Ntry>
  </Stmt></BkToCstmrStmt>
</Document>`

    const parsed = parseCamt053Xml(xml)
    expect(parsed.statements[0]!.transactions).toHaveLength(1)
    expect(parsed.statements[0]!.transactions[0]!.underlyingTransactionCount).toBe(0)
    expect(parsed.statements[0]!.transactions[0]!.amount).toBe('100.00')
  })
})
