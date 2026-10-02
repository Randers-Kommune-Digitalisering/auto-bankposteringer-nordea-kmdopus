const ERP_POLL_TIME_ZONE = 'Europe/Copenhagen'

const localDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: ERP_POLL_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function getCopenhagenErpPollSlot(now: Date): string | null {
  const parts = Object.fromEntries(
    localDateTimeFormatter.formatToParts(now).map(part => [part.type, part.value]),
  )
  const hour = Number(parts.hour)
  if (parts.minute !== '00' || (hour !== 0 && hour !== 12)) return null

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:00:00[${ERP_POLL_TIME_ZONE}]`
}