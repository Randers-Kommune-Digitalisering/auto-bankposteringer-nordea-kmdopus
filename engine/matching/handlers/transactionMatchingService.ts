import { and, eq, inArray, isNotNull, lte } from 'drizzle-orm'
import db from '~/lib/db'
import env from '~/lib/env/env'
import { account } from '~/lib/db/schema/account'
import { rule } from '~/lib/db/schema/rule'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'
import type {
  BookingStatus,
  RuleConditionField,
  RuleConditionOperator,
  RuleStatus,
  RuleType,
} from '~/lib/db/schema/enums'
import type {
  RuleAccountingAttachmentRow,
  RuleConditionRow,
} from '~/lib/db/schema/rule'
import type { PostingAttachment, PostingLineInput } from '../../posting/domain/posting'
import { buildPostingCommand, type PostingCommand } from '../../posting/handlers/postingCommand'
import {
  extractCprFromTransaction,
  resolveCounterpartyName,
  resolvePostingText,
} from '../domain/postingUtils'
import { renderNotificationTemplate, getDefaultNotificationTemplate } from '../../notifications/domain/notificationTemplate'

export interface MatchingNotification {
  to: string
  subject: string
  body: string
}

export interface MatchSummary {
  postings: PostingLineInput[]
  notifications: MatchingNotification[]
  matchedTransactions: number
  exceptionTransactions: number
  unmatchedTransactions: number
}

export type MatchableTransaction = {
  transactionId: string
  runId: string
  accountId: string
  statusDimensions: Record<string, string>
  bookingDate: Date
  amount: number
  creditDebitIndicator?: string | null
  ntryRef?: string | null
  ntryAcctSvcrRef?: string | null
  txAcctSvcrRef?: string | null
  refsEndToEndId?: string | null
  refsInstrId?: string | null
  refsPmtInfId?: string | null
  uetr?: string | null
  entryAdditionalInfo?: string | null
  txAdditionalInfo?: string | null
  bkTxCdDomain?: string | null
  bkTxCdFamily?: string | null
  bkTxCdSubFamily?: string | null
  bkTxCdProprietary?: string | null
  debtorName?: string | null
  debtorId?: string | null
  debtorAccountIban?: string | null
  creditorName?: string | null
  creditorId?: string | null
  creditorAccountIban?: string | null
  ultimateDebtorName?: string | null
  ultimateCreditorName?: string | null
  remittanceUstrd?: string[] | null
  remittanceCreditorReference?: string | null
  remittanceAdditional?: string[] | null
  processingStatus: BookingStatus | null
  hasProcessingRow: boolean
}

type HydratedRule = {
  id: number
  type: RuleType
  status: RuleStatus
  bankAccountIds: string[]
  amountMin?: number
  amountMax?: number
  conditions: RuleConditionRow[]
  accounting?: RuleAccounting
}

export type RuleAccounting = {
  dimensions: Record<string, string>
  bookingText?: string | null
  cprType?: string | null
  cprNumber?: string | null
  notifyTo?: string | null
  note?: string | null
  attachments: RuleAccountingAttachmentRow[]
}

const STATUS_ACCOUNT_DIMENSION_KEY = 'artskonto'

type MatchOutcome =
  | { kind: 'exception'; rule: HydratedRule }
  | {
      kind: 'matched'
      rule: HydratedRule
      command: PostingCommand
      notification?: MatchingNotification
    }
  | { kind: 'unmatched'; command: PostingCommand }

const RULE_TYPE_PRIORITY: Record<RuleType, number> = {
  undtagelse: 0,
  engangs: 1,
  standard: 2,
}

const NOTIFICATION_SUBJECT = 'Indbetaling modtaget og bogført'

export async function matchTransactionsForRun(runId: string): Promise<MatchSummary> {
  const now = new Date()
  // Use noon to avoid DST edge-cases when comparing DATE columns.
  const todayLocal = new Date(now)
  todayLocal.setHours(12, 0, 0, 0)

  const transactions = await fetchMatchableTransactions(runId)
  if (!transactions.length) {
    // Still expire time-limited rules even if there are no matchable transactions.
    await expireTimeLimitedRules(todayLocal)
    return {
      postings: [],
      notifications: [],
      matchedTransactions: 0,
      exceptionTransactions: 0,
      unmatchedTransactions: 0,
    }
  }

  const accountIds = Array.from(new Set(transactions.map(tx => tx.accountId).filter(Boolean)))
  const rules = await fetchActiveRules(accountIds)
  const rulesByAccount = groupRulesByAccount(rules)

  const summary: MatchSummary = {
    postings: [],
    notifications: [],
    matchedTransactions: 0,
    exceptionTransactions: 0,
    unmatchedTransactions: 0,
  }

  const matchedRuleIds = new Set<number>()
  const oneOffRuleIds = new Set<number>()

  await db.transaction(async trx => {
    for (const trxItem of transactions) {
      const applicableRules = rulesByAccount.get(trxItem.accountId) ?? []
      const outcome = evaluateTransaction(trxItem, applicableRules)

      if (outcome.kind === 'matched') {
        summary.postings.push(...outcome.command.postings)
        summary.matchedTransactions += 1
        matchedRuleIds.add(outcome.rule.id)
        if (outcome.rule.type === 'engangs') {
          oneOffRuleIds.add(outcome.rule.id)
        }
        if (outcome.notification) {
          summary.notifications.push(outcome.notification)
        }
        await persistProcessing(trx, trxItem, 'bogført', outcome.rule.id)
      } else if (outcome.kind === 'exception') {
        summary.exceptionTransactions += 1
        matchedRuleIds.add(outcome.rule.id)
        await persistProcessing(trx, trxItem, 'undtaget', outcome.rule.id)
      } else {
        summary.postings.push(...outcome.command.postings)
        summary.unmatchedTransactions += 1
        await persistProcessing(trx, trxItem, 'åben', null)
      }
    }

    if (matchedRuleIds.size) {
      await trx
        .update(rule)
        .set({ lastUsed: now })
        .where(inArray(rule.id, Array.from(matchedRuleIds)))
    }

    if (oneOffRuleIds.size) {
      await trx
        .update(rule)
        .set({ status: 'inaktiv' })
        .where(inArray(rule.id, Array.from(oneOffRuleIds)))
    }

    // Expire time-limited rules whose period ends today (or earlier).
    await expireTimeLimitedRules(todayLocal, trx)
  })

  return summary
}

async function expireTimeLimitedRules(todayLocal: Date, executor: Pick<typeof db, 'update'> = db): Promise<void> {
  await executor
    .update(rule)
    .set({ status: 'inaktiv' })
    .where(and(
      eq(rule.status, 'aktiv'),
      isNotNull(rule.activeTo),
      lte(rule.activeTo, todayLocal),
    ))
}

async function fetchMatchableTransactions(runId: string): Promise<MatchableTransaction[]> {
  const rows = await db
    .select({
      transactionId: transaction.id,
      runId: transaction.runId,
      accountId: transaction.accountId,
      amount: transaction.amount,
      bookingDate: transaction.bookingDate,
      creditDebitIndicator: transaction.creditDebitIndicator,
      ntryRef: transaction.ntryRef,
      ntryAcctSvcrRef: transaction.ntryAcctSvcrRef,
      txAcctSvcrRef: transaction.txAcctSvcrRef,
      refsEndToEndId: transaction.refsEndToEndId,
      refsInstrId: transaction.refsInstrId,
      refsPmtInfId: transaction.refsPmtInfId,
      uetr: transaction.uetr,
      entryAdditionalInfo: transaction.entryAdditionalInfo,
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
      processingRule: transactionProcessing.ruleApplied,
      statusAccount: account.statusAccount,
    })
    .from(transaction)
    .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
    .leftJoin(account, eq(transaction.accountId, account.id))
    .where(eq(transaction.runId, runId))

  return rows
    .filter(row => row.transactionId && row.runId && row.accountId)
    .filter(row => !row.processingStatus || row.processingStatus === 'åben')
    .map(row => {
      const statusAccount = row.statusAccount ? String(row.statusAccount) : env.ERP_ERROR_ACCOUNT
      return {
      transactionId: row.transactionId!,
      runId: row.runId!,
      accountId: row.accountId!,
      statusDimensions: { [STATUS_ACCOUNT_DIMENSION_KEY]: statusAccount },
      bookingDate:
        row.bookingDate instanceof Date
          ? row.bookingDate
          : new Date(row.bookingDate as string),
      amount: parseAmount(row.amount),
      creditDebitIndicator: row.creditDebitIndicator ?? null,
      ntryRef: row.ntryRef ?? null,
      ntryAcctSvcrRef: row.ntryAcctSvcrRef ?? null,
      txAcctSvcrRef: row.txAcctSvcrRef ?? null,
      refsEndToEndId: row.refsEndToEndId ?? null,
      refsInstrId: row.refsInstrId ?? null,
      refsPmtInfId: row.refsPmtInfId ?? null,
      uetr: row.uetr ?? null,
      entryAdditionalInfo: row.entryAdditionalInfo ?? null,
      txAdditionalInfo: row.txAdditionalInfo ?? null,
      bkTxCdDomain: row.bkTxCdDomain ?? null,
      bkTxCdFamily: row.bkTxCdFamily ?? null,
      bkTxCdSubFamily: row.bkTxCdSubFamily ?? null,
      bkTxCdProprietary: row.bkTxCdProprietary ?? null,
      debtorName: row.debtorName ?? null,
      debtorId: row.debtorId ?? null,
      debtorAccountIban: row.debtorAccountIban ?? null,
      creditorName: row.creditorName ?? null,
      creditorId: row.creditorId ?? null,
      creditorAccountIban: row.creditorAccountIban ?? null,
      ultimateDebtorName: row.ultimateDebtorName ?? null,
      ultimateCreditorName: row.ultimateCreditorName ?? null,
      remittanceUstrd: row.remittanceUstrd ?? null,
      remittanceCreditorReference: row.remittanceCreditorReference ?? null,
      remittanceAdditional: row.remittanceAdditional ?? null,
      processingStatus: row.processingStatus ?? null,
      hasProcessingRow: Boolean(row.processingStatus ?? row.processingRule),
      }
    })
}

async function fetchActiveRules(accountIds: string[]): Promise<HydratedRule[]> {
  if (!accountIds.length) {
    return []
  }

  const now = new Date()
  const todayLocal = new Date(now)
  todayLocal.setHours(12, 0, 0, 0)

  const accountIdSet = new Set(accountIds)
  const rows = await db.query.rule.findMany({
    where: (rules, { and, eq, gte, isNull, lte, or }) => and(
      eq(rules.status, 'aktiv'),
      // activeFrom: null OR <= today
      or(isNull(rules.activeFrom), lte(rules.activeFrom, todayLocal)),
      // activeTo: null OR >= today
      or(isNull(rules.activeTo), gte(rules.activeTo, todayLocal)),
    ),
    with: {
      bankAccounts: true,
      conditions: true,
      accountingDimensions: { with: { definition: true } },
      accountingParameters: { with: { attachments: true } },
    },
  })

  return rows
    .filter(row => !!row.type && row.bankAccounts?.length)
    .filter(row => row.bankAccounts!.some(entry => accountIdSet.has(entry.bankAccountId)))
    .map<HydratedRule>(row => ({
      id: row.id,
      type: row.type!,
      status: row.status ?? 'aktiv',
      bankAccountIds: row.bankAccounts!.map(entry => entry.bankAccountId),
      amountMin: parseNullableNumeric(row.matchAmountMin),
      amountMax: parseNullableNumeric(row.matchAmountMax),
      conditions: row.conditions ?? [],
      accounting: (() => {
        const parameters = row.accountingParameters
        if (!parameters) {
          return undefined
        }

        const dimensions: Record<string, string> = {}
        for (const entry of row.accountingDimensions ?? []) {
          const key = entry.definition?.key
          if (!key) continue
          dimensions[key] = entry.value
        }

        return {
          dimensions,
          bookingText: parameters.bookingText ?? null,
          cprType: parameters.cprType ?? null,
          cprNumber: parameters.cprNumber ?? null,
          notifyTo: parameters.notifyTo ?? null,
          note: parameters.note ?? null,
          attachments: parameters.attachments ?? [],
        }
      })(),
    }))
}

function groupRulesByAccount(rules: HydratedRule[]): Map<string, HydratedRule[]> {
  const byAccount = new Map<string, HydratedRule[]>()

  for (const ruleEntry of rules) {
    for (const accountId of ruleEntry.bankAccountIds) {
      const bucket = byAccount.get(accountId) ?? []
      bucket.push(ruleEntry)
      byAccount.set(accountId, bucket)
    }
  }

  for (const bucket of byAccount.values()) {
    bucket.sort((a, b) => {
      const typeDiff = RULE_TYPE_PRIORITY[a.type] - RULE_TYPE_PRIORITY[b.type]
      if (typeDiff !== 0) return typeDiff
      return a.id - b.id
    })
  }

  return byAccount
}

function evaluateTransaction(tx: MatchableTransaction, rules: HydratedRule[]): MatchOutcome {
  for (const candidate of rules) {
    if (!amountMatches(tx.amount, candidate.amountMin, candidate.amountMax)) {
      continue
    }

    const matchesConditions = (candidate.conditions ?? []).every(condition =>
      evaluateCondition(tx, condition),
    )

    if (!matchesConditions) {
      continue
    }

    if (candidate.type === 'undtagelse') {
      return { kind: 'exception', rule: candidate }
    }

    const accounting = candidate.accounting
    if (!accounting) {
      continue
    }

    const cpr = resolveCpr(accounting, tx)
    const postingText = resolvePostingText(accounting.bookingText, tx)
    const command = buildPostingCommand({
      transaction: tx,
      landingDimensions: accounting.dimensions,
      text: postingText,
      cpr,
      attachments: mapAttachments(accounting.attachments),
    })
    const notification = buildNotification(accounting.notifyTo, tx, accounting)

    return { kind: 'matched', rule: candidate, command, notification }
  }

  const fallbackCommand = buildPostingCommand({
    transaction: tx,
    landingDimensions: { [STATUS_ACCOUNT_DIMENSION_KEY]: env.ERP_ERROR_ACCOUNT },
    text: resolvePostingText(undefined, tx),
  })

  return { kind: 'unmatched', command: fallbackCommand }
}

function evaluateCondition(tx: MatchableTransaction, condition: RuleConditionRow): boolean {
  const actual = extractFieldValue(tx, condition.field as RuleConditionField)
  if (actual == null || actual === '') {
    return false
  }

  const operator: RuleConditionOperator = condition.operator ?? 'eq'
  return compareValues(actual, condition.value ?? '', operator)
}

function extractFieldValue(
  tx: MatchableTransaction,
  field: RuleConditionField,
): string | undefined {
  switch (field) {
    case 'ntry_ref':
      return tx.ntryRef ?? undefined
    case 'ntry_acct_svcr_ref':
      return tx.ntryAcctSvcrRef ?? undefined
    case 'tx_acct_svcr_ref':
      return tx.txAcctSvcrRef ?? undefined
    case 'refs_end_to_end_id':
      return tx.refsEndToEndId ?? undefined
    case 'refs_instr_id':
      return tx.refsInstrId ?? undefined
    case 'refs_pmt_inf_id':
      return tx.refsPmtInfId ?? undefined
    case 'uetr':
      return tx.uetr ?? undefined
    case 'dbtr_name':
      return tx.debtorName ?? undefined
    case 'dbtr_id':
      return tx.debtorId ?? undefined
    case 'dbtr_acct_iban':
      return tx.debtorAccountIban ?? undefined
    case 'cdtr_name':
      return tx.creditorName ?? undefined
    case 'cdtr_id':
      return tx.creditorId ?? undefined
    case 'cdtr_acct_iban':
      return tx.creditorAccountIban ?? undefined
    case 'ultmt_dbtr_name':
      return tx.ultimateDebtorName ?? undefined
    case 'ultmt_cdtr_name':
      return tx.ultimateCreditorName ?? undefined
    case 'bk_tx_cd_domain':
      return tx.bkTxCdDomain ?? undefined
    case 'bk_tx_cd_family':
      return tx.bkTxCdFamily ?? undefined
    case 'bk_tx_cd_sub_family':
      return tx.bkTxCdSubFamily ?? undefined
    case 'bk_tx_cd_proprietary':
      return tx.bkTxCdProprietary ?? undefined
    case 'cdt_dbt_ind':
      return tx.creditDebitIndicator ?? undefined
    case 'entry_additional_info':
      return tx.entryAdditionalInfo ?? undefined
    case 'tx_additional_info':
      return tx.txAdditionalInfo ?? undefined
    case 'rmt_ustrd':
      return tx.remittanceUstrd?.filter(Boolean).join(' ') || undefined
    case 'rmt_cdtr_ref':
      return tx.remittanceCreditorReference ?? undefined
    case 'rmt_addtl':
      return tx.remittanceAdditional?.filter(Boolean).join(' ') || undefined
    default:
      return undefined
  }
}

function compareValues(
  actual: string,
  expected: string,
  operator: RuleConditionOperator,
): boolean {
  const normalizedActual = normalizeText(actual)
  const normalizedExpected = normalizeText(expected)

  switch (operator) {
    case 'eq':
      return normalizedActual === normalizedExpected
    case 'neq':
      return normalizedActual !== normalizedExpected
    case 'like':
      return actual.includes(expected.trim())
    case 'ilike':
      return normalizedActual.includes(normalizedExpected)
    case 'in': {
      const tokens = normalizedExpected
        .split(/[,;]+/)
        .map(token => token.trim())
        .filter(Boolean)
      return tokens.some(token => normalizedActual === token)
    }
    case 'gt':
      return compareNumeric(actual, expected, (a, b) => a > b)
    case 'gte':
      return compareNumeric(actual, expected, (a, b) => a >= b)
    case 'lt':
      return compareNumeric(actual, expected, (a, b) => a < b)
    case 'lte':
      return compareNumeric(actual, expected, (a, b) => a <= b)
    default:
      return false
  }
}

function compareNumeric(
  actual: string,
  expected: string,
  comparator: (a: number, b: number) => boolean,
): boolean {
  const actualNumber = parseAmount(actual)
  const expectedNumber = parseAmount(expected)
  if (Number.isNaN(actualNumber) || Number.isNaN(expectedNumber)) {
    return false
  }
  return comparator(actualNumber, expectedNumber)
}

function amountMatches(amount: number, min?: number, max?: number): boolean {
  if (min != null && amount < min) {
    return false
  }
  if (max != null && amount > max) {
    return false
  }
  return true
}

function mapAttachments(rows: RuleAccountingAttachmentRow[] = []): PostingAttachment[] {
  return rows.map(row => ({
    name: row.name,
    type: row.fileExtension,
    data: row.data,
  }))
}

function resolveCpr(accounting: RuleAccounting, tx: MatchableTransaction): string | undefined {
  if (accounting.cprType === 'statisk') {
    return accounting.cprNumber ?? undefined
  }

  if (accounting.cprType === 'dynamisk') {
    return extractCprFromTransaction(tx)
  }

  return undefined
}

function buildNotification(
  recipient: string | null | undefined,
  tx: MatchableTransaction,
  accounting: RuleAccounting,
): MatchingNotification | undefined {
  if (!recipient) {
    return undefined
  }

  const counterpart = resolveCounterpartyName(tx)
    ?? tx.debtorName
    ?? tx.creditorName
    ?? tx.ultimateDebtorName
    ?? tx.ultimateCreditorName
    ?? 'modpart'
  const amountFormatted = formatAmount(tx.amount)

  const postingText = resolvePostingText(tx, accounting)

  const bookingDateFormatted = tx.bookingDate
    ? new Date(tx.bookingDate).toLocaleDateString('da-DK')
    : ''

  const body = renderNotificationTemplate(getDefaultNotificationTemplate(), {
    tx: tx as any,
    accounting: accounting as any,
    counterpartName: counterpart,
    amountFormatted,
    bookingDateFormatted,
    postingText,
    dimensions: Object.entries(accounting.dimensions)
      .sort(([a], [b]) => {
        if (a === STATUS_ACCOUNT_DIMENSION_KEY && b !== STATUS_ACCOUNT_DIMENSION_KEY) return -1
        if (b === STATUS_ACCOUNT_DIMENSION_KEY && a !== STATUS_ACCOUNT_DIMENSION_KEY) return 1
        return a.localeCompare(b)
      })
      .map(([key, value]) => ({ key, value })),
  })

  return {
    to: recipient,
    subject: NOTIFICATION_SUBJECT,
    body,
  }
}

function parseAmount(value: unknown): number {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/\./g, '').replace(/,/g, '.').trim()
    const parsed = Number(normalized)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  return 0
}

function parseNullableNumeric(value: unknown): number | undefined {
  if (value == null) {
    return undefined
  }
  const parsed = parseAmount(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase()
}

function formatAmount(value: number): string {
  return Math.abs(value).toLocaleString('da-DK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

type DbExecutor = Pick<typeof db, 'insert' | 'update'>

async function persistProcessing(
  executor: DbExecutor,
  tx: MatchableTransaction,
  status: BookingStatus,
  ruleId: number | null,
): Promise<void> {
  if (tx.hasProcessingRow) {
    await executor
      .update(transactionProcessing)
      .set({ status, ruleApplied: ruleId ?? null })
      .where(eq(transactionProcessing.transactionId, tx.transactionId))
    return
  }

  await executor.insert(transactionProcessing).values({
    transactionId: tx.transactionId,
    status,
    ruleApplied: ruleId ?? null,
  })
}
