import { and, eq, inArray, isNull } from 'drizzle-orm'
import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import db from '~/lib/db'
import { account } from '~/lib/db/schema/account'
import { bankingAgreementAccountDimension } from '~/lib/db/schema/bankingAgreementAccountDimension'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'
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
import { buildNordeaDeterministicGroupKey } from '#engine/banking-ingestion/handlers/camt053/nordeaAdditionalEntryInfo'

const groupProcessSchema = z.object({
  transactionIds: z.array(z.string().uuid()).min(2),
  payload: manualBookingPayloadSchema,
})

export default defineEventHandler(async (event) => {
  await requireRoles(event, ['write'])

  const parsed = groupProcessSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldig payload for samlepost-behandling' })
  }

  const transactionIds = Array.from(new Set(parsed.data.transactionIds))
  const body = parsed.data.payload

  if (body.cprType === 'statisk' && !normalizeDigits(body.cprNumber)) {
    throw createError({
      statusCode: 422,
      statusMessage: 'CPR-nummer er påkrævet, når CPR-type er statisk',
    })
  }

  const rows = await db
    .select({
      id: transaction.id,
      runId: transaction.runId,
      bookingDate: transaction.bookingDate,
      amount: transaction.amount,
      accountId: transaction.accountId,
      accountProvider: account.provider,
      accountIban: account.iban,
      creditDebitIndicator: transaction.creditDebitIndicator,
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
    .where(inArray(transaction.id, transactionIds))

  if (rows.length !== transactionIds.length) {
    throw createError({ statusCode: 404, statusMessage: 'En eller flere transaktioner blev ikke fundet' })
  }

  for (const row of rows) {
    if (row.processingStatus && row.processingStatus !== 'åben') {
      throw createError({ statusCode: 409, statusMessage: 'En eller flere transaktioner er allerede behandlet' })
    }
  }

  const first = rows[0]
  if (!first?.runId) {
    throw createError({ statusCode: 409, statusMessage: 'Mangler run-id for samleposten' })
  }

  const accountId = first.accountId
  const creditDebitIndicator = first.creditDebitIndicator ?? null
  const bookingDate = toDate(first.bookingDate)

  const expectedGroupKey = buildNordeaDeterministicGroupKey({
    accountId,
    bookingDate,
    creditDebitIndicator,
    entryAdditionalInfo: first.entryAdditionalInfo ?? null,
  })

  if (!expectedGroupKey) {
    throw createError({ statusCode: 409, statusMessage: 'Transaktionerne udgør ikke en deterministisk samlepost' })
  }

  for (const row of rows) {
    if (row.accountId !== accountId) {
      throw createError({ statusCode: 409, statusMessage: 'Samlepost kræver samme konto på alle linjer' })
    }

    if ((row.creditDebitIndicator ?? null) !== creditDebitIndicator) {
      throw createError({ statusCode: 409, statusMessage: 'Samlepost kræver samme debet/kredit-retning på alle linjer' })
    }

    const rowGroupKey = buildNordeaDeterministicGroupKey({
      accountId: row.accountId,
      bookingDate: toDate(row.bookingDate),
      creditDebitIndicator: row.creditDebitIndicator ?? null,
      entryAdditionalInfo: row.entryAdditionalInfo ?? null,
    })

    if (rowGroupKey !== expectedGroupKey) {
      throw createError({ statusCode: 409, statusMessage: 'Transaktioner matcher ikke samme samlepost-nøgle' })
    }
  }

  const provider = first.accountProvider ? String(first.accountProvider) : ''
  const iban = first.accountIban ? String(first.accountIban) : ''

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
      statusMessage: `Mangler statuskonto-kontering for bankkonto (IBAN=${first.accountIban ?? first.accountId})`,
    })
  }

  const supplier = await getActiveErpSupplier()
  const definitions = await listAccountingDimensionDefinitions(supplier)
  const defaultTextTemplate = normalizeOptionalString(body.text) ?? undefined

  const lineTotalAmount = rows.reduce((sum, row) => sum + resolveSignedAmount(row.amount, row.creditDebitIndicator), 0)

  const txContext: PostingTransactionContext = {
    transactionId: `SAMLEPOST:${expectedGroupKey}`,
    amount: lineTotalAmount,
    statusDimensions: { statuskonto },
    debtorName: first.debtorName,
    debtorId: first.debtorId,
    creditorName: first.creditorName,
    creditorId: first.creditorId,
    entryAdditionalInfo: rows.map((r) => r.entryAdditionalInfo).filter(Boolean).join(' || ') || null,
    txAdditionalInfo: rows.map((r) => r.txAdditionalInfo).filter(Boolean).join(' || ') || null,
    remittanceUstrd: dedupeStrings(rows.flatMap((r) => r.remittanceUstrd ?? [])),
    remittanceCreditorReference: rows.map((r) => r.remittanceCreditorReference).find(Boolean) ?? null,
    remittanceAdditional: dedupeStrings(rows.flatMap((r) => r.remittanceAdditional ?? [])),
  }

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

  validateLineAmounts(landingLines, lineTotalAmount)

  const postingText = resolvePostingText(defaultTextTemplate, txContext)
  const attachments = (body.attachments ?? []).map<PostingAttachment>((attachment) => ({
    name: attachment.name,
    type: attachment.type,
    data: attachment.data,
  }))

  const resolvedCpr = resolveManualCpr(body.cprType, normalizeDigits(body.cprNumber), txContext)

  const command = buildPostingCommand({
    transaction: txContext,
    landingLines,
    text: postingText,
    cpr: resolvedCpr,
    attachments: attachments.length ? attachments : undefined,
  })

  const submission = await executePostingCommand(command, {
    runId: first.runId,
    bookingDate,
  })

  const withProcessingRow = rows.filter((r) => r.processingId).map((r) => r.id)
  const withoutProcessingRow = rows.filter((r) => !r.processingId).map((r) => r.id)

  if (withProcessingRow.length) {
    await db
      .update(transactionProcessing)
      .set({ status: 'bogført', ruleApplied: null })
      .where(inArray(transactionProcessing.transactionId, withProcessingRow))
  }

  if (withoutProcessingRow.length) {
    await db.insert(transactionProcessing).values(
      withoutProcessingRow.map((id) => ({
        transactionId: id,
        status: 'bogført' as const,
        ruleApplied: null,
      })),
    )
  }

  return {
    success: true,
    requestId: submission.requestId,
    filename: submission.filename,
    remotePath: submission.remotePath,
    lineCount: submission.lineCount,
    processedTransactions: rows.length,
  }
})

function toDate(value: Date | string | null): Date {
  if (!value) {
    return new Date()
  }
  if (value instanceof Date) {
    return value
  }
  return new Date(value)
}

function resolveSignedAmount(amount: unknown, indicator: string | null): number {
  const amountAbs = Math.abs(parseNumeric(amount))
  return String(indicator ?? '').toUpperCase() === 'DBIT' ? -amountAbs : amountAbs
}

function parseNumeric(value: unknown): number {
  return parseAmount(value)
}

function normalizeOptionalString(value?: string | null): string | null {
  if (!value) {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function normalizeDigits(value?: string | null): string | null {
  if (!value) {
    return null
  }
  const digits = value.replace(/\D+/g, '')
  return digits.length ? digits : null
}

function dedupeStrings(values: string[]): string[] | null {
  const merged = Array.from(new Set(values.map((v) => String(v).trim()).filter(Boolean)))
  return merged.length ? merged : null
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
  if (cprType === 'statisk') {
    return cprNumber ?? undefined
  }
  if (cprType === 'dynamisk') {
    return extractCprFromTransaction(tx) ?? undefined
  }
  return undefined
}
