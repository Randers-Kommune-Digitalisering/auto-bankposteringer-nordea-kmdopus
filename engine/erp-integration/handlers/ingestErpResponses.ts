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

  for (const response of result.responses) {
    await db.insert(erpResponse).values({
      id: crypto.randomUUID(),
      requestId: response.requestId,
      payload: response.payload,
    })
  }

  log.info('ERP responses ingested', { savedResponses: result.responses.length })

  return {
    savedResponses: result.responses.length,
    deletedRemoteFiles: result.deletedRemoteFiles,
  }
}

// Backwards-compatible alias used by older call-sites.
export async function ingestErpReceipts(options: { limit?: number; deleteAfterPickup?: boolean } = {}) {
  return ingestErpResponses(options)
}
