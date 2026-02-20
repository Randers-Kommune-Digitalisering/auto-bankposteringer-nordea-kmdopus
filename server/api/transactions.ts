import { desc, eq, isNull, or } from "drizzle-orm";
import { defineEventHandler, setHeader } from "h3";
import db from "~/lib/db";
import {
  account,
  bankingPayload,
  transaction,
  transactionProcessing,
} from "~/lib/db/schema";
import { presentOpenTransaction } from "../../services/transactions/openTransactionPresenter";
import type { OpenTransaction, OpenTransactionInput } from "~/types/transactions";
import type { SimpleAccountReportEntry } from "../../services/banking/batchFetchTransactions";

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
        payload: bankingPayload.raw,
      })
      .from(transaction)
      .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
      .leftJoin(account, eq(transaction.accountId, account.id))
      .leftJoin(bankingPayload, eq(transaction.payloadId, bankingPayload.id))
      .where(or(isNull(transactionProcessing.status), eq(transactionProcessing.status, "åben")))
      .orderBy(desc(transaction.bookingDate))
      .limit(200);

    payload = rows
      .filter((row) => row.id && row.runId)
      .map<OpenTransaction>((row) => {
        const amount = parseNumeric(row.amount);
        const rawPayload = (row.payload ?? null) as SimpleAccountReportEntry | null;
        return {
          id: row.id!,
          runId: row.runId!,
          bookingDate: toIsoDate(row.bookingDate),
          amount,
          accountId: row.accountId ?? "",
          bankAccountName: row.bankAccountName ?? null,
          status: row.status ?? null,
          ruleApplied: row.ruleApplied ?? null,
          transactionType: resolveTransactionType(rawPayload) ?? "Ukendt",
          counterpart: resolveCounterpart(amount, rawPayload),
          references: buildReferences(rawPayload),
        };
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

function resolveTransactionType(payload: SimpleAccountReportEntry | null): string | null {
  if (!payload) {
    return null;
  }
  return (
    payload.type ??
    payload.transactionCodes?.type ??
    payload.transactionCodes?.domain ??
    payload.transactionCodes?.Domain ??
    null
  );
}

function resolveCounterpart(amount: number, payload: SimpleAccountReportEntry | null): string | null {
  if (!payload) {
    return null;
  }
  const isOutgoing = amount < 0;
  if (isOutgoing) {
    return (
      payload.creditor?.name ??
      payload.creditorText ??
      payload.creditorMessage ??
      payload.creditor?.id ??
      null
    );
  }
  return (
    payload.debtor?.name ??
    payload.debtorText ??
    payload.debtorMessage ??
    payload.debtor?.id ??
    null
  );
}

function buildReferences(payload: SimpleAccountReportEntry | null): string[] {
  if (!payload) {
    return [];
  }
  const refs = new Set<string>();
  const maybeAdd = (value?: string | null) => {
    if (value && value.trim().length) {
      refs.add(value.trim());
    }
  };

  maybeAdd(payload.primaryReference);

  type TransactionRow = {
    id: string | null;
    runId: string | null;
    bookingDate: Date | string | null;
    amount: unknown;
    accountId: string | null;
    bankAccountName: string | null;
    status: string | null;
    ruleApplied: number | null;
    payload: unknown;
  };

  function mapRowToOpenTransaction(row: TransactionRow): OpenTransaction {
    const amount = parseNumeric(row.amount);
    const rawPayload = (row.payload ?? null) as SimpleAccountReportEntry | null;

    const base: OpenTransactionInput = {
      id: row.id!,
      runId: row.runId!,
      bookingDate: toIsoDate(row.bookingDate),
      amount,
      accountId: row.accountId ?? "",
      bankAccountName: row.bankAccountName ?? null,
      status: (row.status ?? null) as OpenTransactionInput["status"],
      ruleApplied: row.ruleApplied ?? null,
      transactionType: resolveTransactionType(rawPayload) ?? "Ukendt",
      counterpart: resolveCounterpart(amount, rawPayload),
      references: buildReferences(rawPayload),
    };

    return presentOpenTransaction(base);
  }
  maybeAdd(payload.debtorMessage);
  maybeAdd(payload.debtorText);
  maybeAdd(payload.creditorMessage);
  maybeAdd(payload.creditorText);
  maybeAdd(payload.ocrReference);
  maybeAdd(payload.debtorsPaymentId);
  maybeAdd(payload.batch);

  if (Array.isArray(payload.references)) {
    payload.references.forEach((entry) => maybeAdd(String(entry)));
  }

  return Array.from(refs);
}
