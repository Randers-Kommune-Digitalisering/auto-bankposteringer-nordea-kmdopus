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

  it('resolves the counterparty from the single detail based on entry direction', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt><Stmt>
    <Id>STMT-3</Id><Acct><Id><IBAN>DK0012345678900000</IBAN></Id><Ccy>DKK</Ccy></Acct>
    <Ntry><Amt Ccy="DKK">100.00</Amt><CdtDbtInd>CRDT</CdtDbtInd>
      <BookgDt><Dt>2026-06-30</Dt></BookgDt>
      <NtryDtls><TxDtls><RltdPties>
        <Dbtr><Pty><Nm>Sender A/S</Nm><Id><OrgId><Othr><Id>SENDER-1</Id></Othr></OrgId></Id></Pty></Dbtr>
        <DbtrAcct><Id><IBAN>DK0011223344556677</IBAN></Id></DbtrAcct>
        <Cdtr><Pty><Nm>Municipality</Nm><Id><PrvtId><Othr><Id>RECIPIENT-1</Id></Othr></PrvtId></Id></Pty></Cdtr>
        <UltmtDbtr><Pty><Nm>Ultimate Sender</Nm></Pty></UltmtDbtr>
      </RltdPties></TxDtls></NtryDtls>
    </Ntry>
    <Ntry><Amt Ccy="DKK">25.00</Amt><CdtDbtInd>DBIT</CdtDbtInd>
      <BookgDt><Dt>2026-06-30</Dt></BookgDt>
      <NtryDtls><TxDtls><RltdPties>
        <Dbtr><Nm>Municipality</Nm></Dbtr>
        <Cdtr><Nm>Recipient A/S</Nm></Cdtr>
      </RltdPties></TxDtls></NtryDtls>
    </Ntry>
  </Stmt></BkToCstmrStmt>
</Document>`

    const transactions = parseCamt053Xml(xml).statements[0]!.transactions
    expect(transactions[0]).toMatchObject({
      counterpartName: 'Sender A/S',
      counterpartNameSource: '/Ntry/NtryDtls/TxDtls/RltdPties/Dbtr/Pty/Nm',
    })
    expect(transactions[1]).toMatchObject({
      counterpartName: 'Recipient A/S',
      counterpartNameSource: '/Ntry/NtryDtls/TxDtls/RltdPties/Cdtr/Nm',
    })
  })

  it('uses the first postal address line only as a name fallback', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt><Stmt>
    <Id>STMT-4</Id><Acct><Id><IBAN>DK0012345678900000</IBAN></Id><Ccy>DKK</Ccy></Acct>
    <Ntry><Amt Ccy="DKK">2.00</Amt><CdtDbtInd>CRDT</CdtDbtInd>
      <BookgDt><Dt>2026-06-30</Dt></BookgDt>
      <NtryDtls><TxDtls><RltdPties><Dbtr><PstlAdr>
        <AdrLine>Sender Name</AdrLine><AdrLine>Street 1</AdrLine>
      </PstlAdr></Dbtr></RltdPties></TxDtls></NtryDtls>
    </Ntry>
  </Stmt></BkToCstmrStmt>
</Document>`

    const transaction = parseCamt053Xml(xml).statements[0]!.transactions[0]!
    expect(transaction.counterpartName).toBe('Sender Name')
    expect(transaction.counterpartNameSource).toBe('/Ntry/NtryDtls/TxDtls/RltdPties/Dbtr/PstlAdr/AdrLine[1]')
    expect(JSON.stringify(transaction)).not.toContain('Street 1')
  })

  it('prefers the first postal address line over explicit party names', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt><Stmt>
    <Id>STMT-ADDRESS-PRIORITY</Id><Acct><Id><IBAN>DK0012345678900000</IBAN></Id><Ccy>DKK</Ccy></Acct>
    <Ntry><Amt Ccy="DKK">2.00</Amt><CdtDbtInd>CRDT</CdtDbtInd>
      <BookgDt><Dt>2026-06-30</Dt></BookgDt>
      <NtryDtls><TxDtls><RltdPties><Dbtr>
        <Nm>Registered Sender Name</Nm>
        <PstlAdr><AdrLine>Udbetaling Danmark</AdrLine><AdrLine>Street 1</AdrLine></PstlAdr>
      </Dbtr></RltdPties></TxDtls></NtryDtls>
    </Ntry>
  </Stmt></BkToCstmrStmt>
</Document>`

    const transaction = parseCamt053Xml(xml).statements[0]!.transactions[0]!
    expect(transaction.counterpartName).toBe('Udbetaling Danmark')
    expect(transaction.counterpartNameSource).toBe('/Ntry/NtryDtls/TxDtls/RltdPties/Dbtr/PstlAdr/AdrLine[1]')
  })

  it('falls back to the direction-matched entry party when the single detail has no explicit name', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt><Stmt>
    <Id>STMT-5</Id><Acct><Id><IBAN>DK0012345678900000</IBAN></Id><Ccy>DKK</Ccy></Acct>
    <Ntry><Amt Ccy="DKK">2.00</Amt><CdtDbtInd>CRDT</CdtDbtInd>
      <BookgDt><Dt>2026-06-30</Dt></BookgDt>
      <NtryDtls><TxDtls><RltdPties><Dbtr /></RltdPties></TxDtls></NtryDtls>
      <RltdPties><Dbtr><Pty><Nm>Entry Sender</Nm></Pty></Dbtr></RltdPties>
    </Ntry>
    <Ntry><Amt Ccy="DKK">3.00</Amt><CdtDbtInd>DBIT</CdtDbtInd>
      <BookgDt><Dt>2026-06-30</Dt></BookgDt>
      <NtryDtls><TxDtls><RltdPties><Dbtr><Nm>Other party</Nm></Dbtr></RltdPties></TxDtls></NtryDtls>
      <RltdPties><Cdtr><PstlAdr><AdrLine>Recipient Name</AdrLine><AdrLine>Street 2</AdrLine></PstlAdr></Cdtr></RltdPties>
    </Ntry>
  </Stmt></BkToCstmrStmt>
</Document>`

    const transactions = parseCamt053Xml(xml).statements[0]!.transactions
    expect(transactions[0]).toMatchObject({
      counterpartName: 'Entry Sender',
      counterpartNameSource: '/Ntry/RltdPties/Dbtr/Pty/Nm',
    })
    expect(transactions[1]).toMatchObject({
      counterpartName: 'Recipient Name',
      counterpartNameSource: '/Ntry/RltdPties/Cdtr/PstlAdr/AdrLine[1]',
    })
    expect(JSON.stringify(transactions[1])).not.toContain('Street 2')
  })

  it('uses the direction-matched ultimate party only when the direct party has no name', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt><Stmt>
    <Id>STMT-6</Id><Acct><Id><IBAN>DK0012345678900000</IBAN></Id><Ccy>DKK</Ccy></Acct>
    <Ntry><Amt Ccy="DKK">2.00</Amt><CdtDbtInd>CRDT</CdtDbtInd>
      <BookgDt><Dt>2026-06-30</Dt></BookgDt>
      <NtryDtls><TxDtls><RltdPties>
        <Dbtr><Id><OrgId><Othr><Id>DBTR-1</Id></Othr></OrgId></Id></Dbtr>
        <UltmtDbtr><Pty><Nm>Udbetaling Danmark</Nm></Pty></UltmtDbtr>
        <UltmtCdtr><Pty><Nm>Other party</Nm></Pty></UltmtCdtr>
      </RltdPties></TxDtls></NtryDtls>
    </Ntry>
    <Ntry><Amt Ccy="DKK">3.00</Amt><CdtDbtInd>DBIT</CdtDbtInd>
      <BookgDt><Dt>2026-06-30</Dt></BookgDt>
      <NtryDtls><TxDtls><RltdPties>
        <Dbtr><Pty><Nm>Other party</Nm></Pty></Dbtr>
        <UltmtCdtr><Pty><Nm>Udbetaling Danmark</Nm></Pty></UltmtCdtr>
      </RltdPties></TxDtls></NtryDtls>
    </Ntry>
  </Stmt></BkToCstmrStmt>
</Document>`

    const transactions = parseCamt053Xml(xml).statements[0]!.transactions
    expect(transactions[0]).toMatchObject({
      counterpartName: 'Udbetaling Danmark',
      counterpartNameSource: '/Ntry/NtryDtls/TxDtls/RltdPties/UltmtDbtr/Pty/Nm',
    })
    expect(transactions[1]).toMatchObject({
      counterpartName: 'Udbetaling Danmark',
      counterpartNameSource: '/Ntry/NtryDtls/TxDtls/RltdPties/UltmtCdtr/Pty/Nm',
    })
  })

  it('does not retain party names from aggregated child transactions', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt><Stmt>
    <Id>STMT-4</Id><Acct><Id><IBAN>DK0012345678900000</IBAN></Id><Ccy>DKK</Ccy></Acct>
    <Ntry><Amt Ccy="DKK">2.00</Amt><CdtDbtInd>CRDT</CdtDbtInd>
      <BookgDt><Dt>2026-06-30</Dt></BookgDt>
      <NtryDtls>
        <TxDtls><RltdPties><Dbtr><Nm>Sender A</Nm></Dbtr></RltdPties></TxDtls>
        <TxDtls><RltdPties><Dbtr><Nm>Sender B</Nm></Dbtr></RltdPties></TxDtls>
      </NtryDtls>
    </Ntry>
  </Stmt></BkToCstmrStmt>
</Document>`

    const transaction = parseCamt053Xml(xml).statements[0]!.transactions[0]!
    expect(transaction.counterpartName).toBeNull()
    expect(transaction.counterpartNameSource).toBeNull()
    expect(JSON.stringify(transaction)).not.toContain('Sender A')
    expect(JSON.stringify(transaction)).not.toContain('Sender B')
  })
})
