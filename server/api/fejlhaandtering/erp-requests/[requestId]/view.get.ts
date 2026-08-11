import { createError, defineEventHandler } from 'h3'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import db from '~/lib/db'
import { erpRequest, erpRequestLine, erpResponse } from '~/lib/db/schema/erp'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'
import { requireErrorHandlingReadAccess } from '~~/server/auth/requireAppRoles'
import { projectCanonicalTransactionFields } from '~~/server/presenters/transactionCanonicalFields'

type GroupedTransaction = {
  transactionId: string
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
}

type GroupAccumulator = {
  transactionId: string
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
    .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
    .where(eq(erpRequestLine.requestId, requestId))
    .orderBy(asc(erpRequestLine.lineNo))

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
      })
      continue
    }

    existing.lineNos.add(row.lineNo)
  }

  const transactions: GroupedTransaction[] = Array.from(groups.values())
    .map((group) => ({
      transactionId: group.transactionId,
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