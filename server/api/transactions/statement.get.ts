import { and, desc, eq, gte, lte } from "drizzle-orm";
import { defineEventHandler, getQuery, setHeader } from "h3";
import db from "~/lib/db";
import { account } from "~/lib/db/schema/account";
import { transaction, transactionProcessing } from "~/lib/db/schema/transaction";
import type { StatementTransaction } from "~/types/transactions";

function formatDate(value: Date | string | null): string {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    if (value.length >= 10) return value.slice(0, 10);
    return new Date(value).toISOString().slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
}

function parseDateParam(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  if (!value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "private, max-age=30");

  const query = getQuery(event);
  const start = parseDateParam(query.start);
  const end = parseDateParam(query.end);

  const whereClause = start && end
    ? and(gte(transaction.bookingDate, start), lte(transaction.bookingDate, end))
    : undefined;

  const rows = await db
    .select({
      id: transaction.id,
      runId: transaction.runId,
      accountId: transaction.accountId,
      bankAccountName: account.name,

      statementId: transaction.statementId,
      entryIndex: transaction.entryIndex,

      amount: transaction.amount,
      currency: transaction.currency,
      creditDebitIndicator: transaction.creditDebitIndicator,
      status: transaction.status,
      bookingDate: transaction.bookingDate,
      valueDate: transaction.valueDate,

      ntryRef: transaction.ntryRef,
      ntryAcctSvcrRef: transaction.ntryAcctSvcrRef,
      entryAdditionalInfo: transaction.entryAdditionalInfo,

      txAcctSvcrRef: transaction.txAcctSvcrRef,
      refsEndToEndId: transaction.refsEndToEndId,
      refsInstrId: transaction.refsInstrId,
      refsPmtInfId: transaction.refsPmtInfId,
      uetr: transaction.uetr,
      txAdditionalInfo: transaction.txAdditionalInfo,

      bkTxCdDomain: transaction.bkTxCdDomain,
      bkTxCdFamily: transaction.bkTxCdFamily,
      bkTxCdSubFamily: transaction.bkTxCdSubFamily,
      bkTxCdProprietary: transaction.bkTxCdProprietary,

      debtorName: transaction.debtorName,
      debtorId: transaction.debtorId,
      debtorAccountIban: transaction.debtorAccountIban,
      creditorName: transaction.creditorName,
      creditorId: transaction.creditorId,
      creditorAccountIban: transaction.creditorAccountIban,
      ultimateDebtorName: transaction.ultimateDebtorName,
      ultimateCreditorName: transaction.ultimateCreditorName,

      remittanceUstrd: transaction.remittanceUstrd,
      remittanceCreditorReference: transaction.remittanceCreditorReference,
      remittanceAdditional: transaction.remittanceAdditional,

      processingStatus: transactionProcessing.status,
      ruleApplied: transactionProcessing.ruleApplied,
    })
    .from(transaction)
    .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
    .leftJoin(account, eq(transaction.accountId, account.id))
    .where(whereClause)
    .orderBy(desc(transaction.bookingDate))
    .limit(500);

  const payload: StatementTransaction[] = rows.map((row) => ({
    ...row,
    bookingDate: formatDate(row.bookingDate),
    valueDate: row.valueDate ? formatDate(row.valueDate) : null,
  }));

  setHeader(event, "X-Data-Source", "db");
  return payload;
});
