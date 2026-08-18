export type DashboardRange = {
  start: string
  end: string
}

export type DashboardKpis = {
  totalTransactions: number
  matchedTransactions: number
  autoBookedTransactions: number
  automationRatePercent: number

  openSamleposter: number

  activeRules: number
  inactiveRules: number
  unusedActiveRules: number

  ruleCreations: number
  ruleUpdates: number
  ruleDeactivations: number

  failedRuns: number
  errorCount: number
}

export type DashboardAutomationSeriesPoint = {
  date: string
  totalTransactions: number
  matchedTransactions: number
  autoBookedTransactions: number
  automationRatePercent: number
}

export type DashboardLatestRun = {
  id: string
  bookingDate: string
  status: string | null
  transactionsCount: number
  processedTransactionsCount: number
  bookedTransactionsCount: number
  openTransactionsCount: number
  exceptionTransactionsCount: number
  activeErrorsCount: number
  eventCount: number
  erpRejected: boolean
  lastActivityAt: string | null
}

export type DashboardResponse = {
  range: DashboardRange
  kpis: DashboardKpis
  automationSeries: DashboardAutomationSeriesPoint[]
  latestRuns: DashboardLatestRun[]
}
