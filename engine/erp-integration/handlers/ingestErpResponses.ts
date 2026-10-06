import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import { erpDocument, erpRequest, erpResponse, erpResponseDocument } from '~/lib/db/schema/erp'
import { runTimelineEvent } from '~/lib/db/schema/runTimelineEvent'
import { logger } from '~/lib/logger'
import { getErpAdapter } from '../registry'

export type IngestErpResponsesResult = {
  savedResponses: number
  deletedRemoteFiles: number
}

/**
 * Use-case: Modtagelse/indlæsning af kvittering/retursvar fra ERP.
 */
export async function ingestErpResponses(options: {
  limit?: number
  deleteAfterPickup?: boolean
  erpSupplier?: string
} = {}): Promise<IngestErpResponsesResult> {
  const log = logger.child({ scope: 'erp.ingestResponses' })
  const adapter = getErpAdapter(options.erpSupplier)

  const result = await adapter.ingestResponses({
    limit: options.limit,
    deleteAfterPickup: false,
  })

  let savedResponses = 0
  let deletedRemoteFiles = 0
  for (const response of result.responses) {
    const requestFilename = response.requestFilename?.trim()
    if (!requestFilename) {
      throw new Error(`ERP response mangler requestfilnavn i CONTROL_FIELDS.FILE_NAME (${response.remotePath ?? 'ukendt fil'})`)
    }

    let [request] = await db
      .select({ id: erpRequest.id, runId: erpRequest.runId })
      .from(erpRequest)
      .where(eq(erpRequest.filename, requestFilename))
      .limit(1)

    if (!request) {
      [request] = await db
        .select({ id: erpRequest.id, runId: erpRequest.runId })
        .from(erpRequest)
        .where(eq(erpRequest.id, requestFilename))
        .limit(1)
    }

    if (!request) {
      throw new Error(`ERP response matcher ikke et gemt request: ${requestFilename}`)
    }

    const inserted = await db.transaction(async (tx) => {
      const documentIds = [...new Set((response.documents ?? []).map(document => document.documentId))]
      if (documentIds.length) {
        await tx
          .insert(erpDocument)
          .values(documentIds.map(id => ({ id, runId: request.runId })))
          .onConflictDoNothing()
      }

      const responseId = crypto.randomUUID()
      const created = await tx
        .insert(erpResponse)
        .values({
          id: responseId,
          requestId: request.id,
          statusText: response.statusText ?? null,
          payload: response.payload,
        })
        .onConflictDoNothing({ target: erpResponse.requestId })
        .returning({ id: erpResponse.id })

      let persistedResponseId = created[0]?.id
      if (!persistedResponseId) {
        const [existing] = await tx
          .select({ id: erpResponse.id })
          .from(erpResponse)
          .where(eq(erpResponse.requestId, request.id))
          .limit(1)
        if (!existing?.id) {
          throw new Error(`ERP response kunne ikke gemmes for request ${request.id}`)
        }
        persistedResponseId = existing.id
      }
      const outcomes = response.documents ?? []
      if (outcomes.length) {
        await tx
          .insert(erpResponseDocument)
          .values(outcomes.map(document => ({
            responseId: persistedResponseId,
            documentId: document.documentId,
            status: document.status,
            messages: document.messages,
          })))
          .onConflictDoNothing()
      }

      if (created.length > 0) {
        const rejected = response.documents?.some(document => document.status === 'rejected') ?? false
        const accepted = response.documents?.length
          ? response.documents.every(document => document.status === 'accepted')
          : String(response.statusText ?? '').trim().toUpperCase().startsWith('OK')
        const eventType = rejected ? 'response_rejected' : accepted ? 'response_accepted' : 'response_unknown'
        const status = rejected ? 'rejected' : accepted ? 'accepted' : 'unknown'

        await tx.insert(runTimelineEvent).values({
          runId: request.runId,
          stage: 'erp',
          eventType,
          status,
          detail: accepted ? 'ERP har accepteret bilaget.' : rejected ? 'ERP har afvist bilaget.' : 'ERP-svar modtaget; status kunne ikke klassificeres.',
          requestId: request.id,
        })
      }

      return created.length > 0
    })

    savedResponses += Number(inserted)

    if (options.deleteAfterPickup && response.remotePath) {
      if (!adapter.deleteResponseFile) {
        throw new Error(`ERP-adapter kan ikke slette responsefilen efter persistens: ${response.remotePath}`)
      }
      await adapter.deleteResponseFile(response.remotePath)
      deletedRemoteFiles += 1
    }
  }

  log.info('ERP responses ingested', { savedResponses, receivedResponses: result.responses.length })

  return {
    savedResponses,
    deletedRemoteFiles,
  }
}

// Backwards-compatible alias used by older call-sites.
export async function ingestErpReceipts(options: { limit?: number; deleteAfterPickup?: boolean } = {}) {
  return ingestErpResponses(options)
}
