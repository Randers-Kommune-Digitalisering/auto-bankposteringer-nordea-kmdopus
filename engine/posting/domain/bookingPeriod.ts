import { z } from 'zod'

export const bookingDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export type BookingPeriodState = {
  isClosed: boolean
  bookingDate: string
  effectiveBookingDate: string
  closingDate: string
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function addMonths(year: number, month: number, offset: number): { year: number; month: number } {
  const monthIndex = year * 12 + month - 1 + offset
  return {
    year: Math.floor(monthIndex / 12),
    month: (monthIndex % 12) + 1,
  }
}

function formatDate(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

export function getBookingPeriodState({
  bookingDate,
  today,
  closingDay,
}: {
  bookingDate: string
  today: string
  closingDay: number
}): BookingPeriodState {
  bookingDateSchema.parse(bookingDate)
  bookingDateSchema.parse(today)
  if (!Number.isInteger(closingDay) || closingDay < 1 || closingDay > 31) {
    throw new Error('closingDay skal være et heltal mellem 1 og 31')
  }

  const [todayYear, todayMonth] = today.split('-').map(Number)
  const previousMonth = addMonths(todayYear, todayMonth, -1)
  const closingDate = formatDate(
    todayYear,
    todayMonth,
    Math.min(closingDay, daysInMonth(todayYear, todayMonth)),
  )
  const previousMonthStart = formatDate(previousMonth.year, previousMonth.month, 1)
  const isClosed = bookingDate < previousMonthStart || today > closingDate

  return {
    isClosed,
    bookingDate,
    effectiveBookingDate: isClosed ? today : bookingDate,
    closingDate,
  }
}