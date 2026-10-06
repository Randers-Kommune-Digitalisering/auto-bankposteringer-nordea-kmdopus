import type { PostingLineInput } from '../../posting/domain/posting'

export type ErpSupplierKey = string

// Abstract targets that ERP adapters can map to.
// Example (KMD): GL_ACCOUNT, COSTCENTER, WBS_ELEMENT.
export type ErpPostingDimensionTarget = 'glAccount' | 'costCenter' | 'wbsElement'

export type DimensionKeyByTarget = Partial<Record<ErpPostingDimensionTarget, string>>

export type BuildErpRequestInput = {
  runId: string
  bookingDate: Date | string
  postings: PostingLineInput[]
  dimensionKeyByTarget?: DimensionKeyByTarget
}

export type BuiltErpRequest = {
  requestId: string
  documentId: string
  filename: string
  payload: string
  lineCount: number
}

export type IngestErpResponsesOptions = {
  limit?: number
  deleteAfterPickup?: boolean
}

export type IngestedErpResponse = {
  requestFilename?: string
  payload: string
  remotePath?: string
  statusText?: string
  documents?: Array<{
    documentId: string
    status: 'accepted' | 'rejected' | 'unknown'
    messages: Array<{ type: string; number: string; text: string }>
  }>
}

export interface ErpAdapter {
  supplier: ErpSupplierKey

  buildRequest(input: BuildErpRequestInput): BuiltErpRequest

  uploadRequestPayload(input: {
    filename: string
    content: string
  }): Promise<{ remotePath: string }>

  ingestResponses(options?: IngestErpResponsesOptions): Promise<{
    responses: IngestedErpResponse[]
    deletedRemoteFiles: number
  }>

  deleteResponseFile?(remotePath: string): Promise<void>
}
