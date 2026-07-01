import { and, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm'
import { defineEventHandler, getQuery, setHeader } from 'h3'
import db from '~/lib/db'
import { account } from '~/lib/db/schema/account'
import { manualBookingDraft } from '~/lib/db/schema/manualBookingDraft'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'
import { transactionCodeCatalog } from '~/lib/db/schema/transactionCodeCatalog'
import type {
  OpenTransaction,
  OpenTransactionInput,
  OpenTransactionsResponse,
  StatementTransaction,
} from '~/types/transactions'
import { presentOpenTransaction } from '~~/server/presenters/openTransactionPresenter'
import { createUtcIsoString, parseIsoDateToUtcDate } from '~~/utils/function'
import { toSamlepostId, toStatementEntryKey } from '~~/server/utils/iso20022Samlepost'

type TransactionsMode = 'open-items' | 'statement'

type StatementPageResponse = {
  rows: StatementTransaction[]
  total: number
  page: number
  pageSize: number
  totalSamleposter: number
}

type BaseRow = {
  id: string
  runId: string
  accountId: string | null
  provider: string | null
  bankAccountName: string | null

  statementId: string | null
  entryIndex: number | null
  entrySubIndex: number | null

  amount: unknown
  currency: string | null
  creditDebitIndicator: string | null
  status: string | null
  bookingDate: Date
  valueDate: Date | null

  ntryRef: string | null
  ntryAcctSvcrRef: string | null
  entryAdditionalInfo: string | null

  txAcctSvcrRef: string | null
  refsEndToEndId: string | null
  refsInstrId: string | null
  refsPmtInfId: string | null
  uetr: string | null
  txAdditionalInfo: string | null

  bkTxCdDomain: string | null
  bkTxCdFamily: string | null
  bkTxCdSubFamily: string | null
  bkTxCdProprietary: string | null

  debtorName: string | null
  debtorId: string | null
  debtorAccountIban: string | null
  creditorName: string | null
  creditorId: string | null
  creditorAccountIban: string | null
  ultimateDebtorName: string | null
  ultimateCreditorName: string | null

  remittanceUstrd: string[] | null
  remittanceCreditorReference: string | null
  remittanceAdditional: string[] | null

  processingStatus: 'åben' | 'bogført' | 'undtaget' | null
  ruleApplied: number | null
  draftNote: string | null
}

type TransactionCodeCatalogMap = Map<string, string>

function parseDateParam(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const parsed = parseIsoDateToUtcDate(value.trim())
  return parsed ? createUtcIsoString(parsed) : null
}

function parseStringParam(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function parseStringArrayParam(value: unknown): string[] {
  if (value == null) return []
  if (Array.isArray(value)) {
    return value
      .flatMap((v) => (typeof v === 'string' ? v.split(',') : []))
      .map((v) => v.trim())
      .filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  }
  return []
}

function parsePositiveIntParam(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? fallback), 10)
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback
  return parsed
}

function parseMode(value: unknown): TransactionsMode {
  return value === 'statement' ? 'statement' : 'open-items'
}

function parseAmount(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toSignedAmount(value: unknown, creditDebitIndicator: string | null): number {
  const absolute = Math.abs(parseAmount(value))
  if (creditDebitIndicator === 'DBIT') return -absolute
  if (creditDebitIndicator === 'CRDT') return absolute
  return parseAmount(value)
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function dedupeStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const entry of values) {
    const value = normalizeString(entry)
    if (!value) continue
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(value)
  }

  return result
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isSubsequence(needle: string, haystack: string): boolean {
  if (!needle.length) return true
  let i = 0
  let j = 0
  while (i < needle.length && j < haystack.length) {
    if (needle[i] === haystack[j]) i += 1
    j += 1
  }
  return i === needle.length
}

function fuzzyTokenScore(token: string, haystack: string): number {
  const directIndex = haystack.indexOf(token)
  if (directIndex >= 0) return 400 - Math.min(directIndex, 350)

  const compactToken = token.replace(/\s+/g, '')
  if (compactToken.length >= 3 && isSubsequence(compactToken, haystack.replace(/\s+/g, ''))) {
    return 120
  }

  const tokenParts = token.split(/\s+/).filter(Boolean)
  if (tokenParts.length > 1 && tokenParts.every((part) => haystack.includes(part))) {
    return 90
  }

  return -1
}

function fuzzyScore(haystack: string, query: string): number {
  const normalizedHaystack = haystack.toLowerCase()
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)

  if (!tokens.length) return 0

  let score = 0
  for (const token of tokens) {
    const tokenScore = fuzzyTokenScore(token, normalizedHaystack)
    if (tokenScore < 0) return -1
    score += tokenScore
  }

  return score
}

function resolveCounterpartAndHint(input: {
  creditDebitIndicator: string | null
  debtorName: string | null
  creditorName: string | null
}): { counterpart: string | null; counterpartHint: string | null } {
  const isOutgoing = input.creditDebitIndicator === 'DBIT'

  const selected = normalizeString(isOutgoing ? input.creditorName : input.debtorName)
  if (selected) {
    return {
      counterpart: selected,
      counterpartHint: isOutgoing ? 'creditorName' : 'debtorName',
    }
  }

  return {
    counterpart: null,
    counterpartHint: null,
  }
}

function normalizeCodeKey(raw: string): string {
  const normalized = raw.trim().toUpperCase()
  return normalized.replace(/\s+/g, '')
}

function resolveTransactionType(input: {
  provider: string | null
  bkTxCdProprietary: string | null
  bkTxCdDomain: string | null
  bkTxCdFamily: string | null
  bkTxCdSubFamily: string | null
  catalogByProviderCodeKey: TransactionCodeCatalogMap
}): { value: string | null; code: string | null; hint: string | null } {
  const provider = normalizeString(input.provider)?.toLowerCase() ?? null

  const proprietary = normalizeString(input.bkTxCdProprietary)
  if (proprietary) {
    const codeKey = normalizeCodeKey(`PRTRY:${proprietary}`)
    const catalogHit = provider ? input.catalogByProviderCodeKey.get(`${provider}:${codeKey}`) : undefined
    return {
      value: catalogHit ?? proprietary,
      code: codeKey,
      hint: 'bkTxCdProprietary',
    }
  }

  const parts = dedupeStrings([
    input.bkTxCdDomain,
    input.bkTxCdFamily,
    input.bkTxCdSubFamily,
  ])

  if (parts.length) {
    const codeKey = normalizeCodeKey(parts.join('/'))
    const catalogHit = provider ? input.catalogByProviderCodeKey.get(`${provider}:${codeKey}`) : undefined
    return {
      value: catalogHit ?? parts.join('/'),
      code: codeKey,
      hint: ['bkTxCdDomain', 'bkTxCdFamily', 'bkTxCdSubFamily'].join(' + '),
    }
  }

  return {
    value: null,
    code: null,
    hint: null,
  }
}

function buildReferenceDetails(input: {
  remittanceUstrd: string[] | null
  remittanceAdditional: string[] | null
  remittanceCreditorReference: string | null
  entryAdditionalInfo: string | null
  txAdditionalInfo: string | null
  refsEndToEndId: string | null
  refsInstrId: string | null
  refsPmtInfId: string | null
  uetr: string | null
  txAcctSvcrRef: string | null
  ntryAcctSvcrRef: string | null
  ntryRef: string | null
}) {
  const details: Array<{ value: string; source: string }> = []

  // Deterministic free-text composition for Nordea-style CAMT:
  // 1) Prtry-originated values (stored in remittanceAdditional)
  // 2) RmtInf/Ustrd values
  for (const value of input.remittanceAdditional ?? []) {
    const normalized = normalizeString(value)
    if (!normalized) continue
    details.push({ value: normalized, source: '/Purp/Prtry' })
  }

  for (const value of input.remittanceUstrd ?? []) {
    const normalized = normalizeString(value)
    if (!normalized) continue
    details.push({ value: normalized, source: '/RmtInf/Ustrd' })
  }

  const singleFieldCandidates: Array<{ value: string | null; source: string }> = [
    { value: input.remittanceCreditorReference, source: '/RmtInf/Strd/CdtrRefInf/Ref' },
    { value: input.entryAdditionalInfo, source: '/Ntry/AddtlNtryInf' },
    { value: input.txAdditionalInfo, source: '/TxDtls/AddtlTxInf' },
    { value: input.refsEndToEndId, source: '/TxDtls/Refs/EndToEndId' },
    { value: input.refsInstrId, source: '/TxDtls/Refs/InstrId' },
    { value: input.refsPmtInfId, source: '/TxDtls/Refs/PmtInfId' },
    { value: input.uetr, source: '/TxDtls/Refs/UETR' },
    { value: input.txAcctSvcrRef, source: '/TxDtls/Refs/AcctSvcrRef' },
    { value: input.ntryAcctSvcrRef, source: '/Ntry/AcctSvcrRef' },
    { value: input.ntryRef, source: '/Ntry/NtryRef' },
  ]

  for (const candidate of singleFieldCandidates) {
    const normalized = normalizeString(candidate.value)
    if (!normalized) continue
    details.push({ value: normalized, source: candidate.source })
  }

  const seen = new Set<string>()
  return details.filter((entry) => {
    const key = `${entry.source}:${entry.value}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function buildSearchText(row: BaseRow): string {
  const chunks: string[] = []

  const push = (value: unknown) => {
    const normalized = normalizeString(value)
    if (!normalized) return
    chunks.push(normalized)
  }

  push(row.id)
  push(row.runId)
  push(row.accountId)
  push(row.bankAccountName)
  push(String(row.amount ?? ''))
  push(row.currency)
  push(row.creditDebitIndicator)
  push(row.status)
  push(row.processingStatus)
  push(String(row.ruleApplied ?? ''))

  push(row.ntryRef)
  push(row.ntryAcctSvcrRef)
  push(row.entryAdditionalInfo)
  push(row.txAcctSvcrRef)
  push(row.refsEndToEndId)
  push(row.refsInstrId)
  push(row.refsPmtInfId)
  push(row.uetr)
  push(row.txAdditionalInfo)

  push(row.bkTxCdProprietary)
  push(row.bkTxCdDomain)
  push(row.bkTxCdFamily)
  push(row.bkTxCdSubFamily)

  push(row.debtorName)
  push(row.debtorId)
  push(row.debtorAccountIban)
  push(row.creditorName)
  push(row.creditorId)
  push(row.creditorAccountIban)
  push(row.ultimateDebtorName)
  push(row.ultimateCreditorName)

  for (const value of row.remittanceUstrd ?? []) push(value)
  for (const value of row.remittanceAdditional ?? []) push(value)
  push(row.remittanceCreditorReference)

  return chunks.join(' ')
}

function filterRowsByFuzzySearch(rows: BaseRow[], search: string): BaseRow[] {
  const query = search.trim()
  if (!query.length) return rows

  const ranked = rows
    .map((row) => ({ row, score: fuzzyScore(buildSearchText(row), query) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score)

  return ranked.map((entry) => entry.row)
}

function mapRowToStatementTransaction(
  row: BaseRow,
  samlepostId: string,
  catalogByProviderCodeKey: TransactionCodeCatalogMap,
): StatementTransaction {
  const signedAmount = toSignedAmount(row.amount, row.creditDebitIndicator)

  const transactionType = resolveTransactionType({
    provider: row.provider,
    bkTxCdProprietary: row.bkTxCdProprietary,
    bkTxCdDomain: row.bkTxCdDomain,
    bkTxCdFamily: row.bkTxCdFamily,
    bkTxCdSubFamily: row.bkTxCdSubFamily,
    catalogByProviderCodeKey,
  })

  return {
    id: row.id,
    samlepostId,
    runId: row.runId,
    accountId: row.accountId,
    bankAccountName: row.bankAccountName,

    statementId: row.statementId,
    entryIndex: row.entryIndex,
    entrySubIndex: row.entrySubIndex,

    amount: String(signedAmount),
    currency: row.currency,
    creditDebitIndicator: row.creditDebitIndicator as StatementTransaction['creditDebitIndicator'],
    status: row.status,
    bookingDate: createUtcIsoString(row.bookingDate),
    valueDate: row.valueDate ? createUtcIsoString(row.valueDate) : null,

    ntryRef: row.ntryRef,
    ntryAcctSvcrRef: row.ntryAcctSvcrRef,
    entryAdditionalInfo: row.entryAdditionalInfo,

    txAcctSvcrRef: row.txAcctSvcrRef,
    refsEndToEndId: row.refsEndToEndId,
    refsInstrId: row.refsInstrId,
    refsPmtInfId: row.refsPmtInfId,
    uetr: row.uetr,
    txAdditionalInfo: row.txAdditionalInfo,

    bkTxCdDomain: row.bkTxCdDomain,
    bkTxCdFamily: row.bkTxCdFamily,
    bkTxCdSubFamily: row.bkTxCdSubFamily,
    bkTxCdProprietary: row.bkTxCdProprietary,
    transactionType: transactionType.value,
    transactionTypeCode: transactionType.code,
    transactionTypeHint: transactionType.hint,

    debtorName: row.debtorName,
    debtorId: row.debtorId,
    debtorAccountIban: row.debtorAccountIban,
    creditorName: row.creditorName,
    creditorId: row.creditorId,
    creditorAccountIban: row.creditorAccountIban,
    ultimateDebtorName: row.ultimateDebtorName,
    ultimateCreditorName: row.ultimateCreditorName,

    remittanceUstrd: row.remittanceUstrd,
    remittanceCreditorReference: row.remittanceCreditorReference,
    remittanceAdditional: row.remittanceAdditional,

    processingStatus: row.processingStatus,
    ruleApplied: row.ruleApplied,
    runningBalance: null,
  }
}

function mapRowToOpenTransaction(
  row: BaseRow,
  samlepostId: string,
  catalogByProviderCodeKey: TransactionCodeCatalogMap,
): OpenTransaction {
  const groupKey = samlepostId.startsWith('group:') ? samlepostId.slice('group:'.length) : null
  const counterpart = resolveCounterpartAndHint({
    creditDebitIndicator: row.creditDebitIndicator,
    debtorName: row.debtorName,
    creditorName: row.creditorName,
  })

  const transactionType = resolveTransactionType({
    provider: row.provider,
    bkTxCdProprietary: row.bkTxCdProprietary,
    bkTxCdDomain: row.bkTxCdDomain,
    bkTxCdFamily: row.bkTxCdFamily,
    bkTxCdSubFamily: row.bkTxCdSubFamily,
    catalogByProviderCodeKey,
  })

  const referenceDetails = buildReferenceDetails({
    remittanceUstrd: row.remittanceUstrd,
    remittanceAdditional: row.remittanceAdditional,
    remittanceCreditorReference: row.remittanceCreditorReference,
    entryAdditionalInfo: row.entryAdditionalInfo,
    txAdditionalInfo: row.txAdditionalInfo,
    refsEndToEndId: row.refsEndToEndId,
    refsInstrId: row.refsInstrId,
    refsPmtInfId: row.refsPmtInfId,
    uetr: row.uetr,
    txAcctSvcrRef: row.txAcctSvcrRef,
    ntryAcctSvcrRef: row.ntryAcctSvcrRef,
    ntryRef: row.ntryRef,
  })

  const signedAmount = toSignedAmount(row.amount, row.creditDebitIndicator)

  const input: OpenTransactionInput = {
    id: row.id,
    runId: row.runId,
    groupKey,
    bookingDate: createUtcIsoString(row.bookingDate),
    amount: signedAmount,
    accountId: row.accountId ?? 'Ukendt konto',
    bankAccountName: row.bankAccountName,
    status: row.processingStatus,
    ruleApplied: row.ruleApplied,
    draftNote: row.draftNote,
    transactionType: transactionType.value,
    transactionTypeCode: transactionType.code,
    transactionTypeHint: transactionType.hint,
    counterpart: counterpart.counterpart,
    counterpartHint: counterpart.counterpartHint,
    references: referenceDetails.map((entry) => entry.value),
    referenceDetails,
  }

  return presentOpenTransaction(input)
}

function stackIdFromGroupKey(groupKey: string | null, id: string): string {
  return groupKey ? `group:${groupKey}` : `single:${id}`
}

function uniqueStackOrderFromSamlepostIds(ids: string[]): string[] {
  const seen = new Set<string>()
  const order: string[] = []

  for (const id of ids) {
    if (seen.has(id)) continue
    seen.add(id)
    order.push(id)
  }

  return order
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const query = getQuery(event)
  const mode = parseMode((query as any).mode)

  const limit = Math.min(500, parsePositiveIntParam((query as any).limit, 200))
  const page = Math.max(1, parsePositiveIntParam((query as any).page, 1))
  const pageSize = Math.min(200, parsePositiveIntParam((query as any).pageSize, 50))
  const offset = (page - 1) * pageSize

  const start = parseDateParam((query as any).start)
  const end = parseDateParam((query as any).end)
  const search = parseStringParam((query as any).search ?? (query as any).q)

  const accountIds = parseStringArrayParam(
    (query as any).accountIds
      ?? (query as any)['accountIds[]']
      ?? (query as any).accounts
      ?? (query as any)['accounts[]']
      ?? (query as any).accountId,
  )

  const baseConditions = [] as Array<any>
  if (start) baseConditions.push(sql`${transaction.bookingDate} >= ${start}::date`)
  if (end) baseConditions.push(sql`${transaction.bookingDate} <= ${end}::date`)
  if (accountIds.length) baseConditions.push(inArray(transaction.accountId, accountIds))

  const processingFilter = mode === 'open-items'
    ? or(eq(transactionProcessing.status, 'åben'), isNull(transactionProcessing.status))
    : undefined

  const whereConditions = processingFilter
    ? [processingFilter, ...baseConditions]
    : baseConditions

  const whereClause = whereConditions.length ? and(...whereConditions) : undefined

  const rows = await db
    .select({
      id: transaction.id,
      runId: transaction.runId,
      accountId: transaction.accountId,
      provider: account.provider,
      bankAccountName: account.name,

      statementId: transaction.statementId,
      entryIndex: transaction.entryIndex,
      entrySubIndex: transaction.entrySubIndex,

      amount: transaction.amount,
      currency: transaction.currency,
      creditDebitIndicator: transaction.creditDebitIndicator,
      status: transaction.status,
      bookingDate: transaction.bookingDate,
      valueDate: transaction.valueDate,

      ntryRef: transaction.ntryRef,
      ntryAcctSvcrRef: transaction.ntryAcctSvcrRef,
      entryAdditionalInfo: transaction.entryAdditionalInfo,

      txAcctSvcrRef: transaction.txAcctSvcrRef,
      refsEndToEndId: transaction.refsEndToEndId,
      refsInstrId: transaction.refsInstrId,
      refsPmtInfId: transaction.refsPmtInfId,
      uetr: transaction.uetr,
      txAdditionalInfo: transaction.txAdditionalInfo,

      bkTxCdDomain: transaction.bkTxCdDomain,
      bkTxCdFamily: transaction.bkTxCdFamily,
      bkTxCdSubFamily: transaction.bkTxCdSubFamily,
      bkTxCdProprietary: transaction.bkTxCdProprietary,

      debtorName: transaction.debtorName,
      debtorId: transaction.debtorId,
      debtorAccountIban: transaction.debtorAccountIban,
      creditorName: transaction.creditorName,
      creditorId: transaction.creditorId,
      creditorAccountIban: transaction.creditorAccountIban,
      ultimateDebtorName: transaction.ultimateDebtorName,
      ultimateCreditorName: transaction.ultimateCreditorName,

      remittanceUstrd: transaction.remittanceUstrd,
      remittanceCreditorReference: transaction.remittanceCreditorReference,
      remittanceAdditional: transaction.remittanceAdditional,

      processingStatus: transactionProcessing.status,
      ruleApplied: transactionProcessing.ruleApplied,
      draftNote: manualBookingDraft.note,
    })
    .from(transaction)
    .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
    .leftJoin(account, eq(account.id, transaction.accountId))
    .leftJoin(manualBookingDraft, eq(manualBookingDraft.transactionId, transaction.id))
    .where(whereClause)
    .orderBy(desc(transaction.bookingDate), desc(transaction.id))

  const filteredRows = filterRowsByFuzzySearch(rows as BaseRow[], search)

  const providers = Array.from(
    new Set(
      filteredRows
        .map((row) => normalizeString(row.provider)?.toLowerCase())
        .filter((value): value is string => Boolean(value)),
    ),
  )

  const catalogRows = providers.length
    ? await db
        .select({
          provider: transactionCodeCatalog.provider,
          codeKey: transactionCodeCatalog.codeKey,
          displayName: transactionCodeCatalog.displayName,
        })
        .from(transactionCodeCatalog)
        .where(and(
          inArray(transactionCodeCatalog.provider, providers as any),
          eq(transactionCodeCatalog.isActive, true),
        ))
    : []

  const catalogByProviderCodeKey: TransactionCodeCatalogMap = new Map()
  for (const row of catalogRows) {
    const provider = normalizeString(row.provider)?.toLowerCase()
    const codeKey = normalizeString(row.codeKey)
    const displayName = normalizeString(row.displayName)
    if (!provider || !codeKey || !displayName) continue
    catalogByProviderCodeKey.set(`${provider}:${normalizeCodeKey(codeKey)}`, displayName)
  }

  const entryGroupSizeByEntryKey = new Map<string, number>()
  for (const row of filteredRows) {
    const entryKey = toStatementEntryKey(row.statementId, row.entryIndex)
    if (!entryKey) continue
    entryGroupSizeByEntryKey.set(entryKey, (entryGroupSizeByEntryKey.get(entryKey) ?? 0) + 1)
  }

  const statementRows = filteredRows.map((row) => {
    const samlepostId = toSamlepostId({
      id: row.id,
      accountId: row.accountId,
      entryGroupSize: entryGroupSizeByEntryKey.get(toStatementEntryKey(row.statementId, row.entryIndex) ?? '') ?? 0,
      bookingDate: row.bookingDate,
      creditDebitIndicator: row.creditDebitIndicator,
      ntryRef: row.ntryRef,
      entryAdditionalInfo: row.entryAdditionalInfo,
      ntryAcctSvcrRef: row.ntryAcctSvcrRef,
    })

    return mapRowToStatementTransaction(row, samlepostId, catalogByProviderCodeKey)
  })

  const samlepostOrder = uniqueStackOrderFromSamlepostIds(statementRows.map((row) => row.samlepostId ?? `single:${row.id}`))

  if (mode === 'statement') {
    const pageStackIds = new Set(samlepostOrder.slice(offset, offset + pageSize))
    const pagedRows = statementRows.filter((row) => pageStackIds.has(row.samlepostId ?? `single:${row.id}`))

    const response: StatementPageResponse = {
      rows: pagedRows,
      total: samlepostOrder.length,
      totalSamleposter: samlepostOrder.length,
      page,
      pageSize,
    }

    return response
  }

  const visibleStackIds = new Set(samlepostOrder.slice(0, limit))
  const visibleStatementRows = statementRows.filter((row) => visibleStackIds.has(row.samlepostId ?? `single:${row.id}`))
  const visibleItems = visibleStatementRows.map((row) => mapRowToOpenTransaction(
    filteredRows.find((r) => r.id === row.id) as BaseRow,
    row.samlepostId ?? `single:${row.id}`,
    catalogByProviderCodeKey,
  ))

  const stackMap = new Map<string, {
    stackId: string
    groupKey: string | null
    items: OpenTransaction[]
    representative: OpenTransaction
    totalAmount: number
    isGrouped: boolean
  }>()

  for (const tx of visibleItems) {
    const stackId = stackIdFromGroupKey(tx.groupKey, tx.id)
    const existing = stackMap.get(stackId)
    if (existing) {
      existing.items.push(tx)
      existing.totalAmount += tx.amount
      continue
    }

    stackMap.set(stackId, {
      stackId,
      groupKey: tx.groupKey,
      items: [tx],
      representative: tx,
      totalAmount: tx.amount,
      isGrouped: Boolean(tx.groupKey),
    })
  }

  const stacks = samlepostOrder
    .slice(0, limit)
    .map((stackId) => stackMap.get(stackId))
    .filter((stack): stack is NonNullable<typeof stack> => Boolean(stack))

  const groupedStacksByAccount: Record<string, typeof stacks> = {}
  for (const stack of stacks) {
    const accountKey = stack.representative.bankAccountName ?? stack.representative.accountId
    if (!groupedStacksByAccount[accountKey]) groupedStacksByAccount[accountKey] = []
    groupedStacksByAccount[accountKey]?.push(stack)
  }

  const response: OpenTransactionsResponse = {
    items: visibleItems,
    stacks,
    groupedStacksByAccount,
    total: filteredRows.length,
    limit,
    totalSamleposter: samlepostOrder.length,
  }

  return response
})
