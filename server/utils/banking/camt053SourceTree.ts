import type { Camt053SourceTreeNode } from '~/types/transactions'

type EntrySource = {
  statementId: string
  entryIndex: number | null
  underlyingTransactionCount: number
  amount: string
  currency: string | null
  creditDebitIndicator: string | null
  status: string | null
  bookingDate: string | null
  valueDate: string | null
  ntryRef: string | null
  ntryAcctSvcrRef: string | null
  entryAdditionalInfo: string | null
  bkTxCdDomain: string | null
  bkTxCdFamily: string | null
  bkTxCdSubFamily: string | null
  bkTxCdProprietary: string | null
}

function textNode(id: string, value: string): Camt053SourceTreeNode {
  return { id, kind: 'text', name: '#text', value }
}

function elementNode(
  id: string,
  name: string,
  value?: string | null,
  attributes?: Array<{ name: string; value: string }>,
): Camt053SourceTreeNode {
  return {
    id,
    kind: 'element',
    name,
    attributes,
    children: value == null ? [] : [textNode(`${id}/0`, value)],
  }
}

function optionalElement(id: string, name: string, value: string | null): Camt053SourceTreeNode[] {
  return value == null ? [] : [elementNode(id, name, value)]
}

export function buildCamt053SourceTree(input: EntrySource): Camt053SourceTreeNode | null {
  if (!Number.isInteger(input.entryIndex) || (input.entryIndex ?? 0) < 1) return null

  const entryChildren = [
    ...optionalElement('entry/ntry-ref', 'NtryRef', input.ntryRef),
    elementNode('entry/amount', 'Amt', input.amount, input.currency
      ? [{ name: 'Ccy', value: input.currency }]
      : undefined),
    ...optionalElement('entry/cdt-dbt-ind', 'CdtDbtInd', input.creditDebitIndicator),
    ...optionalElement('entry/status', 'Sts', input.status),
    ...(input.bookingDate
      ? [{
          id: 'entry/booking-date',
          kind: 'element' as const,
          name: 'BookgDt',
          children: [elementNode('entry/booking-date/date', 'Dt', input.bookingDate)],
        }]
      : []),
    ...(input.valueDate
      ? [{
          id: 'entry/value-date',
          kind: 'element' as const,
          name: 'ValDt',
          children: [elementNode('entry/value-date/date', 'Dt', input.valueDate)],
        }]
      : []),
    ...optionalElement('entry/acct-svcr-ref', 'AcctSvcrRef', input.ntryAcctSvcrRef),
    ...optionalElement('entry/addtl-ntry-inf', 'AddtlNtryInf', input.entryAdditionalInfo),
    {
      id: 'entry/aggregate-count',
      kind: 'element',
      name: 'UnderlyingTransactionCount',
      children: [textNode('entry/aggregate-count/0', String(input.underlyingTransactionCount))],
    } satisfies Camt053SourceTreeNode,
  ]

  const codeChildren = [
    ...optionalElement('entry/code/domain', 'Cd', input.bkTxCdDomain),
    ...optionalElement('entry/code/family', 'Fmly', input.bkTxCdFamily),
    ...optionalElement('entry/code/sub-family', 'SubFmlyCd', input.bkTxCdSubFamily),
    ...optionalElement('entry/code/proprietary', 'Prtry', input.bkTxCdProprietary),
  ]
  if (codeChildren.length) {
    entryChildren.push({
      id: 'entry/bk-tx-cd',
      kind: 'element',
      name: 'BkTxCd',
      children: codeChildren,
    })
  }

  return {
    id: 'summary',
    kind: 'element',
    name: 'EntrySummary',
    children: [
      elementNode('statement/id', 'StatementId', input.statementId),
      {
        id: 'entry',
        kind: 'element',
        name: 'Ntry',
        attributes: [{ name: 'entryIndex', value: String(input.entryIndex) }],
        children: entryChildren,
      },
    ],
  }
}
