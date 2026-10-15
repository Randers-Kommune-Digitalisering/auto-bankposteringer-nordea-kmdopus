// This endpoint is used in interactive UI where the user can handle errors

import { desc, eq, inArray, sql } from "drizzle-orm";
import { setHeader } from "h3";
import db from "~/lib/db";
import { createUtcDateString } from "~~/utils/function";
import { account } from "~/lib/db/schema/account";
import { erpDocument, erpRequest, erpResponse, erpResponseDocument } from "~/lib/db/schema/erp";
import { errorLog } from "~/lib/db/schema/error";
import { job } from "~/lib/db/schema/job";
import { outbox } from "~/lib/db/schema/outbox";
import { run } from "~/lib/db/schema/run";
import { transaction, transactionProcessing } from "~/lib/db/schema/transaction";
import type { RunStatus } from "~/lib/db/schema/enums";
import type {
  ErpDocumentListItem,
  ErrorListItem,
  RunListItem,
  RunListResponse,
  TransactionListItem,
} from "~/types/runs";
import { parseAmount } from "#engine/matching/domain/amount";
import { resolveEffectiveRunStatus } from "~~/server/utils/runs/runStatus";
import { collectCurrentRunIssues, resolveCurrentErpDocumentRejections } from "~~/server/utils/runs/currentRunIssues";

function parseNumeric(value: unknown): number {
  return parseAmount(value)
}

type TransactionTypeRow = {
  bkTxCdProprietary: string | null;
  bkTxCdDomain: string | null;
  bkTxCdFamily: string | null;
  bkTxCdSubFamily: string | null;
}

function resolveTransactionType(row: TransactionTypeRow): string | null {
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
      row.debtorName ??
      row.ultimateDebtorName ??
      row.debtorId ??
      null
    );
  }
  return (
    row.debtorName ??
    row.ultimateDebtorName ??
    row.debtorId ??
    row.creditorName ??
    row.ultimateCreditorName ??
    row.creditorId ??
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

  const [TransactionTypeRows, erpDocumentRows, errorRows, requestRows, responseOutcomeRows, responseStatusRows, jobRows, outboxRows] = await Promise.all([
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
        runId: erpDocument.runId,
        id: erpDocument.id,
      })
      .from(erpDocument)
      .where(inArray(erpDocument.runId, runIds)),
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
        requestId: erpRequest.id,
        sourceRequestId: erpRequest.sourceRequestId,
        documentId: erpRequest.documentId,
      })
      .from(erpRequest)
      .where(inArray(erpRequest.runId, runIds)),
    db
      .select({
        runId: erpRequest.runId,
        requestId: erpRequest.id,
        documentId: erpResponseDocument.documentId,
        status: erpResponseDocument.status,
        messages: erpResponseDocument.messages,
      })
      .from(erpResponseDocument)
      .innerJoin(erpResponse, eq(erpResponse.id, erpResponseDocument.responseId))
      .innerJoin(erpRequest, eq(erpRequest.id, erpResponse.requestId))
      .where(inArray(erpRequest.runId, runIds)),
    db
      .select({
        runId: erpRequest.runId,
        requestId: erpRequest.id,
        statusText: erpResponse.statusText,
      })
      .from(erpRequest)
      .innerJoin(erpResponse, eq(erpResponse.requestId, erpRequest.id))
      .where(inArray(erpRequest.runId, runIds)),
    db
      .select({
        id: job.id,
        runId: job.runId,
        type: job.type,
        status: job.status,
        lastError: job.lastError,
        updatedAt: job.updatedAt,
      })
      .from(job)
      .where(inArray(job.runId, runIds as any))
      .limit(500),
    db
      .select({
        id: outbox.id,
        runId: outbox.runId,
        topic: outbox.topic,
        status: outbox.status,
        lastError: outbox.lastError,
        createdAt: outbox.createdAt,
        requestId: sql<string | null>`${outbox.payload} ->> 'requestId'`,
      })
      .from(outbox)
      .where(inArray(outbox.runId, runIds as any))
      .limit(500),
  ]);

  const transactionsByRun = new Map<string, TransactionListItem[]>();

  TransactionTypeRows.forEach((row) => {
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
      bookingDate: createUtcDateString(row.bookingDate),
      bankAccountLabel: row.bankAccountLabel,
      status: row.status,
      ruleApplied: row.ruleApplied,
      transactionType: resolveTransactionType(row) ?? null,
      counterpart: resolveCounterpart(amount, row),
      references: buildReferences(row),
    });
    transactionsByRun.set(row.runId, list);
  });

  const erpDocumentsByRun = new Map<string, ErpDocumentListItem[]>();
  erpDocumentRows.forEach((row) => {
    const list = erpDocumentsByRun.get(row.runId) ?? [];
    list.push({ documentId: row.id });
    erpDocumentsByRun.set(row.runId, list);
  });

  const currentIssues = collectCurrentRunIssues({
    errorLogs: errorRows,
    jobs: jobRows.map(row => ({ ...row, runId: row.runId ? String(row.runId) : null })),
    outbox: outboxRows.map(row => ({ ...row, runId: row.runId ? String(row.runId) : null })),
    rejectedErpDocuments: resolveCurrentErpDocumentRejections({
      requests: requestRows.map(row => ({
        runId: String(row.runId),
        requestId: String(row.requestId),
        sourceRequestId: row.sourceRequestId ? String(row.sourceRequestId) : null,
        documentId: row.documentId ? String(row.documentId) : null,
      })),
      outbox: outboxRows.map(row => ({
        requestId: row.requestId ? String(row.requestId) : null,
        createdAt: row.createdAt,
        topic: String(row.topic),
      })),
      outcomes: responseOutcomeRows.map(row => ({
        runId: String(row.runId),
        requestId: String(row.requestId),
        documentId: String(row.documentId),
        status: String(row.status),
        messages: row.messages,
      })),
      responseStatuses: responseStatusRows.map(row => ({
        runId: String(row.runId),
        requestId: String(row.requestId),
        statusText: row.statusText ? String(row.statusText) : null,
      })),
    }),
  });
  const errorsByRun = new Map<string, ErrorListItem[]>();
  const hasNegativeErpResponseByRun = new Map<string, boolean>();
  for (const issue of currentIssues) {
    if (!issue.runId) continue;
    const list = errorsByRun.get(issue.runId) ?? [];
    list.push(issue);
    errorsByRun.set(issue.runId, list);
    if (issue.source === 'erp' && issue.id.startsWith('erp-document:')) {
      hasNegativeErpResponseByRun.set(issue.runId, true);
    }
  }

  const hasInFlightByRun = new Map<string, boolean>();
  const hasFailedIoByRun = new Map<string, boolean>();

  for (const row of jobRows ?? []) {
    const runId = row.runId ? String(row.runId) : ''
    if (!runId) continue

    const status = String(row.status ?? '')
    if (status === 'failed') {
      hasFailedIoByRun.set(runId, true)
      continue
    }
    if (status === 'pending' || status === 'in_progress') {
      hasInFlightByRun.set(runId, true)
    }
  }

  for (const row of outboxRows ?? []) {
    const runId = row.runId ? String(row.runId) : ''
    if (!runId) continue

    const status = String(row.status ?? '')
    if (status === 'failed') {
      hasFailedIoByRun.set(runId, true)
      continue
    }
    if (status === 'pending' || status === 'processing') {
      hasInFlightByRun.set(runId, true)
    }
  }

  function resolveRunStatus(runId: string, base: unknown): RunStatus {
    const hasErrors = (errorsByRun.get(runId)?.length ?? 0) > 0
    return resolveEffectiveRunStatus({
      baseStatus: base,
      hasActiveErrors: hasErrors,
      hasNegativeErpResponse: hasNegativeErpResponseByRun.get(runId) ?? false,
      hasFailedIo: hasFailedIoByRun.get(runId) ?? false,
      hasInFlightIo: hasInFlightByRun.get(runId) ?? false,
    })
  }

  return runRows.map<RunListItem>((row) => ({
    ...row,
    bookingDate: createUtcDateString(row.bookingDate),
    status: resolveRunStatus(String(row.id), row.status),
    transactions: transactionsByRun.get(row.id) ?? [],
    errors: errorsByRun.get(row.id) ?? [],
    erpDocuments: erpDocumentsByRun.get(row.id) ?? [],
  }));
}

export default defineEventHandler(async (event) => {
  // This endpoint is used in interactive UI and must reflect new runs immediately.
  // Browser/proxy caching caused the refresh button to still show stale data.
  setHeader(event, "Cache-Control", "no-store");

  const databaseRuns: RunListResponse = await fetchRunsFromDb();

  setHeader(event, "X-Data-Source", "db");
  return databaseRuns;
});
