import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import { outbox } from '~/lib/db/schema/outbox'
import { smtpNotificationConfig } from '~/lib/env/env'
import { logger } from '~/lib/logger'
import type { MailMessage } from './smtpClient'
import { sendSmtpMail } from './smtpClient'
import { safeEmailMeta } from '~/lib/logging/logMeta'

export type SubmitMailNotificationInput = {
  runId: string
  notification: MailMessage
  /** Optional stable dedupe key. If omitted, we dedupe only within the current run. */
  dedupeKey?: string
}

export async function submitMailNotificationViaOutbox(
  input: SubmitMailNotificationInput,
): Promise<{ outboxId: string } | { outboxId: string; skipped: true }> {
  const log = logger.child({ scope: 'notifications.submitMailNotificationViaOutbox', runId: input.runId })

  const to = input.notification.to.trim()
  if (!to) {
    return { outboxId: crypto.randomUUID(), skipped: true }
  }

  const toMeta = safeEmailMeta(to)

  const dedupeKey =
    input.dedupeKey ??
    `notifications.mail:${input.runId}:${to}:${crypto
      .createHash('sha256')
      .update(input.notification.subject + '\n' + input.notification.body)
      .digest('hex')}`
  const lockedBy = `submit-${process.pid}-${crypto.randomUUID()}`

  const outboxId = await db.transaction(async trx => {
    const [row] = await trx
      .insert(outbox)
      .values({
        topic: 'notifications.mail',
        runId: input.runId,
        dedupeKey,
        payload: {
          to,
          subject: input.notification.subject,
          body: input.notification.body,
        },
        status: 'processing',
        lockedAt: new Date(),
        lockedBy,
        nextAttemptAt: new Date(),
      })
      .onConflictDoNothing()
      .returning({ id: outbox.id })

    if (row?.id) return row.id

    const existing = await trx
      .select({ id: outbox.id })
      .from(outbox)
      .where(eq(outbox.dedupeKey, dedupeKey))
      .limit(1)

    if (!existing[0]?.id) {
      throw new Error('Kunne ikke oprette eller finde outbox record for mail-notifikation')
    }

    return existing[0].id
  })

  try {
    log.info('notification.mail.send_attempt', { outboxId, ...toMeta })
    await sendSmtpMail(
      {
        host: smtpNotificationConfig.host,
        allowedRecipientDomain: smtpNotificationConfig.allowedRecipientDomain,
        port: smtpNotificationConfig.port,
        senderAddress: smtpNotificationConfig.senderAddress,
      },
      input.notification,
    )

    await db
      .update(outbox)
      .set({
        status: 'sent',
        lockedAt: null,
        lockedBy: null,
        processedAt: new Date(),
        lastError: null,
        payload: { ...input.notification, result: { ok: true } },
      })
      .where(eq(outbox.id, outboxId))

    log.info('notification.mail.sent', { outboxId, ...toMeta })
    return { outboxId }
  } catch (err) {
    log.error('notification.mail.failed', { outboxId, ...toMeta, err })

    await db
      .update(outbox)
      .set({
        status: 'failed',
        lockedAt: null,
        lockedBy: null,
        lastError: String(err instanceof Error ? err.message : err),
        nextAttemptAt: new Date(Date.now() + 5 * 60 * 1000),
      })
      .where(eq(outbox.id, outboxId))

    throw err
  }
}
