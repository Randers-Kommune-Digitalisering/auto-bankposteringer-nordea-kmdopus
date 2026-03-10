import { z } from 'zod'
import { and, asc, desc, eq, gte, inArray, isNull, lte, or, sql } from 'drizzle-orm'
import { getQuery, setHeader } from 'h3'
import db from '~/lib/db'
import { errorLog } from '~/lib/db/schema/error'
import { run } from '~/lib/db/schema/run'
import { rule } from '~/lib/db/schema/rule'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'
import type { DashboardResponse } from '~/types/dashboard'

const querySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10)
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

function buildDateRange(start: Date, end: Date): string[] {
  const dates: string[] = []
  const cursor = new Date(start)
  cursor.setHours(12, 0, 0, 0)
  const endCopy = new Date(end)
  endCopy.setHours(12, 0, 0, 0)

  while (cursor <= endCopy) {
    dates.push(formatDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

export default defineEventHandler(async (event): Promise<DashboardResponse> => {
  setHeader(event, 'Cache-Control', 'private, max-age=30')

  const rawQuery = getQuery(event)
  const parsedQuery = querySchema.parse(rawQuery)

  const today = new Date()
  const defaultEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const defaultStart = new Date(defaultEnd)
  defaultStart.setDate(defaultStart.getDate() - 29)

  const startDate = parsedQuery.start ? parseDate(parsedQuery.start) : defaultStart
  const endDate = parsedQuery.end ? parseDate(parsedQuery.end) : defaultEnd

  const start = formatDate(startDate)
  const end = formatDate(endDate)

  const dateKeys = buildDateRange(startDate, endDate)

  const [seriesRows, openTxRows, ruleRows, runFailureRows, errorRows, latestRuns] = await Promise.all([
    db
      .select({
        date: transaction.bookingDate,
        totalTransactions: sql<number>`count(*)::int`,
        matchedTransactions: sql<number>`count(*) filter (where ${transactionProcessing.ruleApplied} is not null)::int`,
        autoBookedTransactions: sql<number>`count(*) filter (where ${transactionProcessing.status} = 'bogført' and ${transactionProcessing.ruleApplied} is not null)::int`,
      })
      .from(transaction)
      .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
      .where(and(gte(transaction.bookingDate, startDate), lte(transaction.bookingDate, endDate)))
      .groupBy(transaction.bookingDate)
      .orderBy(asc(transaction.bookingDate)),

    db
      .select({
        openTransactions: sql<number>`count(*)::int`,
      })
      .from(transaction)
      .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
      .where(or(isNull(transactionProcessing.status), eq(transactionProcessing.status, 'åben'))),

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

    db
      .select({
        failedRuns: sql<number>`count(*)::int`,
      })
      .from(run)
      .where(and(eq(run.status, 'fejl'), gte(run.bookingDate, startDate), lte(run.bookingDate, endDate))),

    db
      .select({
        errorCount: sql<number>`count(*)::int`,
      })
      .from(errorLog)
      .where(sql`date(${errorLog.createdAt}) between ${start} and ${end}`),

    db
      .select({
        id: run.id,
        bookingDate: run.bookingDate,
        status: run.status,
      })
      .from(run)
      .orderBy(desc(run.bookingDate))
      .limit(10),
  ])

  const runIds = latestRuns.map((entry) => entry.id)
  const [txCounts, errorCounts] = runIds.length
    ? await Promise.all([
        db
          .select({
            runId: transaction.runId,
            transactionsCount: sql<number>`count(*)::int`,
          })
          .from(transaction)
          .where(inArray(transaction.runId, runIds))
          .groupBy(transaction.runId),

        db
          .select({
            runId: errorLog.runId,
            errorsCount: sql<number>`count(*)::int`,
          })
          .from(errorLog)
          .where(inArray(errorLog.runId, runIds))
          .groupBy(errorLog.runId),
      ])
    : [[], []]

  const txCountByRunId = new Map<string, number>()
  for (const entry of txCounts) {
    if (entry.runId) txCountByRunId.set(entry.runId, clampNumber(entry.transactionsCount))
  }

  const errorCountByRunId = new Map<string, number>()
  for (const entry of errorCounts) {
    if (entry.runId) errorCountByRunId.set(entry.runId, clampNumber(entry.errorsCount))
  }

  const rawSeriesByDate = new Map<string, { total: number; matched: number; autoBooked: number }>()
  for (const row of seriesRows) {
    const dateKey = row.date instanceof Date ? formatDate(row.date) : String(row.date).slice(0, 10)
    rawSeriesByDate.set(dateKey, {
      total: clampNumber(row.totalTransactions),
      matched: clampNumber(row.matchedTransactions),
      autoBooked: clampNumber(row.autoBookedTransactions),
    })
  }

  const automationSeries = dateKeys.map((date) => {
    const entry = rawSeriesByDate.get(date) ?? { total: 0, matched: 0, autoBooked: 0 }
    return {
      date,
      totalTransactions: entry.total,
      matchedTransactions: entry.matched,
      autoBookedTransactions: entry.autoBooked,
      automationRatePercent: percent(entry.matched, entry.total),
    }
  })

  const totalTransactions = automationSeries.reduce((acc, p) => acc + p.totalTransactions, 0)
  const matchedTransactions = automationSeries.reduce((acc, p) => acc + p.matchedTransactions, 0)
  const autoBookedTransactions = automationSeries.reduce((acc, p) => acc + p.autoBookedTransactions, 0)

  const ruleAgg = ruleRows[0] ?? {
    activeRules: 0,
    inactiveRules: 0,
    unusedActiveRules: 0,
    ruleCreations: 0,
    ruleUpdates: 0,
    ruleDeactivations: 0,
  }

  const payload: DashboardResponse = {
    range: { start, end },
    kpis: {
      totalTransactions,
      matchedTransactions,
      autoBookedTransactions,
      automationRatePercent: percent(matchedTransactions, totalTransactions),
      openTransactions: clampNumber(openTxRows[0]?.openTransactions ?? 0),

      activeRules: clampNumber(ruleAgg.activeRules),
      inactiveRules: clampNumber(ruleAgg.inactiveRules),
      unusedActiveRules: clampNumber(ruleAgg.unusedActiveRules),

      ruleCreations: clampNumber(ruleAgg.ruleCreations),
      ruleUpdates: clampNumber(ruleAgg.ruleUpdates),
      ruleDeactivations: clampNumber(ruleAgg.ruleDeactivations),

      failedRuns: clampNumber(runFailureRows[0]?.failedRuns ?? 0),
      errorCount: clampNumber(errorRows[0]?.errorCount ?? 0),
    },
    automationSeries,
    latestRuns: latestRuns.map((entry) => ({
      id: entry.id,
      bookingDate: entry.bookingDate instanceof Date ? formatDate(entry.bookingDate) : String(entry.bookingDate).slice(0, 10),
      status: entry.status ?? null,
      transactionsCount: txCountByRunId.get(entry.id) ?? 0,
      errorsCount: errorCountByRunId.get(entry.id) ?? 0,
    })),
  }

  setHeader(event, 'X-Data-Source', 'db')
  return payload
})
