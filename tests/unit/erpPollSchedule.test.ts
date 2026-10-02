import { describe, expect, it } from 'vitest'
import { getCopenhagenErpPollSlot } from '../../scripts/runtime/erpPollSchedule'

describe('getCopenhagenErpPollSlot', () => {
  it('resolves Copenhagen midnight and noon in winter', () => {
    expect(getCopenhagenErpPollSlot(new Date('2026-01-15T23:00:00.000Z')))
      .toBe('2026-01-16T00:00:00[Europe/Copenhagen]')
    expect(getCopenhagenErpPollSlot(new Date('2026-01-16T11:00:00.000Z')))
      .toBe('2026-01-16T12:00:00[Europe/Copenhagen]')
  })

  it('resolves Copenhagen midnight and noon in summer', () => {
    expect(getCopenhagenErpPollSlot(new Date('2026-07-15T22:00:00.000Z')))
      .toBe('2026-07-16T00:00:00[Europe/Copenhagen]')
    expect(getCopenhagenErpPollSlot(new Date('2026-07-16T10:00:00.000Z')))
      .toBe('2026-07-16T12:00:00[Europe/Copenhagen]')
  })

  it('does not produce a slot for another local minute', () => {
    expect(getCopenhagenErpPollSlot(new Date('2026-07-16T10:01:00.000Z'))).toBeNull()
  })
})