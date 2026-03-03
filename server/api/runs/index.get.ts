import { desc, eq, inArray } from "drizzle-orm";
import { setHeader } from "h3";
import db from "~/lib/db";
import { account } from "~/lib/db/schema/account";
import { bankingPayload } from "~/lib/db/schema/banking";
import { document } from "~/lib/db/schema/document";
import { errorLog } from "~/lib/db/schema/error";
import { run } from "~/lib/db/schema/run";
import { transaction, transactionProcessing } from "~/lib/db/schema/transaction";
import type {
  DocumentListItem,
  ErrorListItem,
  RunListItem,
  RunListResponse,
  TransactionListItem,
} from "~/types/runs";
import type { SimpleAccountReportEntry } from "#engine/banking-ingestion/infrastructure/fetchBankTransactions";

const pdfBase64 =
  "JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDIgMCBSPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9Db3VudCAxL0tpZHNbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMjAwIDIwMF0vQ29udGVudHMgNCAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDUgMCBSPj4+Pj4+PgplbmRvYmoKNCAwIG9iago8PC9MZW5ndGggNDQ+PnN0cmVhbQpCVCAvRjEgMTIgVGYgNTAgMTUwIFRkIChNb2NrIFBERikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0hlbHZldGljYT4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYKMDAwMDAwMDA5MCAwMDAwMCBuCjAwMDAwMDAxNTMgMDAwMDAgbgowMDAwMDAwMjQwIDAwMDAwIG4KMDAwMDAwMDM0MCAwMDAwMCBuCjAwMDAwMDA0MjAgMDAwMDAgbgplbmR4cmVmCjQ5MQolJUVPRgo=";

const csvBase64 = "aWQsbmFtZSxhbW91bnQKMSxUZXN0LDEwMAoyLE1vY2ssMjAw";

const runWithDocsId = "d15e44d7-5c0b-4a71-9f8f-4319b8c08d31";
const runWithErrorsId = "b042c8c0-b9aa-4a1f-8db1-98e55e73a5f4";
const latestRunId = "5ae977b5-3cb6-44b5-9ec7-6aa117832254";

const mockRuns: RunListResponse = [
  {
    id: latestRunId,
    bookingDate: "2025-09-16",
    status: "afventer",
    transactions: [],
    documents: [
      {
        id: "doc-latest-1",
        runId: latestRunId,
        type: "afstemning",
        content: csvBase64,
        filename: "afstemning-2025-09-16.csv",
        fileExtension: "csv",
        mimeType: "text/csv",
      },
    ],
    errors: [
      {
        id: "err-latest-1",
        runId: latestRunId,
        source: "application",
        errorCode: 4099,
        errorString: "Bankfil mangler signatur",
        createdAt: new Date('2025-09-16T00:00:00.000Z'),
        message: "Bankfil mangler signatur",
      },
    ],
  },
  {
    id: "4df5c6b3-84c5-48b2-909e-7d44d6a7db91",
    bookingDate: "2025-09-14",
    status: "indlæser",
    transactions: [],
    documents: [
      {
        id: "doc-processing-1",
        runId: "4df5c6b3-84c5-48b2-909e-7d44d6a7db91",
        type: "postering",
        content: pdfBase64,
        filename: "indlaesning-rapport.pdf",
        fileExtension: "pdf",
        mimeType: "application/pdf",
      },
    ],
    errors: [
      {
        id: "err-processing-1",
        runId: "4df5c6b3-84c5-48b2-909e-7d44d6a7db91",
        source: "banking",
        errorCode: 3002,
        errorString: "Afventer svar fra bank",
        createdAt: new Date('2025-09-14T00:00:00.000Z'),
        message: "Afventer svar fra bank",
      },
    ],
  },
  {
    id: runWithDocsId,
    bookingDate: "2025-09-13",
    status: "udført",
    transactions: [
      {
        id: "0000954427",
        runId: runWithDocsId,
        payloadId: null,
        accountId: "DK20005908764988-DKK",
        amount: "-4588.42",
        bookingDate: "2025-09-13",
        bankAccountLabel: "Hovedkonto",
        counterpart: null,
        transactionType: "CAP",
        references: ["NKS-KY"],
        status: "bogført",
        ruleApplied: 13,
      },
      {
        id: "0000954425",
        runId: runWithDocsId,
        payloadId: null,
        accountId: "DK20009042714507-DKK",
        amount: "5038.75",
        bookingDate: "2025-09-13",
        bankAccountLabel: "Kreditorkonto",
        counterpart: "PARKMAN OY",
        transactionType: "BGS",
        references: ["Parkman 08/2025", "Kundennr: 10000322"],
        status: "åben",
        ruleApplied: null,
      },
      {
        id: "0000954419",
        runId: runWithDocsId,
        payloadId: null,
        accountId: "DK20005908764988-DKK",
        amount: "315.00",
        bookingDate: "2025-09-13",
        bankAccountLabel: "Hovedkonto",
        counterpart: null,
        transactionType: "DANKORT-SALG",
        references: ["Dankort-salg 12.09 6899625 242050"],
        status: "åben",
        ruleApplied: null,
      },
    ],
    documents: [
      {
        id: "asda01",
        runId: runWithDocsId,
        type: "postering",
        content: pdfBase64,
        filename: "postering.pdf",
        fileExtension: "pdf",
        mimeType: "application/pdf",
      },
      {
        id: "asda02",
        runId: runWithDocsId,
        type: "postering",
        content: csvBase64,
        filename: "bilag.csv",
        fileExtension: "csv",
        mimeType: "text/csv",
      },
    ],
    errors: [],
  },
  {
    id: runWithErrorsId,
    bookingDate: "2025-09-12",
    status: "fejl",
    transactions: [],
    documents: [
      {
        id: "doc-error-1",
        runId: runWithErrorsId,
        type: "afstemning",
        content: csvBase64,
        filename: "fejl-log-2025-09-12.csv",
        fileExtension: "csv",
        mimeType: "text/csv",
      },
    ],
    errors: [
      {
        id: "err-001",
        runId: runWithErrorsId,
        source: "banking",
        errorCode: 5001,
        errorString: "Fejl ved hentning af transaktioner fra bank",
        createdAt: new Date('2025-09-12T00:00:00.000Z'),
        message: "Fejl ved hentning af transaktioner fra bank",
      },
      {
        id: "err-002",
        runId: runWithErrorsId,
        source: "application",
        errorCode: 5010,
        errorString: "Fejl ved oprettelse af dokumenter",
        createdAt: new Date('2025-09-12T00:00:00.000Z'),
        message: "Fejl ved oprettelse af dokumenter",
      },
    ],
  },
];

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

function resolveTransactionType(payload: SimpleAccountReportEntry | null): string | null {
  if (!payload) {
    return null;
  }
  // Matches the heuristics used in /api/transactions.
  return (
    (payload as any).type ??
    (payload as any).transactionCodes?.type ??
    (payload as any).transactionCodes?.domain ??
    (payload as any).transactionCodes?.Domain ??
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
      (payload as any).creditor?.name ??
      (payload as any).creditorText ??
      (payload as any).creditorMessage ??
      (payload as any).creditor?.id ??
      null
    );
  }
  return (
    (payload as any).debtor?.name ??
    (payload as any).debtorText ??
    (payload as any).debtorMessage ??
    (payload as any).debtor?.id ??
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

  maybeAdd((payload as any).primaryReference);
  maybeAdd((payload as any).debtorMessage);
  maybeAdd((payload as any).debtorText);
  maybeAdd((payload as any).creditorMessage);
  maybeAdd((payload as any).creditorText);
  maybeAdd((payload as any).ocrReference);
  maybeAdd((payload as any).debtorsPaymentId);
  maybeAdd((payload as any).batch);

  if (Array.isArray((payload as any).references)) {
    (payload as any).references.forEach((entry: unknown) => maybeAdd(String(entry)));
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

  const [transactionRows, documentRows, errorRows] = await Promise.all([
    db
      .select({
        id: transaction.id,
        runId: transaction.runId,
        payloadId: transaction.payloadId,
        accountId: transaction.accountId,
        amount: transaction.amount,
        bookingDate: transaction.bookingDate,
        bankAccountLabel: account.name,
        status: transactionProcessing.status,
        ruleApplied: transactionProcessing.ruleApplied,
        payload: bankingPayload.raw,
      })
      .from(transaction)
      .leftJoin(
        transactionProcessing,
        eq(transactionProcessing.transactionId, transaction.id),
      )
      .leftJoin(account, eq(transaction.accountId, account.id))
      .leftJoin(bankingPayload, eq(transaction.payloadId, bankingPayload.id))
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
  ]);

  const transactionsByRun = new Map<string, TransactionListItem[]>();
  transactionRows.forEach((row) => {
    if (!row.runId) {
      return;
    }
    const list = transactionsByRun.get(row.runId) ?? [];

    const amount = parseNumeric(row.amount);
    const rawPayload = (row.payload ?? null) as SimpleAccountReportEntry | null;

    list.push({
      id: row.id,
      runId: row.runId,
      payloadId: row.payloadId,
      accountId: row.accountId,
      amount: row.amount,
      bookingDate: formatDate(row.bookingDate),
      bankAccountLabel: row.bankAccountLabel,
      status: row.status,
      ruleApplied: row.ruleApplied,
      transactionType: resolveTransactionType(rawPayload) ?? null,
      counterpart: resolveCounterpart(amount, rawPayload),
      references: buildReferences(rawPayload),
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

  return runRows.map<RunListItem>((row) => ({
    ...row,
    bookingDate: formatDate(row.bookingDate),
    transactions: transactionsByRun.get(row.id) ?? [],
    documents: documentsByRun.get(row.id) ?? [],
    errors: errorsByRun.get(row.id) ?? [],
  }));
}

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "private, max-age=30");

  let databaseRuns: RunListResponse = [];
  try {
    databaseRuns = await fetchRunsFromDb();
  } catch (error) {
    console.warn("[runs.get] Falling back to mock data", error);
  }

  const payload = databaseRuns.length ? databaseRuns : mockRuns;

  setHeader(event, "X-Data-Source", databaseRuns.length ? "db" : "mock");

  return payload;
});
