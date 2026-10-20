export type ErpRequestOverviewGroup = {
  requestId: string
  groupLabel: string
  documentId: string | null
  documentLabel: string
  bookingDate: string | null
  transactionCount: number
  statusLabel: string
  statusColor: 'success' | 'error' | 'warning' | 'neutral'
  statusDetail: string | null
  childCount: number
}

export type ErpRequestOverviewItem = {
  requestId: string
  runId: string
  groupingKey: string
  group: ErpRequestOverviewGroup
  documentId: string | null
  documentOrigin: 'batch' | 'manual' | null
  documentLabel: string
  bookingDate: string | null
  transactionCount: number
  statusLabel: string
  statusColor: 'success' | 'error' | 'warning' | 'neutral'
  statusDetail: string | null
}

export type ErpRequestOverviewResponse = {
  items: ErpRequestOverviewItem[]
  total: number
  page: number
  pageSize: number
}
