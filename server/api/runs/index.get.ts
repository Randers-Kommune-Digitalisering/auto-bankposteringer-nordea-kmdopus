import { desc, eq, inArray } from "drizzle-orm";
import { setHeader } from "h3";
import db from "~/lib/db";
import { account } from "~/lib/db/schema/account";
import { document } from "~/lib/db/schema/document";
import { erpRequest, erpResponse } from "~/lib/db/schema/erp";
import { errorLog } from "~/lib/db/schema/error";
import { run } from "~/lib/db/schema/run";
import { transaction, transactionProcessing } from "~/lib/db/schema/transaction";
import type {
  DocumentListItem,
  ErpResponseListItem,
  ErrorListItem,
  RunListItem,
  RunListResponse,
  TransactionListItem,
} from "~/types/runs";

const formatDate = (value: Date | string | null): string => {
  if (!value) {
    return new Date().toISOString().slice(0, 10)
  }

  if (typeof value === "string") {
    if (value.length >= 10) return value.slice(0, 10)
    return new Date(value).toISOString().slice(0, 10)
  }

  return value.toISOString().slice(0, 10)
};

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

function inferMimeType(fileExtension: string | null | undefined, filename?: string | null): string | null {
  const ext = (fileExtension ?? filename?.split(".").pop() ?? "").toLowerCase().trim();
  if (!ext) {
    return null;
  }
  if (ext === "pdf") {
    return "application/pdf";
  }
  if (ext === "csv") {
    return "text/csv";
  }
  if (ext === "xml") {
    return "application/xml";
  }
  if (ext === "txt") {
    return "text/plain";
  }
  if (ext === "json") {
    return "application/json";
  }
  return "application/octet-stream";
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

async function fetchRunsFromDb(): Promise<RunListResponse> {
  const runRows = await db
    .select()
    .from(run)
    .orderBy(desc(run.bookingDate))
    .limit(50);

  if (!runRows.length) {
    return [];
  }

  const runIds = runRows.map((row) => row.id);

  const [transactionRows, documentRows, errorRows, erpResponseRows] = await Promise.all([
    db
      .select({
        id: transaction.id,
        runId: transaction.runId,
        accountId: transaction.accountId,
        amount: transaction.amount,
        bookingDate: transaction.bookingDate,
        bankAccountLabel: account.name,
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
      .leftJoin(
        transactionProcessing,
        eq(transactionProcessing.transactionId, transaction.id),
      )
      .leftJoin(account, eq(transaction.accountId, account.id))
      .where(inArray(transaction.runId, runIds)),
    db
      .select({
        id: document.id,
        runId: document.runId,
        type: document.type,
        content: document.content,
        filename: document.filename,
        fileExtension: document.fileExtension,
      })
      .from(document)
      .where(inArray(document.runId, runIds)),
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
      .where(inArray(errorLog.runId, runIds)),
    db
      .select({
        runId: erpRequest.runId,
        id: erpResponse.id,
      })
      .from(erpRequest)
      .innerJoin(erpResponse, eq(erpResponse.requestId, erpRequest.id))
      .where(inArray(erpRequest.runId, runIds)),
  ]);

  const transactionsByRun = new Map<string, TransactionListItem[]>();
  transactionRows.forEach((row) => {
    if (!row.runId) {
      return;
    }
    const list = transactionsByRun.get(row.runId) ?? [];

    const amount = parseNumeric(row.amount);

    list.push({
      id: row.id,
      runId: row.runId,
      accountId: row.accountId,
      amount: row.amount,
      bookingDate: formatDate(row.bookingDate),
      bankAccountLabel: row.bankAccountLabel,
      status: row.status,
      ruleApplied: row.ruleApplied,
      transactionType: resolveTransactionType(row) ?? null,
      counterpart: resolveCounterpart(amount, row),
      references: buildReferences(row),
    });
    transactionsByRun.set(row.runId, list);
  });

  const documentsByRun = new Map<string, DocumentListItem[]>();
  documentRows.forEach((row) => {
    const list = documentsByRun.get(row.runId) ?? [];
    list.push({ ...row, mimeType: inferMimeType(row.fileExtension, row.filename) });
    documentsByRun.set(row.runId, list);
  });

  const errorsByRun = new Map<string, ErrorListItem[]>();
  errorRows.forEach((row) => {
    if (!row.runId) {
      return;
    }
    const list = errorsByRun.get(row.runId) ?? [];
    const normalized: ErrorListItem = {
      ...row,
      message: row.errorString,
    };
    list.push(normalized);
    errorsByRun.set(row.runId, list);
  });

  const erpResponsesByRun = new Map<string, ErpResponseListItem[]>();
  erpResponseRows.forEach((row) => {
    if (!row.runId) {
      return;
    }
    const list = erpResponsesByRun.get(row.runId) ?? [];
    list.push({ id: row.id });
    erpResponsesByRun.set(row.runId, list);
  });

  return runRows.map<RunListItem>((row) => ({
    ...row,
    bookingDate: formatDate(row.bookingDate),
    transactions: transactionsByRun.get(row.id) ?? [],
    documents: documentsByRun.get(row.id) ?? [],
    errors: errorsByRun.get(row.id) ?? [],
    erpResponses: erpResponsesByRun.get(row.id) ?? [],
  }));
}

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "private, max-age=30");

  const databaseRuns: RunListResponse = await fetchRunsFromDb();

  setHeader(event, "X-Data-Source", "db");
  return databaseRuns;
});
