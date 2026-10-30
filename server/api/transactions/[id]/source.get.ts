import { eq } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import { z } from 'zod'
import db from '~/lib/db'
import { bankingDocument, bankingStatement } from '~/lib/db/schema/statement'
import { transaction } from '~/lib/db/schema/transaction'
import { requireAnyAppRole } from '~~/server/auth/requireAppRoles'
import { buildCamt053SourceTree } from '~~/server/utils/banking/camt053SourceTree'

const statementReadRoles = ['bookkeeper', 'admin', 'rule_admin', 'dev'] as const

function dateOnly(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null
}

export default defineEventHandler(async (event) => {
  await requireAnyAppRole(event, statementReadRoles)

  const parsedId = z.string().uuid().safeParse(event.context.params?.id)
  if (!parsedId.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldigt transaktions-id' })
  }

  const [source] = await db
    .select({
      statementId: bankingStatement.statementId,
      entryIndex: transaction.entryIndex,
      underlyingTransactionCount: transaction.underlyingTransactionCount,
      format: bankingDocument.format,
      amount: transaction.amount,
      currency: transaction.currency,
      creditDebitIndicator: transaction.creditDebitIndicator,
      status: transaction.status,
      bookingDate: transaction.bookingDate,
      valueDate: transaction.valueDate,
      ntryRef: transaction.ntryRef,
      ntryAcctSvcrRef: transaction.ntryAcctSvcrRef,
      entryAdditionalInfo: transaction.entryAdditionalInfo,
      bkTxCdDomain: transaction.bkTxCdDomain,
      bkTxCdFamily: transaction.bkTxCdFamily,
      bkTxCdSubFamily: transaction.bkTxCdSubFamily,
      bkTxCdProprietary: transaction.bkTxCdProprietary,
    })
    .from(transaction)
    .innerJoin(bankingStatement, eq(transaction.statementId, bankingStatement.id))
    .innerJoin(bankingDocument, eq(bankingStatement.documentId, bankingDocument.id))
    .where(eq(transaction.id, parsedId.data))
    .limit(1)

  if (!source || source.format !== 'camt053') {
    throw createError({ statusCode: 404, statusMessage: 'Kildedokument blev ikke fundet' })
  }

  const tree = buildCamt053SourceTree({
    statementId: source.statementId,
    entryIndex: source.entryIndex,
    underlyingTransactionCount: source.underlyingTransactionCount,
    amount: source.amount,
    currency: source.currency,
    creditDebitIndicator: source.creditDebitIndicator,
    status: source.status,
    bookingDate: dateOnly(source.bookingDate),
    valueDate: dateOnly(source.valueDate),
    ntryRef: source.ntryRef,
    ntryAcctSvcrRef: source.ntryAcctSvcrRef,
    entryAdditionalInfo: source.entryAdditionalInfo,
    bkTxCdDomain: source.bkTxCdDomain,
    bkTxCdFamily: source.bkTxCdFamily,
    bkTxCdSubFamily: source.bkTxCdSubFamily,
    bkTxCdProprietary: source.bkTxCdProprietary,
  })

  if (!tree) {
    throw createError({ statusCode: 404, statusMessage: 'Transaktionen blev ikke fundet i kilden' })
  }

  return {
    statementId: source.statementId,
    entryIndex: source.entryIndex,
    underlyingTransactionCount: source.underlyingTransactionCount,
    tree,
  }
})
