import { describe, expect, it } from 'vitest'
import { buildTransactionSummaryView } from '../../server/presenters/openTransactionPresenter'
import {
  toSummarySectionEntries,
  toVisibleSummarySections,
} from '../../app/lib/presenters/transactionSummaryEntries'

describe('openTransactionPresenter', () => {
  it('presents the three canonical categories with CAMT source paths', () => {
    const summary = buildTransactionSummaryView({
      id: 'tx-1',
      runId: 'run-1',
      bookingDate: '2026-06-02T00:00:00.000Z',
      amount: -100,
      transactionType: 'PMNT/ICDT/VCOM',
      transactionTypeHint: '/Ntry/BkTxCd/Domn/Cd · Fmly/Cd · Fmly/SubFmlyCd',
      counterpart: 'Test Modpart',
      counterpartSource: '/Ntry/NtryDtls/TxDtls/RltdPties/Cdtr/PstlAdr/AdrLine',
      references: [],
      referenceDetails: [
        { source: '/Ntry/NtryRef', value: 'NTRY-1' },
        { source: '/Ntry/AddtlNtryInf', value: '502:REFERENCE:Payment 123' },
      ],
    })

    expect(summary.sections.map((section) => section.key)).toEqual([
      'part',
      'reference',
      'transaktionstype',
    ])
    expect(toVisibleSummarySections(summary.sections).map((section) => section.key)).toEqual([
      'part',
      'reference',
      'transaktionstype',
    ])
    expect(toSummarySectionEntries(summary.sections[0]!)).toEqual([{
      label: 'Modpart',
      value: 'Test Modpart',
      sourcePath: '/Ntry/NtryDtls/TxDtls/RltdPties/Cdtr/PstlAdr/AdrLine',
    }])
    expect(toSummarySectionEntries(summary.sections[1]!)).toEqual([
      {
        label: 'Yderligere entry-oplysning',
        value: '',
        sourcePath: '/Ntry/AddtlNtryInf',
        valueLines: [{ label: '502 · REFERENCE', value: 'Payment 123' }],
      },
    ])
    expect(toSummarySectionEntries(summary.sections[2]!)).toEqual([{
      label: 'Transaktionstype',
      value: 'PMNT/ICDT/VCOM',
      sourcePath: '/Ntry/BkTxCd/Domn/Cd · Fmly/Cd · Fmly/SubFmlyCd',
    }])
  })

  it('omits Modpart when there is no unambiguous counterparty name', () => {
    const summary = buildTransactionSummaryView({
      id: 'tx-2',
      runId: 'run-1',
      bookingDate: '2026-06-02T00:00:00.000Z',
      amount: 250,
      underlyingTransactionCount: 9444,
      transactionType: null,
      counterpart: null,
      references: [],
      referenceDetails: [],
    })

    expect(toVisibleSummarySections(summary.sections).map((section) => section.key)).toEqual([])
    expect(summary.transactionId.value).toBe('Samlepost (9444 underliggende transaktioner)')
  })

  it('groups AddtlNtryInf segments into one labeled summary entry', () => {
    const summary = buildTransactionSummaryView({
      id: 'tx-additional-info',
      runId: 'run-1',
      bookingDate: '2026-06-02T00:00:00.000Z',
      amount: 100,
      transactionType: null,
      counterpart: null,
      references: [],
      referenceDetails: [{
        source: '/Ntry/AddtlNtryInf',
        value: '502:REFERENCE:Overførsel;821:ADVICE REFERENCE:03896981720268;555:FILE INFORMATION:24092020',
      }],
    })

    const entries = toSummarySectionEntries(summary.sections[1]!)
    expect(entries).toEqual([{
      label: 'Yderligere entry-oplysning',
      value: '',
      sourcePath: '/Ntry/AddtlNtryInf',
      valueLines: [
        { label: '502 · REFERENCE', value: 'Overførsel' },
        { label: '821 · ADVICE REFERENCE', value: '03896981720268' },
        { label: '555 · FILE INFORMATION', value: '24092020' },
      ],
    }])
  })
})
