import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import { erpRequest } from '~/lib/db/schema/erp'
import { outbox } from '~/lib/db/schema/outbox'
import { logger } from '~/lib/logger'
import type { PostingLineInput } from '../../posting/domain/posting'
import { getErpAdapter } from '../registry'

export type SubmitErpPostingOutboxInput = {
  runId: string
  postings: PostingLineInput[]
  bookingDate: Date | string
  erpSupplier?: string
}

export type SubmitErpPostingOutboxResult = {
  requestId: string
  filename: string
  remotePath: string
  lineCount: number
}

export async function submitErpPostingViaOutbox(
  input: SubmitErpPostingOutboxInput,
): Promise<SubmitErpPostingOutboxResult> {
  const log = logger.child({ scope: 'erp.submitErpPostingViaOutbox', runId: input.runId })
  const adapter = getErpAdapter(input.erpSupplier)

  const built = adapter.buildRequest({
    runId: input.runId,
    bookingDate: input.bookingDate,
    postings: input.postings,
  })

  const requestId = built.requestId
  const dedupeKey = `erp.upload:${requestId}`
  const lockedBy = `submit-${process.pid}-${crypto.randomUUID()}`

  const outboxId = await db.transaction(async trx => {
    await trx
      .insert(erpRequest)
      .values({ id: requestId, runId: input.runId, payload: built.payload })
      .onConflictDoNothing()

    const [row] = await trx
      .insert(outbox)
      .values({
        topic: 'erp.uploadRequestPayload',
        runId: input.runId,
        dedupeKey,
        payload: {
          requestId,
          filename: built.filename,
          lineCount: built.lineCount,
          erpSupplier: adapter.supplier,
        },
        // We upload synchronously right after creating the outbox row.
        // Mark it as processing+locked to avoid the worker racing and uploading twice.
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
      throw new Error('Kunne ikke oprette eller finde outbox record for ERP upload')
    }

    return existing[0].id
  })

  try {
    const result = await uploadErpRequestPayload({ requestId, erpSupplier: adapter.supplier })

    await db
      .update(outbox)
      .set({
        status: 'sent',
        lockedAt: null,
        lockedBy: null,
        processedAt: new Date(),
        lastError: null,
        payload: { requestId, filename: built.filename, lineCount: built.lineCount, result },
      })
      .where(eq(outbox.id, outboxId))

    log.info('ERP-postering uploadet', { requestId, remotePath: result.remotePath })

    return {
      requestId,
      filename: built.filename,
      remotePath: result.remotePath,
      lineCount: built.lineCount,
    }
  } catch (err) {
    log.error('ERP upload fejlede (outbox vil retry)', { requestId, err })

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

export async function uploadErpRequestPayload(options: {
  requestId: string
  erpSupplier?: string
}): Promise<{ requestId: string; remotePath: string }> {
  const [row] = await db
    .select({ id: erpRequest.id, payload: erpRequest.payload })
    .from(erpRequest)
    .where(eq(erpRequest.id, options.requestId))
    .limit(1)

  if (!row?.id || !row.payload) {
    throw new Error(`ERP request payload ikke fundet for requestId=${options.requestId}`)
  }

  const adapter = getErpAdapter(options.erpSupplier)
  const { remotePath } = await adapter.uploadRequestPayload({ filename: row.id, content: row.payload })

  return { requestId: row.id, remotePath }
}
