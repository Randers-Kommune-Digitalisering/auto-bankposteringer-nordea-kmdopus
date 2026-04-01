import { defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import {
  notificationSettings,
  notificationSettingsPayloadSchema,
} from '~/lib/db/schema/notificationSettings'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = notificationSettingsPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues,
    }
  }

  await db
    .insert(notificationSettings)
    .values({ id: 'default', mailTemplate: parsed.data.mailTemplate, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: notificationSettings.id,
      set: { mailTemplate: parsed.data.mailTemplate, updatedAt: new Date() },
    })

  const [row] = await db
    .select({ mailTemplate: notificationSettings.mailTemplate })
    .from(notificationSettings)
    .where(eq(notificationSettings.id, 'default'))
    .limit(1)

  return { ok: true, mailTemplate: row?.mailTemplate ?? parsed.data.mailTemplate }
})
