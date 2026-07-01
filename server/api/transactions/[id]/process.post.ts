import { and, eq, inArray, isNull } from 'drizzle-orm'
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
import { requireWriteAccess } from '~~/server/auth/requireAppRoles'
import { parseAmount } from '#engine/matching/domain/amount'
import { buildNordeaDeterministicGroupKey } from '#engine/banking-ingestion/handlers/camt053/nordeaAdditionalEntryInfo'

export default defineEventHandler(async (event) => {
  await requireWriteAccess(event)

  const txId = event.context.params?.id;

  const parsedBody = manualBookingPayloadSchema.parse(await readBody(event));

  if (!txId) {
    throw createError({ statusCode: 400, statusMessage: "Mangler transaktions-id" });
  }

  const parsedTxId = z.uuid().safeParse(txId);
  if (!parsedTxId.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Transaktionen kan ikke behandles (ugyldigt id eller mock-data)",
    });
  }
  const transactionId = parsedTxId.data;

  if (parsedBody.cprType === "statisk" && !normalizeDigits(parsedBody.cprNumber)) {
    throw createError({
      statusCode: 422,
      statusMessage: "CPR-nummer er påkrævet, når CPR-type er statisk",
    });
  }
  
  // Get transaction and include state
  const [row] = await db
    .select({
      id: transaction.id,
      runId: transaction.runId,
      statementId: transaction.statementId,
      entryIndex: transaction.entryIndex,
      bookingDate: transaction.bookingDate,
      ntryRef: transaction.ntryRef,
      creditDebitIndicator: transaction.creditDebitIndicator,
      ntryAcctSvcrRef: transaction.ntryAcctSvcrRef,
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

  const bookingDate = toDate(row.bookingDate)

  const creditDebitCondition = row.creditDebitIndicator == null
    ? isNull(transaction.creditDebitIndicator)
    : eq(transaction.creditDebitIndicator, row.creditDebitIndicator)

  const groupCandidates = await db
    .select({
      id: transaction.id,
      statementId: transaction.statementId,
      entryIndex: transaction.entryIndex,
      accountId: transaction.accountId,
      bookingDate: transaction.bookingDate,
      creditDebitIndicator: transaction.creditDebitIndicator,
      ntryRef: transaction.ntryRef,
      ntryAcctSvcrRef: transaction.ntryAcctSvcrRef,
      entryAdditionalInfo: transaction.entryAdditionalInfo,
      processingStatus: transactionProcessing.status,
    })
    .from(transaction)
    .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
    .where(and(
      eq(transaction.accountId, row.accountId),
      eq(transaction.bookingDate, bookingDate),
      creditDebitCondition,
    ))

  const entryGroupSizeByEntryKey = new Map<string, number>()
  for (const candidate of groupCandidates) {
    const entryKey = toStatementEntryKey(candidate.statementId, candidate.entryIndex)
    if (!entryKey) continue
    entryGroupSizeByEntryKey.set(entryKey, (entryGroupSizeByEntryKey.get(entryKey) ?? 0) + 1)
  }

  const rowGroupKey = buildNordeaDeterministicGroupKey({
    accountId: row.accountId,
    bookingDate,
    creditDebitIndicator: row.creditDebitIndicator ?? null,
    entryGroupSize: entryGroupSizeByEntryKey.get(toStatementEntryKey(row.statementId, row.entryIndex) ?? '') ?? 0,
    ntryRef: row.ntryRef ?? null,
    entryAdditionalInfo: row.entryAdditionalInfo ?? null,
    ntryAcctSvcrRef: row.ntryAcctSvcrRef ?? null,
  })

  if (rowGroupKey) {
    const openMembers = groupCandidates.filter(
      (candidate) => !candidate.processingStatus || candidate.processingStatus === 'åben',
    )
    const groupedOpenCount = openMembers.filter((candidate) => {
      const candidateKey = buildNordeaDeterministicGroupKey({
        accountId: candidate.accountId,
        bookingDate: toDate(candidate.bookingDate),
        creditDebitIndicator: candidate.creditDebitIndicator ?? null,
        entryGroupSize: entryGroupSizeByEntryKey.get(toStatementEntryKey(candidate.statementId, candidate.entryIndex) ?? '') ?? 0,
        ntryRef: candidate.ntryRef ?? null,
        entryAdditionalInfo: candidate.entryAdditionalInfo ?? null,
        ntryAcctSvcrRef: candidate.ntryAcctSvcrRef ?? null,
      })
      return candidateKey === rowGroupKey
    }).length

    if (groupedOpenCount > 1) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Individuel behandling af linjer i samlepost er slået fra',
      })
    }
  }

  const amount = parseAmount(row.amount);
  const provider = row.accountProvider ? String(row.accountProvider) : ''
  const iban = row.accountIban ? String(row.accountIban) : ''

  const dimRows = provider && iban
    ? await db
        .select({ key: bankingAgreementAccountDimension.dimensionKey, value: bankingAgreementAccountDimension.dimensionValue })
        .from(bankingAgreementAccountDimension)
        .where(and(
          eq(bankingAgreementAccountDimension.provider, provider as any),
          eq(bankingAgreementAccountDimension.iban, iban),
          inArray(bankingAgreementAccountDimension.dimensionKey, ['artskonto', 'statuskonto']),
        ))
    : []

  const statuskonto = (() => {
    const preferred = dimRows.find((d) => String(d.key) === 'statuskonto')
    if (preferred?.value) return String(preferred.value)
    return null
  })()

  if (!statuskonto) {
    throw createError({
      statusCode: 409,
      statusMessage: `Mangler statuskonto for bankkonto (IBAN=${row.accountIban ?? row.accountId})`,
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

  const accDimDefinitions = await listAccountingDimensionDefinitions(
    await getActiveErpSupplier()
  )

  const defaultTextTemplate = normalizeOptionalString(parsedBody.text) ?? undefined

  const landingLines = parsedBody.lines.map((line) => {
    const normalizedDimensions = normalizeDimensionInput(line.dimensions)

    validateDimensionsAgainstDefinitions(normalizedDimensions, accDimDefinitions)
    const dimensions = Object.fromEntries(normalizedDimensions.map((d) => [d.key, d.value]))

    return {
      amount: Number(line.amount),
      dimensions,
      text: resolvePostingText(normalizeOptionalString(line.text) ?? defaultTextTemplate, txContext),
    }
  })

  const attachments = (parsedBody.attachments ?? []).map<PostingAttachment>((attachment) => ({
    name: attachment.name,
    type: attachment.type,
    data: attachment.data,
  }));

  validateLineAmounts(landingLines, amount)

  const command = buildPostingCommand({
    transaction: txContext,
    landingLines,
    text: resolvePostingText(defaultTextTemplate, txContext),
    cpr: resolveManualCpr(parsedBody.cprType, normalizeDigits(parsedBody.cprNumber), txContext),
    attachments: attachments.length ? attachments : undefined,
  });

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
  await db.transaction(async (tx) => {
    const lines = await tx
      .select({ id: manualBookingDraftLine.id })
      .from(manualBookingDraftLine)
      .where(eq(manualBookingDraftLine.transactionId, transactionId))

    const lineIds = lines.map((l) => l.id)
    if (lineIds.length) {
      await tx
        .delete(manualBookingDraftLineDimension)
        .where(inArray(manualBookingDraftLineDimension.lineId, lineIds))
    }

    await tx.delete(manualBookingDraftAttachment).where(eq(manualBookingDraftAttachment.transactionId, transactionId))
    await tx.delete(manualBookingDraftLine).where(eq(manualBookingDraftLine.transactionId, transactionId))
    await tx.delete(manualBookingDraft).where(eq(manualBookingDraft.transactionId, transactionId))
  })
}

/*
----------------
Helper functions
----------------
*/ 

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
  accDimDefinitions: Array<{ key: string; required: boolean }>,
) {
  const allowedKeys = new Set(accDimDefinitions.map((d) => d.key))
  for (const d of dimensions) {
    if (!allowedKeys.has(d.key)) {
      throw createError({
        statusCode: 422,
        statusMessage: `Ukendt konteringsdimension for ERP: ${d.key}`,
      })
    }
  }
  for (const def of accDimDefinitions) {
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

function toStatementEntryKey(statementId: string | null, entryIndex: number | null): string | null {
  const normalizedStatementId = String(statementId ?? '').trim()

function toStatementEntryKey(statementId: string | null, entryIndex: number | null): string | null {
  const normalizedStatementId = String(statementId ?? '').trim()
  if (!normalizedStatementId) return null

  const normalizedEntryIndex = Number(entryIndex)
  if (!Number.isInteger(normalizedEntryIndex) || normalizedEntryIndex < 1) return null

  return `${normalizedStatementId}:${normalizedEntryIndex}`
}
  if (!normalizedStatementId) return null

  const normalizedEntryIndex = Number(entryIndex)
  if (!Number.isInteger(normalizedEntryIndex) || normalizedEntryIndex < 1) return null

  return `${normalizedStatementId}:${normalizedEntryIndex}`
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
