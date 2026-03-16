import crypto from 'node:crypto'
import db from '~/lib/db'
import { job } from '~/lib/db/schema/job'

export async function enqueueJob(
  type: string,
  payload: unknown = {},
  options: { runAt?: Date; runId?: string } = {},
): Promise<string> {
  const id = crypto.randomUUID()
  await db.insert(job).values({
    id,
    type,
    payload: payload as any,
    ...(options.runId ? { runId: options.runId } : {}),
    ...(options.runAt ? { runAt: options.runAt } : {}),
  })
  return id
}
