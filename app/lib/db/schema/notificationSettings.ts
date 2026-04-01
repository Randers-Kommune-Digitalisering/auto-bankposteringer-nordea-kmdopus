import { z } from 'zod'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const notificationSettings = pgTable('notification_settings', {
  id: text('id').primaryKey(),
  mailTemplate: text('mail_template').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const notificationSettingsInsertSchema = createInsertSchema(notificationSettings)
export const notificationSettingsUpdateSchema = createUpdateSchema(notificationSettings)
export const notificationSettingsSelectSchema = createSelectSchema(notificationSettings)

export const notificationSettingsPayloadSchema = z.object({
  mailTemplate: z.string().min(1, 'Skabelon må ikke være tom'),
})

export type NotificationSettingsPayload = z.infer<typeof notificationSettingsPayloadSchema>
