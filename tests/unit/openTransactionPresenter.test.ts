import { describe, expect, it } from 'vitest'

import { buildTransactionSummaryView } from '../../server/presenters/openTransactionPresenter'

describe('openTransactionPresenter', () => {
  it('keeps additional entry information as a technical source value', () => {
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

    const technicalSection = summary.sections.find((section) => section.key === 'teknisk')

    expect(technicalSection?.chips?.map((chip) => chip.value)).toContain('500:TEXT:Frivillig besked fra afsender')
    expect(technicalSection?.chips?.map((chip) => chip.value)).toContain('502:TEXT:Betalingsbesked fra Nets')
  })

  it('keeps additional entry values without attempting to parse child-level triads', () => {
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

  it('does not promote low-signal KON konto values as reference', () => {
    const summary = buildTransactionSummaryView({
      id: 'tx-3',
      runId: 'run-1',
      bookingDate: '2026-06-02T00:00:00.000Z',
      amount: 250,
      transactionType: 'PMNT/ICDT/VCOM',
      counterpart: 'Test Modpart',
      references: [],
      referenceDetails: [
        {
          source: 'Ntry/AddtlNtryInf',
          value: '502:REFERENCE:KON konto 0970205918',
        },
      ],
    })

    const referenceSection = summary.sections.find((section) => section.key === 'reference')
    const technicalSection = summary.sections.find((section) => section.key === 'teknisk')

    expect(referenceSection).toBeUndefined()
    expect(technicalSection?.chips?.map((chip) => chip.value)).toContain('502:REFERENCE:KON konto 0970205918')
  })
})