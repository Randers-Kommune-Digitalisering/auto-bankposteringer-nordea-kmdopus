import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import { tenantConfiguration } from '~/lib/db/schema/rule'
import { getBookingPeriodState } from '#engine/posting/domain/bookingPeriod'

const TENANT_CONFIG_ID = 1

function getCopenhagenDate(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Copenhagen',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export async function resolveManualBookingDate(originalBookingDate: string, confirmed: boolean) {
  const [configuration] = await db
    .select({ bookingPeriodCloseDay: tenantConfiguration.bookingPeriodCloseDay })
    .from(tenantConfiguration)
    .where(eq(tenantConfiguration.id, TENANT_CONFIG_ID))
    .limit(1)

  if (!configuration) {
    throw createError({ statusCode: 500, statusMessage: 'Tenant-konfiguration mangler' })
  }

  const state = getBookingPeriodState({
    bookingDate: originalBookingDate,
    today: getCopenhagenDate(),
    closingDay: configuration.bookingPeriodCloseDay,
  })

  if (state.isClosed && !confirmed) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Bogføringsperioden er afsluttet',
      data: {
        code: 'BOOKING_PERIOD_CLOSED',
        originalBookingDate: state.bookingDate,
        effectiveBookingDate: state.effectiveBookingDate,
        closingDate: state.closingDate,
      },
    })
  }

  return state.effectiveBookingDate
}