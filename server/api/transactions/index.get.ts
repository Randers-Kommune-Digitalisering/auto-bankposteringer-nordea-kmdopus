import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { defineEventHandler, setHeader } from "h3";
import db from "~/lib/db";
import { account } from "~/lib/db/schema/account";
import { transaction, transactionProcessing } from "~/lib/db/schema/transaction";
import { transactionReference } from "~/lib/db/schema/transactionReference";
import { transactionParty } from "~/lib/db/schema/transactionParty";
import { transactionCodeCatalog } from "~/lib/db/schema/transactionCodeCatalog";
import { manualBookingDraft } from "~/lib/db/schema/manualBookingDraft";
import { presentOpenTransaction } from "../../presenters/openTransactionPresenter";
import type {
  OpenTransaction,
  OpenTransactionInput,
  OpenTransactionStack,
  OpenTransactionsResponse,
  TransactionReferenceDetail,
} from "~/types/transactions";
import { parseAmount } from "#engine/matching/domain/amount";
import { buildNordeaDeterministicGroupKey } from "#engine/banking-ingestion/handlers/camt053/nordeaAdditionalEntryInfo";
import { MAX_TOP_TRANSACTIONS } from "~/lib/constants/topTransactions";

export default defineEventHandler(async (event) => {
  const maxTopTransactions = MAX_TOP_TRANSACTIONS
  const openTransactionCondition = or(isNull(transactionProcessing.status), eq(transactionProcessing.status, "åben"))

  const totalOpenRows = await db
    .select({ total: sql<number>`count(*)` })
    .from(transaction)
    .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
    .where(openTransactionCondition)

  const total = Number(totalOpenRows[0]?.total ?? 0)

  const openRowsForGrouping = await db
    .select({
      id: transaction.id,
      accountId: transaction.accountId,
      bookingDate: transaction.bookingDate,
      creditDebitIndicator: transaction.creditDebitIndicator,
      ntryRef: transaction.ntryRef,
      entryAdditionalInfo: transaction.entryAdditionalInfo,
      ntryAcctSvcrRef: transaction.ntryAcctSvcrRef,
    })
    .from(transaction)
    .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
    .where(openTransactionCondition)
    .orderBy(desc(transaction.bookingDate), desc(transaction.id))

  const stackIdByTransactionId = new Map<string, string>()
  for (const row of openRowsForGrouping) {
    const transactionId = String(row.id ?? '').trim()
    if (!transactionId) continue
    stackIdByTransactionId.set(transactionId, toTopTransactionStackId({
      id: row.id,
      accountId: row.accountId,
      bookingDate: row.bookingDate,
      creditDebitIndicator: row.creditDebitIndicator,
      ntryRef: row.ntryRef,
      entryAdditionalInfo: row.entryAdditionalInfo,
      ntryAcctSvcrRef: row.ntryAcctSvcrRef,
    }))
  }

  const totalTopTransactions = new Set(stackIdByTransactionId.values()).size

  const shownTopStackIds = new Set<string>()
  const shownTransactionIds: string[] = []
  for (const row of openRowsForGrouping) {
    const transactionId = String(row.id ?? '').trim()
    if (!transactionId) continue
    const stackId = stackIdByTransactionId.get(transactionId)
    if (!stackId) continue

    if (shownTopStackIds.size >= maxTopTransactions && !shownTopStackIds.has(stackId)) {
      continue
    }

    shownTopStackIds.add(stackId)
    shownTransactionIds.push(transactionId)
  }

  const rows = shownTransactionIds.length
    ? await db
        .select({
          id: transaction.id,
          runId: transaction.runId,
          bookingDate: transaction.bookingDate,
          amount: transaction.amount,
          creditDebitIndicator: transaction.creditDebitIndicator,
          accountId: transaction.accountId,
          bankAccountName: account.name,
          bankProvider: account.provider,
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
          draftNote: manualBookingDraft.note,
        })
        .from(transaction)
        .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
        .leftJoin(account, eq(transaction.accountId, account.id))
        .leftJoin(manualBookingDraft, eq(manualBookingDraft.transactionId, transaction.id))
        .where(inArray(transaction.id, shownTransactionIds))
        .orderBy(desc(transaction.bookingDate), desc(transaction.id))
    : []

  const transactionIds = rows
    .map((row) => row.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)

  let v2ReferenceRows: Array<{
    transactionId: string
    value: string
    source: string
    sequenceNo: number
  }> = []

  let v2PartyRows: Array<{
    transactionId: string
    role: string
    displayName: string | null
    identifier: string | null
    accountIban: string | null
    sequenceNo: number
  }> = []

  if (transactionIds.length) {
    try {
      v2ReferenceRows = await db
        .select({
          transactionId: transactionReference.transactionId,
          value: transactionReference.valueNormalized,
          source: transactionReference.xmlPath,
          sequenceNo: transactionReference.sequenceNo,
        })
        .from(transactionReference)
        .where(inArray(transactionReference.transactionId, transactionIds))
        .orderBy(asc(transactionReference.transactionId), asc(transactionReference.sequenceNo)) as typeof v2ReferenceRows
    } catch {
      v2ReferenceRows = []
    }

    try {
      v2PartyRows = await db
        .select({
          transactionId: transactionParty.transactionId,
          role: transactionParty.role,
          displayName: transactionParty.displayName,
          identifier: transactionParty.identifier,
          accountIban: transactionParty.accountIban,
          sequenceNo: transactionParty.sequenceNo,
        })
        .from(transactionParty)
        .where(inArray(transactionParty.transactionId, transactionIds))
        .orderBy(asc(transactionParty.transactionId), asc(transactionParty.sequenceNo)) as typeof v2PartyRows
    } catch {
      v2PartyRows = []
    }
  }

  const catalogCodeKeys = new Set<string>()
  const catalogProviders = new Set<'danskebank' | 'nordea' | 'bankconnect'>()
  for (const row of rows) {
    const key = buildTransactionCodeKey(row)
    if (key) catalogCodeKeys.add(key)
    const provider = normalizeProvider(row.bankProvider)
    if (provider) catalogProviders.add(provider)
  }

  let txCodeCatalogRows: Array<{
    provider: 'danskebank' | 'nordea' | 'bankconnect'
    codeKey: string
    displayName: string
  }> = []
  if (catalogCodeKeys.size && catalogProviders.size) {
    try {
      txCodeCatalogRows = await db
        .select({
          provider: transactionCodeCatalog.provider,
          codeKey: transactionCodeCatalog.codeKey,
          displayName: transactionCodeCatalog.displayName,
        })
        .from(transactionCodeCatalog)
        .where(and(
          inArray(transactionCodeCatalog.provider, Array.from(catalogProviders)),
          inArray(transactionCodeCatalog.codeKey, Array.from(catalogCodeKeys)),
        )) as typeof txCodeCatalogRows
    } catch {
      txCodeCatalogRows = []
    }
  }

  const txCodeDisplayNameByCodeKey = new Map<string, string>()
  for (const row of txCodeCatalogRows) {
    const provider = normalizeProvider(row.provider)
    const key = String(row.codeKey ?? '').trim()
    const name = String(row.displayName ?? '').trim()
    if (!provider || !key || !name) continue
    txCodeDisplayNameByCodeKey.set(`${provider}:${key.toUpperCase()}`, name)
  }

  const referenceDetailsByTransactionId = new Map<string, TransactionReferenceDetail[]>()
  for (const row of v2ReferenceRows) {
    const transactionId = String(row.transactionId)
    const bucket = referenceDetailsByTransactionId.get(transactionId) ?? []
    bucket.push({
      value: String(row.value ?? '').trim(),
      source: String(row.source ?? '').trim() || 'Ukendt XML-felt',
    })
    referenceDetailsByTransactionId.set(transactionId, bucket)
  }

  type V2PartyRow = {
    role: 'debtor' | 'creditor' | 'ultimateDebtor' | 'ultimateCreditor'
    displayName: string | null
    identifier: string | null
    accountIban: string | null
  }

  const partiesByTransactionId = new Map<string, V2PartyRow[]>()
  for (const row of v2PartyRows) {
    const transactionId = String(row.transactionId)
    const bucket = partiesByTransactionId.get(transactionId) ?? []
    bucket.push({
      role: row.role as V2PartyRow['role'],
      displayName: row.displayName,
      identifier: row.identifier,
      accountIban: row.accountIban,
    })
    partiesByTransactionId.set(transactionId, bucket)
  }

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
        ntryRef: row.ntryRef ?? null,
        entryAdditionalInfo: row.entryAdditionalInfo ?? null,
        ntryAcctSvcrRef: row.ntryAcctSvcrRef ?? null,
      })

      const referenceDetails = referenceDetailsByTransactionId.get(row.id!) ?? buildReferenceDetails(row)
      const counterpart = resolveCounterpart({
        isOutgoing,
        row,
        parties: partiesByTransactionId.get(row.id!) ?? [],
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
        draftNote: row.draftNote ?? null,
        transactionTypeCode: buildTransactionCodeKey(row),
        transactionTypeHint: resolveTransactionTypeHint(row),
        transactionType: resolveTransactionType({
          row,
          catalogDisplayNameByCodeKey: txCodeDisplayNameByCodeKey,
        }) ?? "Ukendt",
        counterpart: counterpart.value,
        counterpartHint: counterpart.hint,
        referenceDetails,
        references: referenceDetails.map((entry) => entry.value),
      };
      return base
    });

  const payload = normalized.map<OpenTransaction>((entry) => presentOpenTransaction(entry));

  const stackById = new Map<string, OpenTransactionStack>()
  const stackOrder: string[] = []
  for (const entry of payload) {
    const stackId = entry.groupKey ? `group:${entry.groupKey}` : `single:${entry.id}`
    const existing = stackById.get(stackId)
    if (!existing) {
      stackById.set(stackId, {
        stackId,
        groupKey: entry.groupKey,
        items: [entry],
        representative: entry,
        totalAmount: entry.amount,
        isGrouped: Boolean(entry.groupKey),
      })
      stackOrder.push(stackId)
      continue
    }

    existing.items.push(entry)
    existing.totalAmount += entry.amount
  }

  const stacks = stackOrder
    .map((stackId) => stackById.get(stackId))
    .filter((stack): stack is OpenTransactionStack => Boolean(stack))

  const groupedStacksByAccount: Record<string, OpenTransactionStack[]> = {}
  for (const stack of stacks) {
    const accountKey = stack.representative.bankAccountName || 'Ukendt konto'
    const bucket = groupedStacksByAccount[accountKey] ?? []
    bucket.push(stack)
    groupedStacksByAccount[accountKey] = bucket
  }

  const response: OpenTransactionsResponse = {
    items: payload,
    stacks,
    groupedStacksByAccount,
    total,
    limit: maxTopTransactions,
    totalTopTransactions,
  }

  setHeader(event, "X-Data-Source", "db");
  return response;
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

function toDateOnlyDate(value: Date | string | null): Date {
  if (value instanceof Date) return value
  const parsed = value ? new Date(value) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function toTopTransactionStackId(input: {
  id: string | null
  accountId: string | null
  bookingDate: Date | string | null
  creditDebitIndicator: string | null
  ntryRef: string | null
  entryAdditionalInfo: string | null
  ntryAcctSvcrRef: string | null
}): string {
  const groupKey = buildNordeaDeterministicGroupKey({
    accountId: input.accountId ?? '',
    bookingDate: toDateOnlyDate(input.bookingDate),
    creditDebitIndicator: input.creditDebitIndicator ?? null,
    ntryRef: input.ntryRef ?? null,
    entryAdditionalInfo: input.entryAdditionalInfo ?? null,
    ntryAcctSvcrRef: input.ntryAcctSvcrRef ?? null,
  })

  if (groupKey) return `group:${groupKey}`
  return `single:${String(input.id ?? '')}`
}

type TransactionRow = {
  bankProvider: string | null;
  bkTxCdProprietary: string | null;
  bkTxCdDomain: string | null;
  bkTxCdFamily: string | null;
  bkTxCdSubFamily: string | null;
}

function buildTransactionCodeKey(row: TransactionRow): string | null {
  if (row.bkTxCdProprietary && row.bkTxCdProprietary.trim().length) {
    return `PRTRY:${row.bkTxCdProprietary.trim()}`
  }

  const parts = [row.bkTxCdDomain, row.bkTxCdFamily, row.bkTxCdSubFamily]
    .map((value) => (value ? value.trim() : ''))
    .filter(Boolean)

  return parts.length ? parts.join('/') : null
}

function normalizeProvider(value: string | null | undefined): 'danskebank' | 'nordea' | 'bankconnect' | null {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'danskebank') return 'danskebank'
  if (normalized === 'nordea') return 'nordea'
  if (normalized === 'bankconnect') return 'bankconnect'
  return null
}

function resolveTransactionType(input: {
  row: TransactionRow
  catalogDisplayNameByCodeKey: Map<string, string>
}): string | null {
  const codeKey = buildTransactionCodeKey(input.row)
  if (!codeKey) return null

  const provider = normalizeProvider(input.row.bankProvider)
  const displayName = provider
    ? input.catalogDisplayNameByCodeKey.get(`${provider}:${codeKey.toUpperCase()}`)
    : undefined
  if (displayName) return displayName

  if (codeKey.startsWith('PRTRY:')) {
    return codeKey.slice('PRTRY:'.length)
  }

  return codeKey
}

type TransactionPartyRow = {
  debtorName: string | null;
  debtorId: string | null;
  ultimateDebtorName: string | null;
  creditorName: string | null;
  creditorId: string | null;
  ultimateCreditorName: string | null;
}

function resolveCounterpart(input: {
  isOutgoing: boolean
  row: TransactionPartyRow
  parties: Array<{
    role: 'debtor' | 'creditor' | 'ultimateDebtor' | 'ultimateCreditor'
    displayName: string | null
    identifier: string | null
    accountIban: string | null
  }>
}): { value: string | null; hint: string | null } {
  const { isOutgoing, row, parties } = input

  const fromParties = resolveCounterpartFromV2Parties({ isOutgoing, parties })
  if (fromParties) return fromParties

  if (isOutgoing) {
    const candidates: Array<{ value: string | null; hint: string }> = [
      { value: row.creditorName, hint: 'creditorName' },
      { value: row.ultimateCreditorName, hint: 'ultimateCreditorName' },
      { value: row.creditorId, hint: 'creditorId' },
      { value: row.debtorName, hint: 'debtorName' },
      { value: row.ultimateDebtorName, hint: 'ultimateDebtorName' },
      { value: row.debtorId, hint: 'debtorId' },
    ]
    for (const candidate of candidates) {
      const normalized = normalizePartyValue(candidate.value)
      if (normalized) return { value: normalized, hint: candidate.hint }
    }
    return { value: null, hint: null }
  }

  const candidates: Array<{ value: string | null; hint: string }> = [
    { value: row.debtorName, hint: 'debtorName' },
    { value: row.ultimateDebtorName, hint: 'ultimateDebtorName' },
    { value: row.debtorId, hint: 'debtorId' },
    { value: row.creditorName, hint: 'creditorName' },
    { value: row.ultimateCreditorName, hint: 'ultimateCreditorName' },
    { value: row.creditorId, hint: 'creditorId' },
  ]
  for (const candidate of candidates) {
    const normalized = normalizePartyValue(candidate.value)
    if (normalized) return { value: normalized, hint: candidate.hint }
  }
  return { value: null, hint: null }
}

function normalizePartyValue(value: string | null | undefined): string | null {
  const normalized = String(value ?? '').trim()
  return normalized.length ? normalized : null
}

function resolveCounterpartFromV2Parties(input: {
  isOutgoing: boolean
  parties: Array<{
    role: 'debtor' | 'creditor' | 'ultimateDebtor' | 'ultimateCreditor'
    displayName: string | null
    identifier: string | null
    accountIban: string | null
  }>
}): { value: string; hint: string } | null {
  if (!input.parties.length) return null

  const roleOrder = input.isOutgoing
    ? ['creditor', 'ultimateCreditor', 'debtor', 'ultimateDebtor'] as const
    : ['debtor', 'ultimateDebtor', 'creditor', 'ultimateCreditor'] as const

  for (const role of roleOrder) {
    const candidates = input.parties.filter((party) => party.role === role)
    for (const candidate of candidates) {
      const displayName = normalizePartyValue(candidate.displayName)
      if (displayName) {
        if (role === 'creditor') return { value: displayName, hint: 'creditorName' }
        if (role === 'ultimateCreditor') return { value: displayName, hint: 'ultimateCreditorName' }
        if (role === 'debtor') return { value: displayName, hint: 'debtorName' }
        return { value: displayName, hint: 'ultimateDebtorName' }
      }
      const identifier = normalizePartyValue(candidate.identifier)
      if (identifier) {
        if (role === 'creditor') return { value: identifier, hint: 'creditorId' }
        if (role === 'ultimateCreditor') return { value: identifier, hint: 'ultimateCreditorName' }
        if (role === 'debtor') return { value: identifier, hint: 'debtorId' }
        return { value: identifier, hint: 'ultimateDebtorName' }
      }
      const accountIban = normalizePartyValue(candidate.accountIban)
      if (accountIban) {
        if (role === 'creditor') return { value: accountIban, hint: 'creditorAccountIban' }
        if (role === 'ultimateCreditor') return { value: accountIban, hint: 'ultimateCreditorName' }
        if (role === 'debtor') return { value: accountIban, hint: 'debtorAccountIban' }
        return { value: accountIban, hint: 'ultimateDebtorName' }
      }
    }
  }

  return null
}

function resolveTransactionTypeHint(row: TransactionRow): string | null {
  if (row.bkTxCdProprietary && row.bkTxCdProprietary.trim().length) {
    return 'bkTxCdProprietary'
  }

  const sourceParts: string[] = []
  if (row.bkTxCdDomain?.trim()) sourceParts.push('bkTxCdDomain')
  if (row.bkTxCdFamily?.trim()) sourceParts.push('bkTxCdFamily')
  if (row.bkTxCdSubFamily?.trim()) sourceParts.push('bkTxCdSubFamily')

  return sourceParts.length ? sourceParts.join(' + ') : null
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

function buildReferenceDetails(row: TransactionReferenceRow): TransactionReferenceDetail[] {
  const refs = new Map<string, TransactionReferenceDetail>();
  const maybeAdd = (source: string, value?: string | null) => {
    if (!value || !value.trim().length) return
    const normalized = value.trim()
    const key = normalized.toLowerCase()
    if (refs.has(key)) return
    refs.set(key, { value: normalized, source })
  };

  maybeAdd('Ntry/NtryRef', row.ntryRef)
  maybeAdd('Ntry/AcctSvcrRef', row.ntryAcctSvcrRef)
  maybeAdd('Ntry/NtryDtls/TxDtls/Refs/AcctSvcrRef', row.txAcctSvcrRef)
  maybeAdd('Ntry/NtryDtls/TxDtls/Refs/EndToEndId', row.refsEndToEndId)
  maybeAdd('Ntry/NtryDtls/TxDtls/Refs/InstrId', row.refsInstrId)
  maybeAdd('Ntry/NtryDtls/TxDtls/Refs/PmtInfId', row.refsPmtInfId)
  maybeAdd('Ntry/NtryDtls/TxDtls/Refs/UETR', row.uetr)
  maybeAdd('Ntry/AddtlNtryInf', row.entryAdditionalInfo)
  maybeAdd('Ntry/NtryDtls/TxDtls/AddtlTxInf', row.txAdditionalInfo)
  maybeAdd('Ntry/NtryDtls/TxDtls/RmtInf/Strd/CdtrRefInf/Ref', row.remittanceCreditorReference)

  if (Array.isArray(row.remittanceUstrd)) {
    row.remittanceUstrd.forEach((value) => maybeAdd('Ntry/NtryDtls/TxDtls/RmtInf/Ustrd', value))
  }
  if (Array.isArray(row.remittanceAdditional)) {
    row.remittanceAdditional.forEach((value) => maybeAdd('Ntry/NtryDtls/TxDtls/RmtInf/AddtlRmtInf', value))
  }

  return Array.from(refs.values());
}
