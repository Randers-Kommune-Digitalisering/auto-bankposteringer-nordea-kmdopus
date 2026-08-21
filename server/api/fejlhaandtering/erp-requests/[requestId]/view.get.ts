import { createError, defineEventHandler } from 'h3'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { account } from '~/lib/db/schema/account'
import { erpRequest, erpRequestLine, erpResponse } from '~/lib/db/schema/erp'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'
import { transactionCodeCatalog } from '~/lib/db/schema/transactionCodeCatalog'
import { requireErrorHandlingReadAccess } from '~~/server/auth/requireAppRoles'
import { buildTransactionSummaryView } from '~~/server/presenters/openTransactionPresenter'
import { projectCanonicalTransactionFields } from '~~/server/presenters/transactionCanonicalFields'
import type { TransactionSummary } from '~/types/transactions'
import { buildTransactionCodeCatalogMap, resolveTransactionType, type TransactionCodeCatalogMap } from '~~/server/presenters/transactionTypePresenter'

type GroupedTransaction = {
  transactionId: string
  bankAccountName: string | null
  lineNos: number[]
  amount: string
  currency: string | null
  bookingDate: string
  creditDebitIndicator: string | null
  status: string | null
  ruleApplied: number | null
  postingText: string
  counterparty: string | null
  reference: string | null
  accountingLines: AccountingLine[]
  summary: TransactionSummary
}

type AccountingLine = {
  lineNo: number
  amount: string | null
  debetOrCredit: string | null
  dimensions: Record<string, string>
  postingText: string | null
  cpr: string | null
}

type GroupAccumulator = {
  transactionId: string
  bankAccountName: string | null
  lineNos: Set<number>
  amount: string
  currency: string | null
  bookingDate: string
  creditDebitIndicator: string | null
  status: string | null
  ruleApplied: number | null
  postingText: string
  counterparty: string | null
  reference: string | null
  accountingLines: AccountingLine[]
  summary: TransactionSummary
}

export default defineEventHandler(async (event) => {
  await requireErrorHandlingReadAccess(event)

  const requestId = z.string().min(1).parse(event.context.params?.requestId)

  const [requestRow] = await db
    .select({
      requestId: erpRequest.id,
      runId: erpRequest.runId,
      responseId: erpResponse.id,
      responseStatusText: erpResponse.statusText,
    })
    .from(erpRequest)
    .leftJoin(erpResponse, eq(erpResponse.requestId, erpRequest.id))
    .where(eq(erpRequest.id, requestId))
    .limit(1)

  if (!requestRow?.requestId) {
    throw createError({ statusCode: 404, statusMessage: 'ERP request blev ikke fundet' })
  }

  const rows = await db
    .select({
      lineNo: erpRequestLine.lineNo,
      transactionId: erpRequestLine.transactionId,
      accountingAmount: erpRequestLine.amount,
      accountingDebetOrCredit: erpRequestLine.debetOrCredit,
      accountingDimensions: erpRequestLine.dimensions,
      accountingPostingText: erpRequestLine.postingText,
      accountingCpr: erpRequestLine.cpr,
      bankAccountName: account.name,
      provider: account.provider,
      amount: transaction.amount,
      currency: transaction.currency,
      bookingDate: transaction.bookingDate,
      creditDebitIndicator: transaction.creditDebitIndicator,
      processingStatus: transactionProcessing.status,
      ruleApplied: transactionProcessing.ruleApplied,
      debtorName: transaction.debtorName,
      debtorId: transaction.debtorId,
      creditorName: transaction.creditorName,
      creditorId: transaction.creditorId,
      entryAdditionalInfo: transaction.entryAdditionalInfo,
      txAdditionalInfo: transaction.txAdditionalInfo,
      bkTxCdDomain: transaction.bkTxCdDomain,
      bkTxCdFamily: transaction.bkTxCdFamily,
      bkTxCdSubFamily: transaction.bkTxCdSubFamily,
      bkTxCdProprietary: transaction.bkTxCdProprietary,
      remittanceUstrd: transaction.remittanceUstrd,
      remittanceCreditorReference: transaction.remittanceCreditorReference,
      remittanceAdditional: transaction.remittanceAdditional,
      txAcctSvcrRef: transaction.txAcctSvcrRef,
      refsEndToEndId: transaction.refsEndToEndId,
      refsInstrId: transaction.refsInstrId,
      refsPmtInfId: transaction.refsPmtInfId,
      uetr: transaction.uetr,
      ntryAcctSvcrRef: transaction.ntryAcctSvcrRef,
      ntryRef: transaction.ntryRef,
    })
    .from(erpRequestLine)
    .leftJoin(transaction, eq(transaction.id, erpRequestLine.transactionId))
    .leftJoin(account, eq(account.id, transaction.accountId))
    .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
    .where(eq(erpRequestLine.requestId, requestId))
    .orderBy(asc(erpRequestLine.lineNo))

  const providers = Array.from(new Set(
    rows
      .map((row) => row.provider?.trim().toLowerCase())
      .filter((value): value is string => Boolean(value)),
  ))
  const catalogRows = providers.length
    ? await db
        .select({
          provider: transactionCodeCatalog.provider,
          codeKey: transactionCodeCatalog.codeKey,
          displayName: transactionCodeCatalog.displayName,
        })
        .from(transactionCodeCatalog)
        .where(and(
          inArray(transactionCodeCatalog.provider, providers as any),
          eq(transactionCodeCatalog.isActive, true),
        ))
    : []
  const catalogByProviderCodeKey: TransactionCodeCatalogMap = buildTransactionCodeCatalogMap(catalogRows)

  const groups = new Map<string, GroupAccumulator>()
  const currencies = new Set<string>()
  const bookingDates = new Set<string>()
  let unmappedLineCount = 0

  for (const row of rows) {
    if (!row.transactionId) {
      unmappedLineCount += 1
      continue
    }

    const transactionId = String(row.transactionId)
    const signedAmount = toSignedAmount(row.amount, row.creditDebitIndicator)
    const bookingDate = toIsoDate(row.bookingDate)
    const transactionType = resolveTransactionType({
      provider: row.provider,
      bkTxCdProprietary: row.bkTxCdProprietary,
      bkTxCdDomain: row.bkTxCdDomain,
      bkTxCdFamily: row.bkTxCdFamily,
      bkTxCdSubFamily: row.bkTxCdSubFamily,
      catalogByProviderCodeKey,
    })
    const accountingLine: AccountingLine = {
      lineNo: row.lineNo,
      amount: row.accountingAmount == null ? null : String(row.accountingAmount),
      debetOrCredit: row.accountingDebetOrCredit ?? null,
      dimensions: normalizeDimensions(row.accountingDimensions),
      postingText: row.accountingPostingText ?? null,
      cpr: row.accountingCpr ?? null,
    }
    const canonicalFields = projectCanonicalTransactionFields({
      id: transactionId,
      runId: String(requestRow.runId),
      bookingDate: bookingDate || '1970-01-01',
      amount: signedAmount,
      creditDebitIndicator: row.creditDebitIndicator,
      debtorName: row.debtorName,
      debtorId: row.debtorId,
      creditorName: row.creditorName,
      creditorId: row.creditorId,
      remittanceUstrd: row.remittanceUstrd,
      remittanceAdditional: row.remittanceAdditional,
      remittanceCreditorReference: row.remittanceCreditorReference,
      entryAdditionalInfo: row.entryAdditionalInfo,
      txAdditionalInfo: row.txAdditionalInfo,
      refsEndToEndId: row.refsEndToEndId,
      refsInstrId: row.refsInstrId,
      refsPmtInfId: row.refsPmtInfId,
      uetr: row.uetr,
      txAcctSvcrRef: row.txAcctSvcrRef,
      ntryAcctSvcrRef: row.ntryAcctSvcrRef,
      ntryRef: row.ntryRef,
    })

    const existing = groups.get(transactionId)
    if (!existing) {
      if (row.currency) currencies.add(String(row.currency))
      if (bookingDate) bookingDates.add(bookingDate)

      groups.set(transactionId, {
        transactionId,
        bankAccountName: row.bankAccountName ?? null,
        lineNos: new Set([row.lineNo]),
        amount: String(row.amount),
        currency: row.currency,
        bookingDate,
        creditDebitIndicator: row.creditDebitIndicator ?? null,
        status: row.processingStatus ?? null,
        ruleApplied: row.ruleApplied ?? null,
        postingText: canonicalFields.postingText,
        counterparty: canonicalFields.counterpart,
        reference: canonicalFields.preferredReference,
        accountingLines: [accountingLine],
        summary: buildTransactionSummaryView({
          id: transactionId,
          runId: String(requestRow.runId),
          bookingDate: bookingDate || '1970-01-01',
          amount: signedAmount,
          transactionType: transactionType.value,
          transactionTypeCode: transactionType.code,
          transactionTypeHint: transactionType.hint,
          counterpart: canonicalFields.counterpart,
          counterpartHint: canonicalFields.counterpartHint,
          references: canonicalFields.references,
          referenceDetails: canonicalFields.referenceDetails,
        }),
      })
      continue
    }

    existing.lineNos.add(row.lineNo)
    existing.accountingLines.push(accountingLine)
  }

  const transactions: GroupedTransaction[] = Array.from(groups.values())
    .map((group) => ({
      transactionId: group.transactionId,
      bankAccountName: group.bankAccountName,
      lineNos: Array.from(group.lineNos).sort((a, b) => a - b),
      amount: group.amount,
      currency: group.currency,
      bookingDate: group.bookingDate,
      creditDebitIndicator: group.creditDebitIndicator,
      status: group.status,
      ruleApplied: group.ruleApplied,
      postingText: group.postingText,
      counterparty: group.counterparty,
      reference: group.reference,
      accountingLines: group.accountingLines,
      summary: group.summary,
    }))
    .sort((a, b) => {
      const byDate = a.bookingDate.localeCompare(b.bookingDate)
      if (byDate !== 0) return byDate
      return a.transactionId.localeCompare(b.transactionId)
    })

  const totalAmount = transactions.reduce((sum, tx) => sum + parseAmount(tx.amount), 0)

  return {
    requestId: String(requestRow.requestId),
    runId: String(requestRow.runId),
    response: requestRow.responseId
      ? {
          id: String(requestRow.responseId),
          statusText: requestRow.responseStatusText ?? null,
        }
      : null,
    header: {
      bookingDate: bookingDates.size === 1 ? Array.from(bookingDates)[0] : null,
      currencies: Array.from(currencies).sort(),
      lineCount: rows.length,
      transactionCount: transactions.length,
      unmappedLineCount,
      totalAmount: totalAmount.toFixed(2),
    },
    transactions,
  }
})

function parseAmount(value: unknown): number {
  const normalized = typeof value === 'number' ? String(value) : String(value ?? '').trim()
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function toSignedAmount(amount: unknown, indicator: string | null): number {
  const absolute = Math.abs(parseAmount(amount))
  if (indicator === 'DBIT') return -absolute
  if (indicator === 'CRDT') return absolute
  return parseAmount(amount)
}

function toIsoDate(input: Date | string | null): string {
  if (!input) return ''

  if (typeof input === 'string') {
    return input
  }

  const year = input.getFullYear()
  const month = String(input.getMonth() + 1).padStart(2, '0')
  const day = String(input.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDimensions(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, entry]) => key.trim().length > 0 && typeof entry === 'string' && entry.trim().length > 0)
      .map(([key, entry]) => [key.trim(), entry.trim()]),
  )
}