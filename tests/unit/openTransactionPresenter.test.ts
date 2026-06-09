import { describe, expect, it } from 'vitest'

import { buildTransactionSummaryView } from '../../server/presenters/openTransactionPresenter'

describe('openTransactionPresenter', () => {
  it('classifies additional entry fields 500 and 502 as reference', () => {
    const summary = buildTransactionSummaryView({
      id: 'tx-1',
      runId: 'run-1',
      bookingDate: '2026-06-02T00:00:00.000Z',
      amount: -100,
      transactionType: 'PMNT/ICDT/VCOM',
      counterpart: 'Test Modpart',
      references: [],
      referenceDetails: [
        {
          source: 'Ntry/AddtlNtryInf',
          value: '500:TEXT:Frivillig besked fra afsender',
        },
        {
          source: 'Ntry/AddtlNtryInf',
          value: '502:TEXT:Betalingsbesked fra Nets',
        },
      ],
    })

    const referenceSection = summary.sections.find((section) => section.key === 'reference')
    const technicalSection = summary.sections.find((section) => section.key === 'teknisk')

    expect(referenceSection?.chips?.map((chip) => chip.value)).toContain('500:TEXT:Frivillig besked fra afsender')
    expect(referenceSection?.chips?.map((chip) => chip.value)).toContain('502:TEXT:Betalingsbesked fra Nets')
    expect(technicalSection?.chips?.map((chip) => chip.value) ?? []).not.toContain('500:TEXT:Frivillig besked fra afsender')
    expect(technicalSection?.chips?.map((chip) => chip.value) ?? []).not.toContain('502:TEXT:Betalingsbesked fra Nets')
  })

  it('classifies non-500 additional entry triads as system fields', () => {
    const summary = buildTransactionSummaryView({
      id: 'tx-2',
      runId: 'run-1',
      bookingDate: '2026-06-02T00:00:00.000Z',
      amount: 250,
      transactionType: 'PMNT/ICDT/VCOM',
      counterpart: 'Test Modpart',
      references: [],
      referenceDetails: [
        {
          source: 'Ntry/AddtlNtryInf',
          value: '610:TXT:NETS settlement payload',
        },
      ],
    })

    const technicalSection = summary.sections.find((section) => section.key === 'teknisk')
    const referenceSection = summary.sections.find((section) => section.key === 'reference')

    expect(technicalSection?.chips?.map((chip) => chip.value)).toContain('610:TXT:NETS settlement payload')
    expect(referenceSection?.chips?.map((chip) => chip.value) ?? []).not.toContain('610:TXT:NETS settlement payload')
  })
})