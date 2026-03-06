import { desc, eq, isNull, or } from "drizzle-orm";
import { defineEventHandler, setHeader } from "h3";
import db from "~/lib/db";
import { account } from "~/lib/db/schema/account";
import { transaction, transactionProcessing } from "~/lib/db/schema/transaction";
import { presentOpenTransaction } from "../../presenters/openTransactionPresenter";
import type { OpenTransaction, OpenTransactionInput } from "~/types/transactions";

const mockTransactionSources: OpenTransactionInput[] = [
  {
    id: "0000954427",
    runId: "mock-run-1",
    bookingDate: new Date("2025-09-15").toISOString(),
    amount: -4588.42,
    accountId: "DK20005908764988-DKK",
    bankAccountName: "Hovedkonto",
    status: "åben",
    ruleApplied: 13,
    transactionType: "CAP",
    counterpart: null,
    references: ["NKS-KY"],
  },
  {
    id: "0000954425",
    runId: "mock-run-1",
    bookingDate: new Date("2025-09-15").toISOString(),
    amount: 5038.75,
    accountId: "DK20009042714507-DKK",
    bankAccountName: "Kreditorkonto",
    status: "åben",
    ruleApplied: null,
    transactionType: "BGS",
    counterpart: "PARKMAN OY",
    references: ["Parkman 08/2025", "Kundennr: 10000322"],
  },
  {
    id: "0000954419",
    runId: "mock-run-1",
    bookingDate: new Date("2025-09-15").toISOString(),
    amount: 315.0,
    accountId: "DK20005908764988-DKK",
    bankAccountName: "Hovedkonto",
    status: "åben",
    ruleApplied: null,
    transactionType: "DANKORT-SALG",
    counterpart: null,
    references: ["Dankort-salg 12.09 6899625 242050"],
  },
];

const mockTransactions: OpenTransaction[] = mockTransactionSources.map((entry) => presentOpenTransaction(entry));

export default defineEventHandler(async (event) => {
  let payload: OpenTransaction[] = [];

  try {
    const rows = await db
      .select({
        id: transaction.id,
        runId: transaction.runId,
        bookingDate: transaction.bookingDate,
        amount: transaction.amount,
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

    payload = rows
      .filter((row) => row.id && row.runId)
      .map<OpenTransaction>((row) => {
        const amount = parseNumeric(row.amount);

        const base: OpenTransactionInput = {
          id: row.id!,
          runId: row.runId!,
          bookingDate: toIsoDate(row.bookingDate),
          amount,
          accountId: row.accountId ?? "",
          bankAccountName: row.bankAccountName ?? null,
          status: row.status ?? null,
          ruleApplied: row.ruleApplied ?? null,
          transactionType: resolveTransactionType(row) ?? "Ukendt",
          counterpart: resolveCounterpart(amount, row),
          references: buildReferences(row),
        };

        return presentOpenTransaction(base);
      });
  } catch (error) {
    console.warn("[transactions.get] Falling back to mock data", error);
  }

  if (!payload.length) {
    setHeader(event, "X-Data-Source", "mock");
    return mockTransactions;
  }

  setHeader(event, "X-Data-Source", "db");
  return payload;
});

function parseNumeric(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.replace(/\./g, "").replace(/,/g, ".").trim();
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
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
