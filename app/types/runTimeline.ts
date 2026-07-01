export type TimelineJob = {
  id: string
  type: string
  status: string
  runId: string | null
  attempts: number
  runAt: string
  lastError: string | null
  updatedAt: string
}

export type TimelineOutbox = {
  id: string
  topic: string
  status: string
  attempts: number
  nextAttemptAt: string | null
  lastError: string | null
  requestId: string | null
  responseId: string | null
  responseStatusText: string | null
  createdAt: string
  processedAt: string | null
}

export type TimelineErpRequest = {
  requestId: string
  responseId: string | null
  responseStatusText: string | null
  lineCount: number
}

export type TimelineError = {
  id: string
  source: string | null
  errorCode: number | null
  errorString: string | null
  createdAt: string
}

export type MatchingSummary = {
  totalTransactions: number
  processedTransactions: number
  matched: number
  exception: number
  open: number
}

export type RunTimelineResponse = {
  run: {
    id: string
    bookingDate: string
    status: string | null
  }
  jobs: TimelineJob[]
  outbox: TimelineOutbox[]
  erpRequests: TimelineErpRequest[]
  errors: TimelineError[]
  matching: MatchingSummary
}
