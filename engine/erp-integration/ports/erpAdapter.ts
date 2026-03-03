import type { PostingLineInput } from '../../posting/domain/posting'

export type ErpSupplierKey = string

export type BuildErpRequestInput = {
  runId: string
  bookingDate: Date | string
  postings: PostingLineInput[]
}

export type BuiltErpRequest = {
  requestId: string
  filename: string
  payload: string
  lineCount: number
}

export type IngestErpResponsesOptions = {
  limit?: number
  deleteAfterPickup?: boolean
}

export type IngestedErpResponse = {
  requestId?: string
  payload: string
  remotePath?: string
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
}
