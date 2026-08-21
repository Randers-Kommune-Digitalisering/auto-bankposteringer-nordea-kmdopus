import { describe, expect, it } from 'vitest'
import { getBookingPeriodState } from '../../engine/posting/domain/bookingPeriod'

describe('getBookingPeriodState', () => {
  it('keeps the previous month open through the configured closing day', () => {
    expect(getBookingPeriodState({
      bookingDate: '2026-07-31',
      today: '2026-08-07',
      closingDay: 7,
    })).toMatchObject({ isClosed: false, effectiveBookingDate: '2026-07-31' })
  })

  it('closes the previous month after the configured closing day', () => {
    expect(getBookingPeriodState({
      bookingDate: '2026-07-31',
      today: '2026-08-08',
      closingDay: 7,
    })).toMatchObject({ isClosed: true, effectiveBookingDate: '2026-08-08', closingDate: '2026-08-07' })
  })

  it('closes older periods and clamps the closing day for short months', () => {
    expect(getBookingPeriodState({
      bookingDate: '2026-01-31',
      today: '2026-03-01',
      closingDay: 31,
    })).toMatchObject({ isClosed: true, effectiveBookingDate: '2026-03-01' })
    expect(getBookingPeriodState({
      bookingDate: '2026-02-28',
      today: '2026-03-31',
      closingDay: 31,
    })).toMatchObject({ isClosed: false, closingDate: '2026-03-31' })
  })
})