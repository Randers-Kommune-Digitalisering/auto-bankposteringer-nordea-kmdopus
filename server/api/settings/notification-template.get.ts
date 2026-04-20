import { defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import { notificationSettings } from '~/lib/db/schema/notificationSettings'
import { getDefaultNotificationTemplate } from '#engine/notifications/domain/notificationTemplate'

export default defineEventHandler(async () => {
  const [row] = await db
    .select({ mailTemplate: notificationSettings.mailTemplate, adminEmail: notificationSettings.adminEmail })
    .from(notificationSettings)
    .where(eq(notificationSettings.id, 'default'))
    .limit(1)

  return {
    mailTemplate: row?.mailTemplate ?? getDefaultNotificationTemplate(),
    adminEmail: row?.adminEmail ?? null,
  }
})
