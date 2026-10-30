import { describe, expect, it } from 'vitest'
import {
  getLatestCompletedWeekday,
  isWeekendBookingDate,
} from '../../app/lib/scheduler/scheduledBookingDate'

describe('isWeekendBookingDate', () => {
  it.each([
    ['Saturday', '2026-10-24', true],
    ['Sunday', '2026-10-25', true],
    ['Monday', '2026-10-26', false],
  ])('identifies %s booking dates', (_description, bookingDate, expected) => {
    expect(isWeekendBookingDate(bookingDate)).toBe(expected)
  })
})

describe('getLatestCompletedWeekday', () => {
  it.each([
    ['Monday', '2026-10-26T03:00:00.000Z', '2026-10-23'],
    ['Tuesday', '2026-10-27T03:00:00.000Z', '2026-10-26'],
    ['Saturday', '2026-10-24T03:00:00.000Z', '2026-10-23'],
    ['Sunday', '2026-10-25T03:00:00.000Z', '2026-10-23'],
    ['a UTC date that is still the previous day in Copenhagen', '2026-10-25T23:30:00.000Z', '2026-10-23'],
  ])('returns the latest completed weekday for %s', (_description, scheduledTimeIso, expected) => {
    expect(getLatestCompletedWeekday(scheduledTimeIso)).toBe(expected)
  })
})
