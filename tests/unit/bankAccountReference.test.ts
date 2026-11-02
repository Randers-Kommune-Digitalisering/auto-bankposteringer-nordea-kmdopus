import { describe, expect, it } from 'vitest'
import { resolveBankAccountReferences } from '../../server/utils/bankAccounts/resolveBankAccountReferences'

describe('bank account reference resolution', () => {
  const candidates = [
    { id: 'DK6520005908764988-DKK', iban: 'DK6520005908764988' },
    { id: 'DK1230000000000000-DKK', iban: 'DK1230000000000000' },
  ]

  it('resolves a plain IBAN to the matching internal account id', () => {
    const resolutions = resolveBankAccountReferences(
      ['dk65 2000 5908 7649 88'],
      candidates,
    )

    expect(resolutions.get('dk65 2000 5908 7649 88')).toEqual({
      kind: 'resolved',
      accountId: 'DK6520005908764988-DKK',
    })
  })

  it('continues to accept internal account ids for round-trip exports', () => {
    const resolutions = resolveBankAccountReferences(
      ['DK6520005908764988-DKK'],
      candidates,
    )

    expect(resolutions.get('DK6520005908764988-DKK')).toEqual({
      kind: 'resolved',
      accountId: 'DK6520005908764988-DKK',
    })
  })

  it('reports unknown and ambiguous IBANs without guessing', () => {
    const resolutions = resolveBankAccountReferences(
      ['DK9990000000000000', 'DK6520005908764988'],
      [
        ...candidates,
        { id: 'DK6520005908764988-NOK', iban: 'DK6520005908764988' },
      ],
    )

    expect(resolutions.get('DK9990000000000000')).toEqual({ kind: 'unknown' })
    expect(resolutions.get('DK6520005908764988')).toEqual({ kind: 'ambiguous' })
  })
})
