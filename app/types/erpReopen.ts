export type ErpRequestReopenResponse = {
  success: true
  requestId: string
  requestedTransactionIds: string[]
  requestedLineNos: number[]
  missingTransactionIds: string[]
  reopened: number
  eligibleTransactions: number
  missingLineNos: number[]
  unmappedLineNos: number[]
  skippedNotBooked: number
}

export type RunReopenResponse = {
  success: true
  runId: string
  reopened: number
}