import { z } from 'zod'
import { and, asc, desc, eq, gte, inArray, isNull, lte, or, sql } from 'drizzle-orm'
import { getQuery, setHeader } from 'h3'
import db from '~/lib/db'
import { createUtcIsoString } from '~~/utils/function'
import { errorLog } from '~/lib/db/schema/error'
import { erpRequest, erpResponse, erpResponseDocument } from '~/lib/db/schema/erp'
import { job } from '~/lib/db/schema/job'
import { outbox } from '~/lib/db/schema/outbox'
import { run } from '~/lib/db/schema/run'
import { rule } from '~/lib/db/schema/rule'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'
import type { DashboardResponse } from '~/types/dashboard'
import { toSamlepostId, toStatementEntryKey } from '~~/server/utils/iso20022Samlepost'
import { resolveEffectiveRunStatus } from '~~/server/utils/runs/runStatus'
import { collectCurrentRunIssues, resolveCurrentErpDocumentRejections } from '~~/server/utils/runs/currentRunIssues'
import { summarizeRunSamleposter, type RunSamlepostRow } from '~~/server/utils/runs/runSamlepostSummary'

const querySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  accountIds: z.string().optional(),
  accounts: z.string().optional(),
})

function parseStringArrayParam(value: unknown): string[] {
  if (value == null) return []
  if (Array.isArray(value)) {
    return value
      .flatMap((v) => (typeof v === 'string' ? v.split(',') : []))
      .map((v) => v.trim())
      .filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  }
  return []
}

function parseDate(value: string): Date {
  // Interpret YYYY-MM-DD as local midnight; ok because we compare against DATE columns
  const parts = value.split('-').map((entry) => Number(entry))
  const y = parts[0] ?? 1970
  const m = parts[1] ?? 1
  const d = parts[2] ?? 1
  return new Date(y, m - 1, d)
}

function clampNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

function percent(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 1000) / 10
}

export default defineEventHandler(async (event): Promise<DashboardResponse> => {
  setHeader(event, 'Cache-Control', 'no-store')

  const rawQuery = getQuery(event)
  const parsedQuery = querySchema.parse(rawQuery)

  const accountIds = parseStringArrayParam(
    (rawQuery as any).accountIds ??
      (rawQuery as any)['accountIds[]'] ??
      (rawQuery as any).accounts ??
      (rawQuery as any)['accounts[]'],
  )

  const today = new Date()
  const defaultEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const defaultStart = new Date(defaultEnd)
  defaultStart.setDate(defaultStart.getDate() - 29)

  const startDate = parsedQuery.start ? parseDate(parsedQuery.start) : defaultStart
  const endDate = parsedQuery.end ? parseDate(parsedQuery.end) : defaultEnd
  const start = createUtcIsoString(startDate)
  const end = createUtcIsoString(endDate)

  const txAccountFilter = accountIds.length ? inArray(transaction.accountId, accountIds) : null
  const [seriesRows, openRowsForTopTx, ruleRows, scopedRuns, latestRuns] = await Promise.all([
    db
      .select({
        date: run.bookingDate,
        totalTransactions: sql<number>`count(*)::int`,
        matchedTransactions: sql<number>`count(*) filter (where ${transactionProcessing.ruleApplied} is not null)::int`,
        autoBookedTransactions: sql<number>`count(*) filter (where ${transactionProcessing.status} = 'bogført' and ${transactionProcessing.ruleApplied} is not null)::int`,
      })
      .from(transaction)
      .innerJoin(run, eq(transaction.runId, run.id))
      .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
      .where(and(
        gte(run.bookingDate, startDate),
        lte(run.bookingDate, endDate),
        ...(txAccountFilter ? [txAccountFilter] : []),
      ))
      .groupBy(run.bookingDate)
      .orderBy(asc(run.bookingDate)),

    db
      .select({
        id: transaction.id,
        accountId: transaction.accountId,
        statementId: transaction.statementId,
        entryIndex: transaction.entryIndex,
        bookingDate: transaction.bookingDate,
        creditDebitIndicator: transaction.creditDebitIndicator,
        ntryRef: transaction.ntryRef,
        entryAdditionalInfo: transaction.entryAdditionalInfo,
        ntryAcctSvcrRef: transaction.ntryAcctSvcrRef,
      })
      .from(transaction)
      .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
      .where(and(
        or(isNull(transactionProcessing.status), eq(transactionProcessing.status, 'åben')),
        ...(txAccountFilter ? [txAccountFilter] : []),
      ))
      .orderBy(desc(transaction.bookingDate), desc(transaction.id)),

    db
      .select({
        activeRules: sql<number>`count(*) filter (where ${rule.status} = 'aktiv')::int`,
        inactiveRules: sql<number>`count(*) filter (where ${rule.status} = 'inaktiv')::int`,
        unusedActiveRules: sql<number>`count(*) filter (where ${rule.status} = 'aktiv' and (${rule.lastUsed} is null or ${rule.lastUsed} < ${startDate}))::int`,
        ruleCreations: sql<number>`count(*) filter (where ${rule.createdAt} >= ${startDate} and ${rule.createdAt} <= ${endDate})::int`,
        ruleUpdates: sql<number>`count(*) filter (where ${rule.updatedAt} >= ${startDate} and ${rule.updatedAt} <= ${endDate})::int`,
        ruleDeactivations: sql<number>`count(*) filter (where ${rule.status} = 'inaktiv' and ${rule.updatedAt} >= ${startDate} and ${rule.updatedAt} <= ${endDate})::int`,
      })
      .from(rule),

    accountIds.length
      ? db
          .select({ id: run.id })
          .from(run)
          .innerJoin(transaction, eq(transaction.runId, run.id))
          .where(and(
            gte(run.bookingDate, startDate),
            lte(run.bookingDate, endDate),
            inArray(transaction.accountId, accountIds),
          ))
          .groupBy(run.id)
      : db
          .select({ id: run.id })
          .from(run)
          .where(and(gte(run.bookingDate, startDate), lte(run.bookingDate, endDate))),

    accountIds.length
      ? db
          .select({
            id: run.id,
            bookingDate: run.bookingDate,
            status: run.status,
          })
          .from(run)
          .innerJoin(transaction, eq(transaction.runId, run.id))
          .where(inArray(transaction.accountId, accountIds))
          .groupBy(run.id, run.bookingDate, run.status)
          .orderBy(desc(run.bookingDate))
          .limit(10)
      : db
          .select({
            id: run.id,
            bookingDate: run.bookingDate,
            status: run.status,
          })
          .from(run)
          .orderBy(desc(run.bookingDate))
          .limit(10),
  ])

  const scopedRunIds = scopedRuns.map(entry => String(entry.id))
  const latestRunIds = latestRuns.map(entry => String(entry.id))
  const runIds = [...new Set([...latestRunIds, ...scopedRunIds])]
  const [txRows, errorRowsForRuns, jobRows, outboxRows, requestRows, responseOutcomeRows, responseStatusRows] = runIds.length
    ? await Promise.all([
        db
          .select({
            runId: transaction.runId,
            id: transaction.id,
            accountId: transaction.accountId,
            statementId: transaction.statementId,
            entryIndex: transaction.entryIndex,
            bookingDate: transaction.bookingDate,
            creditDebitIndicator: transaction.creditDebitIndicator,
            ntryRef: transaction.ntryRef,
            entryAdditionalInfo: transaction.entryAdditionalInfo,
            ntryAcctSvcrRef: transaction.ntryAcctSvcrRef,
            processingStatus: transactionProcessing.status,
            processingSource: transactionProcessing.source,
          })
          .from(transaction)
          .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
          .where(and(
            latestRunIds.length ? inArray(transaction.runId, latestRunIds) : sql`false`,
            ...(txAccountFilter ? [txAccountFilter] : []),
          )),

        db
          .select({
            id: errorLog.id,
            runId: errorLog.runId,
            source: errorLog.source,
            errorCode: errorLog.errorCode,
            errorString: errorLog.errorString,
            createdAt: errorLog.createdAt,
          })
          .from(errorLog)
          .where(inArray(errorLog.runId, runIds))
          .orderBy(asc(errorLog.createdAt)),

        db
          .select({ id: job.id, runId: job.runId, type: job.type, status: job.status, lastError: job.lastError, updatedAt: job.updatedAt })
          .from(job)
          .where(inArray(job.runId, runIds)),

        db
          .select({
            id: outbox.id,
            runId: outbox.runId,
            topic: outbox.topic,
            status: outbox.status,
            lastError: outbox.lastError,
            createdAt: outbox.createdAt,
            processedAt: outbox.processedAt,
            requestId: sql<string | null>`${outbox.payload} ->> 'requestId'`,
          })
          .from(outbox)
          .where(inArray(outbox.runId, runIds)),

        db
          .select({
            runId: erpRequest.runId,
            requestId: erpRequest.id,
            sourceRequestId: erpRequest.sourceRequestId,
            documentId: erpRequest.documentId,
          })
          .from(erpRequest)
          .where(inArray(erpRequest.runId, runIds)),

        db
          .select({
            runId: erpRequest.runId,
            requestId: erpRequest.id,
            documentId: erpResponseDocument.documentId,
            status: erpResponseDocument.status,
            messages: erpResponseDocument.messages,
          })
          .from(erpResponseDocument)
          .innerJoin(erpResponse, eq(erpResponse.id, erpResponseDocument.responseId))
          .innerJoin(erpRequest, eq(erpRequest.id, erpResponse.requestId))
          .where(inArray(erpRequest.runId, runIds)),

        db
          .select({ runId: erpRequest.runId, requestId: erpRequest.id, statusText: erpResponse.statusText })
          .from(erpRequest)
          .innerJoin(erpResponse, eq(erpResponse.requestId, erpRequest.id))
          .where(inArray(erpRequest.runId, runIds)),
      ])
    : [[], [], [], [], [], [], []]

  const transactionRowsByRunId = new Map<string, RunSamlepostRow[]>()
  for (const entry of txRows) {
    if (!entry.runId) continue
    const rows = transactionRowsByRunId.get(entry.runId) ?? []
    rows.push({
      id: String(entry.id),
      accountId: entry.accountId ? String(entry.accountId) : null,
      statementId: entry.statementId ? String(entry.statementId) : null,
      entryIndex: entry.entryIndex == null ? null : Number(entry.entryIndex),
      entryGroupSize: 0,
      bookingDate: entry.bookingDate,
      creditDebitIndicator: entry.creditDebitIndicator ? String(entry.creditDebitIndicator) : null,
      ntryRef: entry.ntryRef ? String(entry.ntryRef) : null,
      entryAdditionalInfo: entry.entryAdditionalInfo ? String(entry.entryAdditionalInfo) : null,
      ntryAcctSvcrRef: entry.ntryAcctSvcrRef ? String(entry.ntryAcctSvcrRef) : null,
      processingStatus: entry.processingStatus ? String(entry.processingStatus) : null,
      processingSource: entry.processingSource ? String(entry.processingSource) : null,
    })
    transactionRowsByRunId.set(entry.runId, rows)
  }
  const samlepostSummaryByRunId = new Map([...transactionRowsByRunId].map(([runId, rows]) => [runId, summarizeRunSamleposter(rows)]))

  const activeErrorsByRunId = new Map<string, number>()
  const eventCountByRunId = new Map<string, number>()
  const hasFailedIoByRunId = new Map<string, boolean>()
  const hasInFlightIoByRunId = new Map<string, boolean>()
  const hasNegativeErpResponseByRunId = new Map<string, boolean>()
  const lastActivityByRunId = new Map<string, Date>()

  const updateLastActivity = (runId: string | null, value: unknown) => {
    if (!runId || !value) return
    const date = value instanceof Date ? value : new Date(String(value))
    if (Number.isNaN(date.getTime())) return
    const current = lastActivityByRunId.get(runId)
    if (!current || date > current) lastActivityByRunId.set(runId, date)
  }

  const currentIssues = collectCurrentRunIssues({
    errorLogs: errorRowsForRuns,
    jobs: jobRows.map(row => ({ ...row, runId: row.runId ? String(row.runId) : null })),
    outbox: outboxRows.map(row => ({ ...row, runId: row.runId ? String(row.runId) : null })),
    rejectedErpDocuments: resolveCurrentErpDocumentRejections({
      requests: requestRows.map(row => ({
        runId: String(row.runId),
        requestId: String(row.requestId),
        sourceRequestId: row.sourceRequestId ? String(row.sourceRequestId) : null,
        documentId: row.documentId ? String(row.documentId) : null,
      })),
      outbox: outboxRows.map(row => ({
        requestId: row.requestId ? String(row.requestId) : null,
        createdAt: row.createdAt,
        topic: String(row.topic),
      })),
      outcomes: responseOutcomeRows.map(row => ({
        runId: String(row.runId),
        requestId: String(row.requestId),
        documentId: String(row.documentId),
        status: String(row.status),
        messages: row.messages,
      })),
      responseStatuses: responseStatusRows.map(row => ({
        runId: String(row.runId),
        requestId: String(row.requestId),
        statusText: row.statusText ? String(row.statusText) : null,
      })),
    }),
  })
  const issuesByRunId = new Map<string, typeof currentIssues>()
  for (const issue of currentIssues) {
    if (!issue.runId) continue
    const rows = issuesByRunId.get(issue.runId) ?? []
    rows.push(issue)
    issuesByRunId.set(issue.runId, rows)
    updateLastActivity(issue.runId, issue.createdAt)
    if (issue.id.startsWith('erp-document:')) hasNegativeErpResponseByRunId.set(issue.runId, true)
  }
  for (const [runId, rows] of issuesByRunId) activeErrorsByRunId.set(runId, rows.length)
  for (const row of errorRowsForRuns) {
    if (!row.runId) continue
    eventCountByRunId.set(row.runId, (eventCountByRunId.get(row.runId) ?? 0) + 1)
  }

  for (const entry of jobRows) {
    if (!entry.runId) continue
    const status = String(entry.status)
    if (status === 'failed') hasFailedIoByRunId.set(entry.runId, true)
    if (status === 'pending' || status === 'in_progress') hasInFlightIoByRunId.set(entry.runId, true)
    updateLastActivity(entry.runId, entry.updatedAt)
  }

  for (const entry of outboxRows) {
    if (!entry.runId) continue
    const status = String(entry.status)
    if (status === 'failed') hasFailedIoByRunId.set(entry.runId, true)
    if (status === 'pending' || status === 'processing') hasInFlightIoByRunId.set(entry.runId, true)
    updateLastActivity(entry.runId, entry.processedAt ?? entry.createdAt)
  }

  const automationSeries = seriesRows
    .filter((row) => clampNumber(row.totalTransactions) > 0)
    .map((row) => {
      const totalTransactions = clampNumber(row.totalTransactions)
      const matchedTransactions = clampNumber(row.matchedTransactions)
      return {
        date: row.date instanceof Date ? createUtcIsoString(row.date) : String(row.date).slice(0, 10),
        totalTransactions,
        matchedTransactions,
        autoBookedTransactions: clampNumber(row.autoBookedTransactions),
        automationRatePercent: percent(matchedTransactions, totalTransactions),
      }
    })

  const totalTransactions = automationSeries.reduce((acc, p) => acc + p.totalTransactions, 0)
  const matchedTransactions = automationSeries.reduce((acc, p) => acc + p.matchedTransactions, 0)
  const autoBookedTransactions = automationSeries.reduce((acc, p) => acc + p.autoBookedTransactions, 0)

  const openSamlepostIds = new Set<string>()
  const entryGroupSizeByEntryKey = new Map<string, number>()
  for (const row of openRowsForTopTx) {
    const entryKey = toStatementEntryKey(row.statementId, row.entryIndex)
    if (!entryKey) continue
    entryGroupSizeByEntryKey.set(entryKey, (entryGroupSizeByEntryKey.get(entryKey) ?? 0) + 1)
  }

  for (const row of openRowsForTopTx) {
    const entryKey = toStatementEntryKey(row.statementId, row.entryIndex)
    const entryGroupSize = entryKey ? (entryGroupSizeByEntryKey.get(entryKey) ?? 0) : 0
    const stackId = toSamlepostId({
      id: row.id,
      accountId: row.accountId,
      entryGroupSize,
      bookingDate: row.bookingDate,
      creditDebitIndicator: row.creditDebitIndicator,
      ntryRef: row.ntryRef,
      entryAdditionalInfo: row.entryAdditionalInfo,
      ntryAcctSvcrRef: row.ntryAcctSvcrRef,
    })

    openSamlepostIds.add(stackId)
  }

  const ruleAgg = ruleRows[0] ?? {
    activeRules: 0,
    inactiveRules: 0,
    unusedActiveRules: 0,
    ruleCreations: 0,
    ruleUpdates: 0,
    ruleDeactivations: 0,
  }

  const scopedRunIdSet = new Set(scopedRunIds)
  const errorCount = [...issuesByRunId.entries()]
    .filter(([runId]) => scopedRunIdSet.has(runId))
    .reduce((count, [, issues]) => count + issues.length, 0)

  const payload: DashboardResponse = {
    range: { start, end },
    kpis: {
      totalTransactions,
      matchedTransactions,
      autoBookedTransactions,
      automationRatePercent: percent(matchedTransactions, totalTransactions),
      openSamleposter: openSamlepostIds.size,

      activeRules: clampNumber(ruleAgg.activeRules),
      inactiveRules: clampNumber(ruleAgg.inactiveRules),
      unusedActiveRules: clampNumber(ruleAgg.unusedActiveRules),

      ruleCreations: clampNumber(ruleAgg.ruleCreations),
      ruleUpdates: clampNumber(ruleAgg.ruleUpdates),
      ruleDeactivations: clampNumber(ruleAgg.ruleDeactivations),

      errorCount,
    },
    automationSeries,
    latestRuns: latestRuns.map((entry) => ({
      id: entry.id,
      bookingDate: entry.bookingDate instanceof Date ? createUtcIsoString(entry.bookingDate) : String(entry.bookingDate).slice(0, 10),
      status: resolveEffectiveRunStatus({
        baseStatus: entry.status,
        hasActiveErrors: (activeErrorsByRunId.get(entry.id) ?? 0) > 0,
        hasNegativeErpResponse: hasNegativeErpResponseByRunId.get(entry.id) ?? false,
        hasFailedIo: hasFailedIoByRunId.get(entry.id) ?? false,
        hasInFlightIo: hasInFlightIoByRunId.get(entry.id) ?? false,
      }),
      totalSamleposterCount: samlepostSummaryByRunId.get(entry.id)?.totalSamleposter ?? 0,
      completedSamleposterCount: (samlepostSummaryByRunId.get(entry.id)?.bookedSamleposter ?? 0) +
        (samlepostSummaryByRunId.get(entry.id)?.exceptedSamleposter ?? 0) +
        (samlepostSummaryByRunId.get(entry.id)?.mixedSamleposter ?? 0),
      bookedSamleposterCount: samlepostSummaryByRunId.get(entry.id)?.bookedSamleposter ?? 0,
      openSamleposterCount: samlepostSummaryByRunId.get(entry.id)?.openSamleposter ?? 0,
      exceptionSamleposterCount: samlepostSummaryByRunId.get(entry.id)?.exceptedSamleposter ?? 0,
      mixedSamleposterCount: samlepostSummaryByRunId.get(entry.id)?.mixedSamleposter ?? 0,
      activeErrorsCount: activeErrorsByRunId.get(entry.id) ?? 0,
      eventCount: eventCountByRunId.get(entry.id) ?? 0,
      erpRejected: hasNegativeErpResponseByRunId.get(entry.id) ?? false,
      lastActivityAt: lastActivityByRunId.has(entry.id)
        ? lastActivityByRunId.get(entry.id)!.toISOString()
        : null,
    })),
  }

  setHeader(event, 'X-Data-Source', 'db')
  return payload
})
