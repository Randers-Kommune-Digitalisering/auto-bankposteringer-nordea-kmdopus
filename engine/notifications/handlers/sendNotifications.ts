import { logger } from '~/lib/logger'
import type { MatchSummary } from '../../matching/handlers/transactionMatchingService'
import { submitMailNotificationViaOutbox } from '../infrastructure/notificationOutbox'

export async function sendNotificationsForRun(input: {
  runId: string
  summary: Pick<MatchSummary, 'notifications'>
}): Promise<{ sent: number }>{
  const log = logger.child({ scope: 'notifications.sendNotificationsForRun', runId: input.runId })

  if (!input.summary.notifications.length) {
    return { sent: 0 }
  }

  let sent = 0
  for (const notification of input.summary.notifications) {
    await submitMailNotificationViaOutbox({ runId: input.runId, notification })
    sent += 1
  }

  return { sent }
}
