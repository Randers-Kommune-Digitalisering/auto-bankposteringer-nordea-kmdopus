import { describe, expect, it } from 'vitest'
import { filterActiveRunErrors } from '../../server/utils/runs/runStatus'

describe('filterActiveRunErrors', () => {
  it('clears a missing-mapping error after an ignored-account recovery succeeds', () => {
    const rows = [
      {
        errorCode: 409,
        errorString: 'Mangler konterings-mapping (statuskonto) for bankkonto: nordea:DK123',
        createdAt: new Date('2026-09-01T10:00:00.000Z'),
      },
      {
        errorCode: 200,
        errorString: 'Genkørsel efter ignorering af bankkonto lykkedes. Matching: bogført=0.',
        createdAt: new Date('2026-09-01T11:00:00.000Z'),
      },
    ]

    expect(filterActiveRunErrors(rows)).toEqual([])
  })

  it('continues to clear a missing-mapping error after mapping recovery succeeds', () => {
    const rows = [
      {
        errorCode: 409,
        errorString: 'Mangler konterings-mapping (artskonto) for bankkonto: nordea:DK123',
        createdAt: new Date('2026-09-01T10:00:00.000Z'),
      },
      {
        errorCode: 200,
        errorString: 'Genkørsel efter statuskonto-mapping lykkedes. Matching: bogført=0.',
        createdAt: new Date('2026-09-01T11:00:00.000Z'),
      },
    ]

    expect(filterActiveRunErrors(rows)).toEqual([])
  })
})