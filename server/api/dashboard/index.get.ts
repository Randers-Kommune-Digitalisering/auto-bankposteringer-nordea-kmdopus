import { z } from 'zod'
import { and, asc, desc, eq, gte, inArray, isNull, lte, or, sql } from 'drizzle-orm'
import { getQuery, setHeader } from 'h3'
import db from '~/lib/db'
import { errorLog } from '~/lib/db/schema/error'
import { run } from '~/lib/db/schema/run'
import { rule } from '~/lib/db/schema/rule'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'
import type { DashboardResponse } from '~/types/dashboard'
import { buildNordeaDeterministicGroupKey } from '#engine/banking-ingestion/handlers/camt053/nordeaAdditionalEntryInfo'

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

function accountInSql(accountIds: string[]) {
  return sql`(${sql.join(accountIds.map((id) => sql`${id}`), sql`, `)})`
}

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

function toDateOnlyDate(value: Date | string | null): Date {
  if (value instanceof Date) return value
  const parsed = value ? new Date(value) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function toTopTransactionStackId(input: {
  id: string | null
  accountId: string | null
  entryGroupSize: number | null
  bookingDate: Date | string | null
  creditDebitIndicator: string | null
  ntryRef: string | null
  entryAdditionalInfo: string | null
  ntryAcctSvcrRef: string | null
}): string {
  const groupKey = buildNordeaDeterministicGroupKey({
    accountId: input.accountId ?? '',
    bookingDate: toDateOnlyDate(input.bookingDate),
    creditDebitIndicator: input.creditDebitIndicator ?? null,
    entryGroupSize: input.entryGroupSize ?? 0,
    ntryRef: input.ntryRef ?? null,
    entryAdditionalInfo: input.entryAdditionalInfo ?? null,
    ntryAcctSvcrRef: input.ntryAcctSvcrRef ?? null,
  })

  if (groupKey) return `group:${groupKey}`
  return `single:${String(input.id ?? '')}`
}

function toStatementEntryKey(statementId: string | null, entryIndex: number | null): string | null {
  const normalizedStatementId = String(statementId ?? '').trim()
  if (!normalizedStatementId) return null

  const normalizedEntryIndex = Number(entryIndex)
  if (!Number.isInteger(normalizedEntryIndex) || normalizedEntryIndex < 1) return null

  return `${normalizedStatementId}:${normalizedEntryIndex}`
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
  const endDateExclusive = new Date(endDate)
  endDateExclusive.setDate(endDateExclusive.getDate() + 1)

  const start = formatDate(startDate)
  const end = formatDate(endDate)

  const dateKeys = buildDateRange(startDate, endDate)

  const txAccountFilter = accountIds.length ? inArray(transaction.accountId, accountIds) : null
  const runAccountExists = accountIds.length
    ? sql`exists (select 1 from "transaction" t where t.run_id = ${run.id} and t.account in ${accountInSql(accountIds)})`
    : null

  const [seriesRows, openRowsForTopTx, ruleRows, runFailureRows, errorRows, latestRuns] = await Promise.all([
    db
      .select({
        date: transaction.bookingDate,
        totalTransactions: sql<number>`count(*)::int`,
        matchedTransactions: sql<number>`count(*) filter (where ${transactionProcessing.ruleApplied} is not null)::int`,
        autoBookedTransactions: sql<number>`count(*) filter (where ${transactionProcessing.status} = 'bogført' and ${transactionProcessing.ruleApplied} is not null)::int`,
      })
      .from(transaction)
      .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
      .where(and(
        gte(transaction.bookingDate, startDate),
        lte(transaction.bookingDate, endDate),
        ...(txAccountFilter ? [txAccountFilter] : []),
      ))
      .groupBy(transaction.bookingDate)
      .orderBy(asc(transaction.bookingDate)),

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

    db
      .select({
        failedRuns: sql<number>`count(*)::int`,
      })
      .from(run)
      .where(and(
        eq(run.status, 'fejl'),
        gte(run.bookingDate, startDate),
        lte(run.bookingDate, endDate),
        ...(runAccountExists ? [runAccountExists] : []),
      )),

    db
      .select({
        errorCount: sql<number>`count(*)::int`,
      })
      .from(errorLog)
      .where(and(
        gte(errorLog.createdAt, startDate),
        sql`${errorLog.createdAt} < ${endDateExclusive}`,
        ...(accountIds.length
          ? [sql`${errorLog.runId} in (select distinct t.run_id from "transaction" t where t.account in ${accountInSql(accountIds)})`]
          : []),
      )),

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

  const runIds = latestRuns.map((entry) => entry.id)
  const [txCounts, errorCounts] = runIds.length
    ? await Promise.all([
        db
          .select({
            runId: transaction.runId,
            transactionsCount: sql<number>`count(*)::int`,
          })
          .from(transaction)
          .where(and(
            inArray(transaction.runId, runIds),
            ...(txAccountFilter ? [txAccountFilter] : []),
          ))
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

  const openTopStackIds = new Set<string>()
  const entryGroupSizeByEntryKey = new Map<string, number>()
  for (const row of openRowsForTopTx) {
    const entryKey = toStatementEntryKey(row.statementId, row.entryIndex)
    if (!entryKey) continue
    entryGroupSizeByEntryKey.set(entryKey, (entryGroupSizeByEntryKey.get(entryKey) ?? 0) + 1)
  }

  for (const row of openRowsForTopTx) {
    const entryKey = toStatementEntryKey(row.statementId, row.entryIndex)
    const entryGroupSize = entryKey ? (entryGroupSizeByEntryKey.get(entryKey) ?? 0) : 0
    const stackId = toTopTransactionStackId({
      id: row.id,
      accountId: row.accountId,
      entryGroupSize,
      bookingDate: row.bookingDate,
      creditDebitIndicator: row.creditDebitIndicator,
      ntryRef: row.ntryRef,
      entryAdditionalInfo: row.entryAdditionalInfo,
      ntryAcctSvcrRef: row.ntryAcctSvcrRef,
    })

    openTopStackIds.add(stackId)
  }

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
      openTransactions: openTopStackIds.size,

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
