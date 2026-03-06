import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseCamt053Xml } from '../../engine/banking-ingestion/application/camt053/parseCamt053Xml'

describe('parseCamt053Xml (Nordea example)', () => {
  it('parses statements, balances, and transactions deterministically', async () => {
    const examplePath = join(
      process.cwd(),
      'lib',
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
      'lib',
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
})
