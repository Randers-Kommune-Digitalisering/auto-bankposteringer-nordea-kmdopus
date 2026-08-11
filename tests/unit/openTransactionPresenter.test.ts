import { describe, expect, it } from 'vitest'

import { buildTransactionSummaryView } from '../../server/presenters/openTransactionPresenter'

describe('openTransactionPresenter', () => {
  it('normalizes additional entry triads to value-only and promotes 500/502 to reference', () => {
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

    expect(referenceSection?.chips?.map((chip) => chip.value)).toContain('Frivillig besked fra afsender')
    expect(referenceSection?.chips?.map((chip) => chip.value)).toContain('Betalingsbesked fra Nets')
    expect(technicalSection?.chips?.map((chip) => chip.value) ?? []).not.toContain('Frivillig besked fra afsender')
    expect(technicalSection?.chips?.map((chip) => chip.value) ?? []).not.toContain('Betalingsbesked fra Nets')
  })

  it('keeps non-promoted additional entry triads as system fields with value-only text', () => {
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

    expect(technicalSection?.chips?.map((chip) => chip.value)).toContain('NETS settlement payload')
    expect(referenceSection?.chips?.map((chip) => chip.value) ?? []).not.toContain('NETS settlement payload')
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
    expect(technicalSection?.chips?.map((chip) => chip.value)).toContain('KON konto 0970205918')
  })
})