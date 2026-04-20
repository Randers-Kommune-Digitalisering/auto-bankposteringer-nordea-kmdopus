import { and, eq, inArray } from 'drizzle-orm'
import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import db from '~/lib/db'
import { account } from '~/lib/db/schema/account'
import { bankingAgreementAccountDimension } from '~/lib/db/schema/bankingAgreementAccountDimension'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'
import {
  manualBookingDraft,
  manualBookingDraftAttachment,
  manualBookingDraftLine,
  manualBookingDraftLineDimension,
} from '~/lib/db/schema/manualBookingDraft'
import { manualBookingPayloadSchema, type CprType } from '#engine/manual-booking/domain/manualBooking'
import type { PostingAttachment } from '#engine/posting/domain/posting'
import { buildPostingCommand, executePostingCommand } from '#engine/posting/handlers/postingCommand'
import {
  extractCprFromTransaction,
  resolvePostingText,
  type PostingTransactionContext,
} from '#engine/matching/domain/postingUtils'
import {
  getActiveErpSupplier,
  listAccountingDimensionDefinitions,
  normalizeDimensionInput,
} from '~~/server/utils/accountingDimensions'
import { requireRoles } from '~~/server/auth/keycloakAuth'
import { parseAmount } from '#engine/matching/domain/amount'

export default defineEventHandler(async (event) => {
  await requireRoles(event, ['write'])
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
      accountProvider: account.provider,
      accountIban: account.iban,
      debtorName: transaction.debtorName,
      debtorId: transaction.debtorId,
      creditorName: transaction.creditorName,
      creditorId: transaction.creditorId,
      entryAdditionalInfo: transaction.entryAdditionalInfo,
      txAdditionalInfo: transaction.txAdditionalInfo,
      remittanceUstrd: transaction.remittanceUstrd,
      remittanceCreditorReference: transaction.remittanceCreditorReference,
      remittanceAdditional: transaction.remittanceAdditional,
      processingStatus: transactionProcessing.status,
      processingId: transactionProcessing.transactionId,
    })
    .from(transaction)
    .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
    .leftJoin(account, eq(transaction.accountId, account.id))
    .where(eq(transaction.id, transactionId))
    .limit(1);

  if (!row || !row.id || !row.runId) {
    throw createError({ statusCode: 404, statusMessage: "Transaktion blev ikke fundet" });
  }

  if (row.processingStatus && row.processingStatus !== "åben") {
    throw createError({ statusCode: 409, statusMessage: "Transaktionen er allerede behandlet" });
  }

  const amount = parseNumeric(row.amount);
  const provider = row.accountProvider ? String(row.accountProvider) : ''
  const iban = row.accountIban ? String(row.accountIban) : ''

  const dimRows = provider && iban
    ? await db
        .select({ key: bankingAgreementAccountDimension.dimensionKey, value: bankingAgreementAccountDimension.dimensionValue })
        .from(bankingAgreementAccountDimension)
        .where(and(
          eq(bankingAgreementAccountDimension.provider, provider as any),
          eq(bankingAgreementAccountDimension.iban, iban),
          inArray(bankingAgreementAccountDimension.dimensionKey, ['statuskonto', 'artskonto']),
        ))
    : []

  const statuskonto = (() => {
    const preferred = dimRows.find((d) => String(d.key) === 'statuskonto')
    if (preferred?.value) return String(preferred.value)
    const legacy = dimRows.find((d) => String(d.key) === 'artskonto')
    if (legacy?.value) return String(legacy.value)
    return null
  })()

  if (!statuskonto) {
    throw createError({
      statusCode: 409,
      statusMessage: `Mangler statuskonto-kontering for bankkonto (IBAN=${row.accountIban ?? row.accountId})`,
    })
  }

  const txContext: PostingTransactionContext = {
    transactionId: row.id,
    amount,
    statusDimensions: { statuskonto },
    debtorName: row.debtorName,
    debtorId: row.debtorId,
    creditorName: row.creditorName,
    creditorId: row.creditorId,
    entryAdditionalInfo: row.entryAdditionalInfo,
    txAdditionalInfo: row.txAdditionalInfo,
    remittanceUstrd: row.remittanceUstrd,
    remittanceCreditorReference: row.remittanceCreditorReference,
    remittanceAdditional: row.remittanceAdditional,
  };

  const supplier = await getActiveErpSupplier()
  const definitions = await listAccountingDimensionDefinitions(supplier)
  const defaultTextTemplate = normalizeOptionalString(body.text) ?? undefined
  const landingLines = body.lines.map((line) => {
    const normalizedDimensions = normalizeDimensionInput(line.dimensions)
    validateDimensionsAgainstDefinitions(normalizedDimensions, definitions)
    const dimensions = Object.fromEntries(normalizedDimensions.map((d) => [d.key, d.value]))
    return {
      amount: Number(line.amount),
      dimensions,
      text: resolvePostingText(normalizeOptionalString(line.text) ?? defaultTextTemplate, txContext),
    }
  })

  const postingText = resolvePostingText(defaultTextTemplate, txContext);
  const attachments = (body.attachments ?? []).map<PostingAttachment>((attachment) => ({
    name: attachment.name,
    type: attachment.type,
    data: attachment.data,
  }));

  const resolvedCpr = resolveManualCpr(body.cprType, normalizeDigits(body.cprNumber), txContext);

  validateLineAmounts(landingLines, amount)

  const command = buildPostingCommand({
    transaction: txContext,
    landingLines,
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

  await clearManualBookingDraft(row.id)

  return {
    success: true,
    requestId: submission.requestId,
    filename: submission.filename,
    remotePath: submission.remotePath,
    lineCount: submission.lineCount,
  };
});

async function clearManualBookingDraft(transactionId: string) {
  await db.transaction(async (trx) => {
    const lines = await trx
      .select({ id: manualBookingDraftLine.id })
      .from(manualBookingDraftLine)
      .where(eq(manualBookingDraftLine.transactionId, transactionId))

    const lineIds = lines.map((l) => l.id)
    if (lineIds.length) {
      await trx
        .delete(manualBookingDraftLineDimension)
        .where(inArray(manualBookingDraftLineDimension.lineId, lineIds))
    }

    await trx.delete(manualBookingDraftAttachment).where(eq(manualBookingDraftAttachment.transactionId, transactionId))
    await trx.delete(manualBookingDraftLine).where(eq(manualBookingDraftLine.transactionId, transactionId))
    await trx.delete(manualBookingDraft).where(eq(manualBookingDraft.transactionId, transactionId))
  })
}

function parseNumeric(value: unknown): number {
  return parseAmount(value)
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

function validateDimensionsAgainstDefinitions(
  dimensions: Array<{ key: string; value: string }>,
  definitions: Array<{ key: string; required: boolean }>,
) {
  const allowedKeys = new Set(definitions.map((d) => d.key))
  for (const d of dimensions) {
    if (!allowedKeys.has(d.key)) {
      throw createError({
        statusCode: 422,
        statusMessage: `Ukendt konteringsdimension for ERP: ${d.key}`,
      })
    }
  }
  for (const def of definitions) {
    if (def.required && !dimensions.some((d) => d.key === def.key)) {
      throw createError({
        statusCode: 422,
        statusMessage: `Manglende påkrævet konteringsdimension: ${def.key}`,
      })
    }
  }
}

function validateLineAmounts(
  landingLines: Array<{ amount: number; dimensions: Record<string, string> }>,
  transactionAmount: number,
) {
  if (!landingLines.length) {
    throw createError({ statusCode: 422, statusMessage: 'Der skal være mindst én konteringslinje' })
  }

  const amountAbs = Math.abs(transactionAmount)
  const sum = landingLines.reduce((acc, line) => acc + Math.abs(line.amount || 0), 0)
  const rounded = (value: number) => Math.round(value * 100) / 100

  if (rounded(sum) !== rounded(amountAbs)) {
    throw createError({
      statusCode: 422,
      statusMessage: `Beløb på konteringslinjer (${rounded(sum)}) matcher ikke transaktionsbeløb (${rounded(amountAbs)})`,
    })
  }

  for (const [index, line] of landingLines.entries()) {
    if (!Number.isFinite(line.amount) || Math.abs(line.amount) <= 0) {
      throw createError({
        statusCode: 422,
        statusMessage: `Ugyldigt beløb på linje ${index + 1}`,
      })
    }
    if (!Object.keys(line.dimensions).length) {
      throw createError({
        statusCode: 422,
        statusMessage: `Linje ${index + 1} mangler konteringsdimensioner`,
      })
    }
  }
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
