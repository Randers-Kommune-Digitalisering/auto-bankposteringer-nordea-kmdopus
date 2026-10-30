export function isWeekendBookingDate(bookingDateIso: string): boolean {
  const day = new Date(`${bookingDateIso}T00:00:00.000Z`).getUTCDay()
  return day === 0 || day === 6
}

export function getLatestCompletedWeekday(scheduledTimeIso: string): string {
  const scheduledDateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Copenhagen',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(scheduledTimeIso))
  const values = Object.fromEntries(scheduledDateParts.map(part => [part.type, part.value]))
  const date = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)))

  date.setUTCDate(date.getUTCDate() - 1)
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
    date.setUTCDate(date.getUTCDate() - 1)
  }

  return date.toISOString().slice(0, 10)
}
