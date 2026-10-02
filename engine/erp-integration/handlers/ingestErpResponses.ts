import crypto from 'node:crypto'
import db from '~/lib/db'
import { erpResponse } from '~/lib/db/schema/erp'
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
    deleteAfterPickup: options.deleteAfterPickup,
  })

  let savedResponses = 0
  for (const response of result.responses) {
    const inserted = await db.insert(erpResponse).values({
      id: crypto.randomUUID(),
      requestId: response.requestId,
      statusText: response.statusText ?? null,
      payload: response.payload,
    }).onConflictDoNothing({ target: erpResponse.requestId }).returning({ id: erpResponse.id })
    savedResponses += inserted.length
  }

  log.info('ERP responses ingested', { savedResponses, receivedResponses: result.responses.length })

  return {
    savedResponses,
    deletedRemoteFiles: result.deletedRemoteFiles,
  }
}

// Backwards-compatible alias used by older call-sites.
export async function ingestErpReceipts(options: { limit?: number; deleteAfterPickup?: boolean } = {}) {
  return ingestErpResponses(options)
}
