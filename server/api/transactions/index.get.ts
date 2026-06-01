import { desc, eq, isNull, or } from "drizzle-orm";
import { defineEventHandler, setHeader } from "h3";
import db from "~/lib/db";
import { account } from "~/lib/db/schema/account";
import { transaction, transactionProcessing } from "~/lib/db/schema/transaction";
import { presentOpenTransaction } from "../../presenters/openTransactionPresenter";
import type { OpenTransaction, OpenTransactionInput } from "~/types/transactions";
import { parseAmount } from "#engine/matching/domain/amount";
import { buildNordeaDeterministicGroupKey } from "#engine/banking-ingestion/handlers/camt053/nordeaAdditionalEntryInfo";

export default defineEventHandler(async (event) => {
  const rows = await db
    .select({
      id: transaction.id,
      runId: transaction.runId,
      bookingDate: transaction.bookingDate,
      amount: transaction.amount,
      creditDebitIndicator: transaction.creditDebitIndicator,
      accountId: transaction.accountId,
      bankAccountName: account.name,
      status: transactionProcessing.status,
      ruleApplied: transactionProcessing.ruleApplied,
      bkTxCdDomain: transaction.bkTxCdDomain,
      bkTxCdFamily: transaction.bkTxCdFamily,
      bkTxCdSubFamily: transaction.bkTxCdSubFamily,
      bkTxCdProprietary: transaction.bkTxCdProprietary,
      ntryRef: transaction.ntryRef,
      ntryAcctSvcrRef: transaction.ntryAcctSvcrRef,
      txAcctSvcrRef: transaction.txAcctSvcrRef,
      refsEndToEndId: transaction.refsEndToEndId,
      refsInstrId: transaction.refsInstrId,
      refsPmtInfId: transaction.refsPmtInfId,
      uetr: transaction.uetr,
      entryAdditionalInfo: transaction.entryAdditionalInfo,
      txAdditionalInfo: transaction.txAdditionalInfo,
      remittanceUstrd: transaction.remittanceUstrd,
      remittanceCreditorReference: transaction.remittanceCreditorReference,
      remittanceAdditional: transaction.remittanceAdditional,
      debtorName: transaction.debtorName,
      debtorId: transaction.debtorId,
      ultimateDebtorName: transaction.ultimateDebtorName,
      creditorName: transaction.creditorName,
      creditorId: transaction.creditorId,
      ultimateCreditorName: transaction.ultimateCreditorName,
    })
    .from(transaction)
    .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
    .leftJoin(account, eq(transaction.accountId, account.id))
    .where(or(isNull(transactionProcessing.status), eq(transactionProcessing.status, "åben")))
    .orderBy(desc(transaction.bookingDate))
    .limit(200);

  const normalized = rows
    .filter((row) => row.id && row.runId)
    .map((row) => {
      const amountAbs = Math.abs(parseNumeric(row.amount));
      const isOutgoing = String(row.creditDebitIndicator ?? '').toUpperCase() === 'DBIT'
      const amount = isOutgoing ? -amountAbs : amountAbs;

      const bookingDateIso = toIsoDate(row.bookingDate)
      const bookingDate = new Date(bookingDateIso)
      const groupKey = buildNordeaDeterministicGroupKey({
        accountId: row.accountId ?? '',
        bookingDate,
        creditDebitIndicator: row.creditDebitIndicator ?? null,
        entryAdditionalInfo: row.entryAdditionalInfo ?? null,
      })

      const base: OpenTransactionInput = {
        id: row.id!,
        runId: row.runId!,
        groupKey,
        bookingDate: bookingDateIso,
        amount,
        accountId: row.accountId ?? "",
        bankAccountName: row.bankAccountName ?? null,
        status: row.status ?? null,
        ruleApplied: row.ruleApplied ?? null,
        transactionType: resolveTransactionType(row) ?? "Ukendt",
        counterpart: resolveCounterpart(amount, row),
        references: buildReferences(row),
      };
      return base
    });

  const payload = normalized.map<OpenTransaction>((entry) => presentOpenTransaction(entry));

  setHeader(event, "X-Data-Source", "db");
  return payload;
});

function parseNumeric(value: unknown): number {
  return parseAmount(value)
}

function toIsoDate(value: Date | string | null): string {
  if (!value) {
    return new Date().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date(value).toISOString();
}

type TransactionRow = {
  bkTxCdProprietary: string | null;
  bkTxCdDomain: string | null;
  bkTxCdFamily: string | null;
  bkTxCdSubFamily: string | null;
}

function resolveTransactionType(row: TransactionRow): string | null {
  if (row.bkTxCdProprietary && row.bkTxCdProprietary.trim().length) {
    return row.bkTxCdProprietary.trim()
  }

  const parts = [row.bkTxCdDomain, row.bkTxCdFamily, row.bkTxCdSubFamily]
    .map((value) => (value ? value.trim() : ''))
    .filter(Boolean)

  return parts.length ? parts.join('/') : null
}

type TransactionPartyRow = {
  debtorName: string | null;
  debtorId: string | null;
  ultimateDebtorName: string | null;
  creditorName: string | null;
  creditorId: string | null;
  ultimateCreditorName: string | null;
}

function resolveCounterpart(amount: number, row: TransactionPartyRow): string | null {
  const isOutgoing = amount < 0;
  if (isOutgoing) {
    return (
      row.creditorName ??
      row.ultimateCreditorName ??
      row.creditorId ??
      null
    );
  }
  return (
    row.debtorName ??
    row.ultimateDebtorName ??
    row.debtorId ??
    null
  );
}

type TransactionReferenceRow = {
  ntryRef: string | null;
  ntryAcctSvcrRef: string | null;
  txAcctSvcrRef: string | null;
  refsEndToEndId: string | null;
  refsInstrId: string | null;
  refsPmtInfId: string | null;
  uetr: string | null;
  entryAdditionalInfo: string | null;
  txAdditionalInfo: string | null;
  remittanceUstrd: string[] | null;
  remittanceCreditorReference: string | null;
  remittanceAdditional: string[] | null;
}

function buildReferences(row: TransactionReferenceRow): string[] {
  const refs = new Set<string>();
  const maybeAdd = (value?: string | null) => {
    if (value && value.trim().length) {
      refs.add(value.trim());
    }
  };

  maybeAdd(row.ntryRef)
  maybeAdd(row.ntryAcctSvcrRef)
  maybeAdd(row.txAcctSvcrRef)
  maybeAdd(row.refsEndToEndId)
  maybeAdd(row.refsInstrId)
  maybeAdd(row.refsPmtInfId)
  maybeAdd(row.uetr)
  maybeAdd(row.entryAdditionalInfo)
  maybeAdd(row.txAdditionalInfo)
  maybeAdd(row.remittanceCreditorReference)

  if (Array.isArray(row.remittanceUstrd)) {
    row.remittanceUstrd.forEach((value) => maybeAdd(value))
  }
  if (Array.isArray(row.remittanceAdditional)) {
    row.remittanceAdditional.forEach((value) => maybeAdd(value))
  }

  return Array.from(refs);
}
