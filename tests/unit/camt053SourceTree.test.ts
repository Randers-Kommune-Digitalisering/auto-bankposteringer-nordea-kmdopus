import { describe, expect, it } from 'vitest'
import { buildCamt053SourceTree } from '../../server/utils/banking/camt053SourceTree'

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<c:Document xmlns:c="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <c:BkToCstmrStmt>
    <c:Stmt><c:Id>STATEMENT-1</c:Id>
      <c:Ntry><c:NtryRef>ENTRY-1</c:NtryRef>
        <c:NtryDtls>
          <c:TxDtls><c:Refs><c:EndToEndId>TX-1</c:EndToEndId></c:Refs></c:TxDtls>
          <c:TxDtls><c:Refs><c:EndToEndId>TX-2</c:EndToEndId><c:EndToEndId>TX-2B</c:EndToEndId></c:Refs>
            <c:Amt Ccy="DKK">100.00</c:Amt><c:Note><![CDATA[Raw <text>]]></c:Note>
          </c:TxDtls>
        </c:NtryDtls>
      </c:Ntry>
      <c:Ntry><c:NtryRef>ENTRY-2</c:NtryRef><c:Amt Ccy="DKK">5.00</c:Amt></c:Ntry>
    </c:Stmt>
  </c:BkToCstmrStmt>
</c:Document>`

function flattenNames(node: NonNullable<ReturnType<typeof buildCamt053SourceTree>>): string[] {
  return [node.name, ...(node.children ?? []).flatMap(flattenNames)]
}

function findNode(
  node: NonNullable<ReturnType<typeof buildCamt053SourceTree>>,
  name: string,
): NonNullable<ReturnType<typeof buildCamt053SourceTree>> | undefined {
  if (node.name === name) return node
  for (const child of node.children ?? []) {
    const match = findNode(child, name)
    if (match) return match
  }
}

describe('buildCamt053SourceTree', () => {
  it('preserves nested XML and selects only the indexed TxDtls', () => {
    const tree = buildCamt053SourceTree({
      xml,
      statementId: 'STATEMENT-1',
      entryIndex: 1,
      entrySubIndex: 2,
    })

    expect(tree?.name).toBe('c:Document')
    expect(tree?.attributes).toContainEqual({
      name: 'xmlns:c',
      value: 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.02',
    })
    expect(flattenNames(tree!)).toContain('c:TxDtls')
    expect(flattenNames(tree!)).toContain('c:EndToEndId')
    expect(flattenNames(tree!)).not.toContain('ENTRY-2')

    const entry = findNode(tree!, 'c:Ntry')
    expect(entry?.children?.find((node) => node.name === 'c:NtryRef')?.children?.[0]?.value).toBe('ENTRY-1')
    const txDetails = entry?.children?.flatMap((node) => node.children ?? []).filter((node) => node.name === 'c:TxDtls')
    expect(txDetails).toHaveLength(1)

    const amount = txDetails?.[0]?.children?.find((node) => node.name === 'c:Amt')
    expect(amount?.attributes).toEqual([{ name: 'Ccy', value: 'DKK' }])
    expect(amount?.children?.[0]?.value).toBe('100.00')

    const note = txDetails?.[0]?.children?.find((node) => node.name === 'c:Note')
    expect(note?.children?.[0]).toMatchObject({ kind: 'cdata', value: 'Raw <text>' })
    expect(txDetails?.[0]?.children?.find((node) => node.name === 'c:Refs')?.children)
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'c:EndToEndId' }),
        expect.objectContaining({ name: 'c:EndToEndId' }),
      ]))
  })

  it('returns the complete Ntry when it has no TxDtls', () => {
    const tree = buildCamt053SourceTree({
      xml,
      statementId: 'STATEMENT-1',
      entryIndex: 2,
      entrySubIndex: 1,
    })

    expect(findNode(tree!, 'c:Ntry')?.children?.map((node) => node.name)).toEqual(['c:NtryRef', 'c:Amt'])
  })

  it('returns null when the statement, entry, or detail index is missing', () => {
    expect(buildCamt053SourceTree({ xml, statementId: 'missing', entryIndex: 1, entrySubIndex: 1 })).toBeNull()
    expect(buildCamt053SourceTree({ xml, statementId: 'STATEMENT-1', entryIndex: 3, entrySubIndex: 1 })).toBeNull()
    expect(buildCamt053SourceTree({ xml, statementId: 'STATEMENT-1', entryIndex: 1, entrySubIndex: 3 })).toBeNull()
  })
})