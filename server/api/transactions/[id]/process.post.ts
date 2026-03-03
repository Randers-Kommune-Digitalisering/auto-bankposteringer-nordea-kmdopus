import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import db from '~/lib/db'
import { account } from '~/lib/db/schema/account'
import { bankingPayload } from '~/lib/db/schema/banking'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'
import env from '~/lib/env'
import { manualBookingPayloadSchema, type CprType } from '#engine/manual-booking/domain/manualBooking'
import type { SimpleAccountReportEntry } from '#engine/banking-ingestion/infrastructure/fetchBankTransactions'
import type { PostingAttachment } from '#engine/posting/domain/posting'
import { buildPostingCommand, executePostingCommand } from '#engine/posting/application/postingCommand'
import {
  extractCprFromTransaction,
  resolvePostingText,
  type PostingTransactionContext,
} from '#engine/matching/domain/postingUtils'

export default defineEventHandler(async (event) => {
  const transactionIdParam = event.context.params?.id;
  if (!transactionIdParam) {
    throw createError({ statusCode: 400, statusMessage: "Mangler transaktions-id" });
  }

  const transactionIdResult = z.string().uuid().safeParse(transactionIdParam);
  if (!transactionIdResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Transaktionen kan ikke behandles (ugyldigt id eller mock-data)",
    });
  }
  const transactionId = transactionIdResult.data;

  const body = manualBookingPayloadSchema.parse(await readBody(event));

  if (body.cprType === "statisk" && !normalizeDigits(body.cprNumber)) {
    throw createError({
      statusCode: 422,
      statusMessage: "CPR-nummer er påkrævet, når CPR-type er statisk",
    });
  }

  const [row] = await db
    .select({
      id: transaction.id,
      runId: transaction.runId,
      bookingDate: transaction.bookingDate,
      amount: transaction.amount,
      accountId: transaction.accountId,
      statusAccount: account.statusAccount,
      payload: bankingPayload.raw,
      processingStatus: transactionProcessing.status,
      processingId: transactionProcessing.transactionId,
    })
    .from(transaction)
    .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
    .leftJoin(account, eq(transaction.accountId, account.id))
    .leftJoin(bankingPayload, eq(transaction.payloadId, bankingPayload.id))
    .where(eq(transaction.id, transactionId))
    .limit(1);

  if (!row || !row.id || !row.runId) {
    throw createError({ statusCode: 404, statusMessage: "Transaktion blev ikke fundet" });
  }

  if (row.processingStatus && row.processingStatus !== "åben") {
    throw createError({ statusCode: 409, statusMessage: "Transaktionen er allerede behandlet" });
  }

  const amount = parseNumeric(row.amount);
  const statusAccount = row.statusAccount ? String(row.statusAccount) : env.ERP_ERROR_ACCOUNT;
  const payload = (row.payload ?? null) as SimpleAccountReportEntry | null;

  const txContext: PostingTransactionContext = {
    transactionId: row.id,
    amount,
    statusAccount,
    payload,
  };

  const postingText = resolvePostingText(normalizeOptionalString(body.text) ?? undefined, txContext);
  const attachments = (body.attachments ?? []).map<PostingAttachment>((attachment) => ({
    name: attachment.name,
    type: attachment.type,
    data: attachment.data,
  }));

  const resolvedCpr = resolveManualCpr(body.cprType, normalizeDigits(body.cprNumber), txContext);

  const command = buildPostingCommand({
    transaction: txContext,
    landingAccount: sanitizeAccount(body.primaryAccount),
    landingSecondary: normalizeOptionalString(body.secondaryAccount) ?? undefined,
    landingTertiary: normalizeOptionalString(body.tertiaryAccount) ?? undefined,
    text: postingText,
    cpr: resolvedCpr,
    attachments: attachments.length ? attachments : undefined,
  });

  const bookingDate = toDate(row.bookingDate);
  const submission = await executePostingCommand(command, {
    runId: row.runId,
    bookingDate,
  });

  if (row.processingId) {
    await db
      .update(transactionProcessing)
      .set({ status: "bogført", ruleApplied: null })
      .where(eq(transactionProcessing.transactionId, row.id));
  } else {
    await db.insert(transactionProcessing).values({
      transactionId: row.id,
      status: "bogført",
      ruleApplied: null,
    });
  }

  return {
    success: true,
    requestId: submission.requestId,
    filename: submission.filename,
    remotePath: submission.remotePath,
    lineCount: submission.lineCount,
  };
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

function normalizeOptionalString(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeDigits(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const digits = value.replace(/\D+/g, "");
  return digits.length ? digits : null;
}

function sanitizeAccount(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw createError({ statusCode: 422, statusMessage: "Primær konto er påkrævet" });
  }
  return trimmed;
}

function resolveManualCpr(
  cprType: CprType,
  cprNumber: string | null,
  tx: PostingTransactionContext,
): string | undefined {
  if (cprType === "statisk") {
    return cprNumber ?? undefined;
  }
  if (cprType === "dynamisk") {
    return extractCprFromTransaction(tx) ?? undefined;
  }
  return undefined;
}

function toDate(value: Date | string | null): Date {
  if (!value) {
    return new Date();
  }
  if (value instanceof Date) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}
