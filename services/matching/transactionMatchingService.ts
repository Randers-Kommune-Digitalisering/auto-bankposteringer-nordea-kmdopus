import { eq, inArray } from "drizzle-orm";
import db from "../../app/lib/db";
import env from "../../app/lib/env";
import {
  account,
  bankingPayload,
  rule,
  transaction,
  transactionProcessing,
} from "../../app/lib/db/schema";
import type {
  BookingStatus,
  RuleConditionField,
  RuleConditionOperator,
  RuleStatus,
  RuleType,
} from "../../app/lib/db/schema";
import type {
  KmdAccountingParametersRow,
  KmdAttachmentRow,
  RuleConditionRow,
} from "../../app/lib/db/schema";
import type { SimpleAccountReportEntry } from "../../services/banking/batchFetchTransactions";
import type { PostingAttachment, PostingLineInput } from "../../services/erp/postingXmlBuilder";

export interface MatchingNotification {
  to: string;
  subject: string;
  body: string;
}

export interface MatchSummary {
  postings: PostingLineInput[];
  notifications: MatchingNotification[];
  matchedTransactions: number;
  exceptionTransactions: number;
  unmatchedTransactions: number;
}

type MatchableTransaction = {
  transactionId: string;
  runId: string;
  accountId: string;
  statusAccount: string;
  bookingDate: Date;
  amount: number;
  payload: SimpleAccountReportEntry | null;
  processingStatus: BookingStatus | null;
  hasProcessingRow: boolean;
};

type HydratedRule = {
  id: number;
  type: RuleType;
  status: RuleStatus;
  bankAccountIds: string[];
  amountMin?: number;
  amountMax?: number;
  conditions: RuleConditionRow[];
  accounting?: RuleAccounting;
};

type RuleAccounting = KmdAccountingParametersRow & {
  attachments: KmdAttachmentRow[];
};

type MatchOutcome =
  | { kind: "exception"; rule: HydratedRule }
  | {
      kind: "matched";
      rule: HydratedRule;
      postings: PostingLineInput[];
      notification?: MatchingNotification;
    }
  | { kind: "unmatched"; postings: PostingLineInput[] };

const RULE_TYPE_PRIORITY: Record<RuleType, number> = {
  undtagelse: 0,
  engangs: 1,
  standard: 2,
};

const NOTIFICATION_SUBJECT = "Indbetaling modtaget og bogført";

export async function matchTransactionsForRun(runId: string): Promise<MatchSummary> {
  const transactions = await fetchMatchableTransactions(runId);
  if (!transactions.length) {
    return {
      postings: [],
      notifications: [],
      matchedTransactions: 0,
      exceptionTransactions: 0,
      unmatchedTransactions: 0,
    };
  }

  const accountIds = Array.from(new Set(transactions.map((tx) => tx.accountId).filter(Boolean)));
  const rules = await fetchActiveRules(accountIds);
  const rulesByAccount = groupRulesByAccount(rules);

  const summary: MatchSummary = {
    postings: [],
    notifications: [],
    matchedTransactions: 0,
    exceptionTransactions: 0,
    unmatchedTransactions: 0,
  };

  const matchedRuleIds = new Set<number>();
  const oneOffRuleIds = new Set<number>();
  const now = new Date();

  await db.transaction(async (trx) => {
    for (const trxItem of transactions) {
      const applicableRules = rulesByAccount.get(trxItem.accountId) ?? [];
      const outcome = evaluateTransaction(trxItem, applicableRules);

      if (outcome.kind === "matched") {
        summary.postings.push(...outcome.postings);
        summary.matchedTransactions += 1;
        matchedRuleIds.add(outcome.rule.id);
        if (outcome.rule.type === "engangs") {
          oneOffRuleIds.add(outcome.rule.id);
        }
        if (outcome.notification) {
          summary.notifications.push(outcome.notification);
        }
        await persistProcessing(trx, trxItem, "bogført", outcome.rule.id);
      } else if (outcome.kind === "exception") {
        summary.exceptionTransactions += 1;
        matchedRuleIds.add(outcome.rule.id);
        await persistProcessing(trx, trxItem, "undtaget", outcome.rule.id);
      } else {
        summary.postings.push(...outcome.postings);
        summary.unmatchedTransactions += 1;
        await persistProcessing(trx, trxItem, "åben", null);
      }
    }

    if (matchedRuleIds.size) {
      await trx
        .update(rule)
        .set({ lastUsed: now })
        .where(inArray(rule.id, Array.from(matchedRuleIds)));
    }

    if (oneOffRuleIds.size) {
      await trx
        .update(rule)
        .set({ status: "inaktiv" })
        .where(inArray(rule.id, Array.from(oneOffRuleIds)));
    }
  });

  return summary;
}

async function fetchMatchableTransactions(runId: string): Promise<MatchableTransaction[]> {
  const rows = await db
    .select({
      transactionId: transaction.id,
      runId: transaction.runId,
      accountId: transaction.accountId,
      amount: transaction.amount,
      bookingDate: transaction.bookingDate,
      payload: bankingPayload.raw,
      processingStatus: transactionProcessing.status,
      processingRule: transactionProcessing.ruleApplied,
      statusAccount: account.statusAccount,
    })
    .from(transaction)
    .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
    .leftJoin(bankingPayload, eq(transaction.payloadId, bankingPayload.id))
    .leftJoin(account, eq(transaction.accountId, account.id))
    .where(eq(transaction.runId, runId));

  return rows
    .filter((row) => row.transactionId && row.runId && row.accountId)
    .filter((row) => !row.processingStatus || row.processingStatus === "åben")
    .map((row) => ({
      transactionId: row.transactionId!,
      runId: row.runId!,
      accountId: row.accountId!,
      statusAccount: row.statusAccount ? String(row.statusAccount) : env.ERP_ERROR_ACCOUNT,
      bookingDate: row.bookingDate instanceof Date ? row.bookingDate : new Date(row.bookingDate as string),
      amount: parseAmount(row.amount),
      payload: row.payload ? (row.payload as SimpleAccountReportEntry) : null,
      processingStatus: row.processingStatus ?? null,
      hasProcessingRow: Boolean(row.processingStatus ?? row.processingRule),
    }));
}

async function fetchActiveRules(accountIds: string[]): Promise<HydratedRule[]> {
  if (!accountIds.length) {
    return [];
  }

  const accountIdSet = new Set(accountIds);
  const rows = await db.query.rule.findMany({
    where: (rules, { eq }) => eq(rules.status, "aktiv"),
    with: {
      bankAccounts: true,
      conditions: true,
      accountingParameters: { with: { attachments: true } },
    },
  });

  return rows
    .filter((row) => !!row.type && row.bankAccounts?.length)
    .filter((row) => row.bankAccounts!.some((entry) => accountIdSet.has(entry.bankAccountId)))
    .map<HydratedRule>((row) => ({
      id: row.id,
      type: row.type!,
      status: row.status ?? "aktiv",
      bankAccountIds: row.bankAccounts!.map((entry) => entry.bankAccountId),
      amountMin: parseNullableNumeric(row.matchAmountMin),
      amountMax: parseNullableNumeric(row.matchAmountMax),
      conditions: row.conditions ?? [],
      accounting: row.accountingParameters
        ? {
            ...row.accountingParameters,
            attachments: row.accountingParameters.attachments ?? [],
          }
        : undefined,
    }));
}

function groupRulesByAccount(rules: HydratedRule[]): Map<string, HydratedRule[]> {
  const byAccount = new Map<string, HydratedRule[]>();

  for (const ruleEntry of rules) {
    for (const accountId of ruleEntry.bankAccountIds) {
      const bucket = byAccount.get(accountId) ?? [];
      bucket.push(ruleEntry);
      byAccount.set(accountId, bucket);
    }
  }

  for (const bucket of byAccount.values()) {
    bucket.sort((a, b) => {
      const typeDiff = RULE_TYPE_PRIORITY[a.type] - RULE_TYPE_PRIORITY[b.type];
      if (typeDiff !== 0) return typeDiff;
      return a.id - b.id;
    });
  }

  return byAccount;
}

function evaluateTransaction(tx: MatchableTransaction, rules: HydratedRule[]): MatchOutcome {
  for (const candidate of rules) {
    if (!amountMatches(tx.amount, candidate.amountMin, candidate.amountMax)) {
      continue;
    }

    const matchesConditions = (candidate.conditions ?? []).every((condition) =>
      evaluateCondition(tx, condition),
    );

    if (!matchesConditions) {
      continue;
    }

    if (candidate.type === "undtagelse") {
      return { kind: "exception", rule: candidate };
    }

    const accounting = candidate.accounting;
    if (!accounting) {
      continue;
    }

    const cpr = resolveCpr(accounting, tx);
    const postingText = resolvePostingText(accounting.bookingText, tx);
    const postingLines = buildPostingLines({
      transaction: tx,
      landingAccount: accounting.primaryAccount,
      landingSecondary: accounting.secondaryAccount ?? undefined,
      landingTertiary: accounting.tertiaryAccount ?? undefined,
      text: postingText,
      cpr,
      attachments: mapAttachments(accounting.attachments),
    });
    const notification = buildNotification(accounting.notifyTo, tx, accounting);

    return { kind: "matched", rule: candidate, postings: postingLines, notification };
  }

  const fallbackPostings = buildPostingLines({
    transaction: tx,
    landingAccount: env.ERP_ERROR_ACCOUNT,
    text: resolvePostingText(undefined, tx),
  });

  return { kind: "unmatched", postings: fallbackPostings };
}

function evaluateCondition(tx: MatchableTransaction, condition: RuleConditionRow): boolean {
  const actual = extractFieldValue(tx, condition.field as RuleConditionField);
  if (actual == null || actual === "") {
    return false;
  }

  const operator: RuleConditionOperator = condition.operator ?? "eq";
  return compareValues(actual, condition.value ?? "", operator);
}

function extractFieldValue(tx: MatchableTransaction, field: RuleConditionField): string | undefined {
  const payload = tx.payload ?? {};
  switch (field) {
    case "id":
      return payload.id ?? tx.transactionId;
    case "end_to_end_id":
      return payload.endToEndId;
    case "ocr_reference":
      return payload.ocrReference;
    case "text":
      return payload.text ?? payload.primaryReference ?? payload.debtorMessage ?? payload.creditorMessage;
    case "batch":
      return payload.batch;
    case "debtor_text":
      return payload.debtorText;
    case "debtor_message":
      return payload.debtorMessage;
    case "debtors_payment_id":
      return payload.debtorsPaymentId;
    case "creditor_text":
      return payload.creditorText;
    case "creditor_message":
      return payload.creditorMessage;
    case "primary_reference":
      return payload.primaryReference;
    case "type":
      return payload.type;
    case "tx_code_domain":
      return payload.transactionCodes?.domain ?? payload.transactionCodes?.Domain;
    case "tx_code_family":
      return payload.transactionCodes?.family ?? payload.transactionCodes?.Family;
    case "tx_code_sub_family":
      return payload.transactionCodes?.subFamily ?? payload.transactionCodes?.SubFamily;
    case "debtor_name":
      return payload.debtor?.name;
    case "debtor_id":
      return payload.debtor?.id;
    case "creditor_name":
      return payload.creditor?.name;
    case "creditor_id":
      return payload.creditor?.id;
    default:
      return undefined;
  }
}

function compareValues(actual: string, expected: string, operator: RuleConditionOperator): boolean {
  const normalizedActual = normalizeText(actual);
  const normalizedExpected = normalizeText(expected);

  switch (operator) {
    case "eq":
      return normalizedActual === normalizedExpected;
    case "neq":
      return normalizedActual !== normalizedExpected;
    case "like":
      return actual.includes(expected.trim());
    case "ilike":
      return normalizedActual.includes(normalizedExpected);
    case "in": {
      const tokens = normalizedExpected.split(/[,;]+/).map((token) => token.trim()).filter(Boolean);
      return tokens.some((token) => normalizedActual === token);
    }
    case "gt":
      return compareNumeric(actual, expected, (a, b) => a > b);
    case "gte":
      return compareNumeric(actual, expected, (a, b) => a >= b);
    case "lt":
      return compareNumeric(actual, expected, (a, b) => a < b);
    case "lte":
      return compareNumeric(actual, expected, (a, b) => a <= b);
    default:
      return false;
  }
}

function compareNumeric(
  actual: string,
  expected: string,
  comparator: (a: number, b: number) => boolean,
): boolean {
  const actualNumber = parseAmount(actual);
  const expectedNumber = parseAmount(expected);
  if (Number.isNaN(actualNumber) || Number.isNaN(expectedNumber)) {
    return false;
  }
  return comparator(actualNumber, expectedNumber);
}

function amountMatches(amount: number, min?: number, max?: number): boolean {
  if (min != null && amount < min) {
    return false;
  }
  if (max != null && amount > max) {
    return false;
  }
  return true;
}

function buildPostingLines(options: {
  transaction: MatchableTransaction;
  landingAccount: string;
  landingSecondary?: string;
  landingTertiary?: string;
  text: string;
  cpr?: string;
  attachments?: PostingAttachment[];
}): PostingLineInput[] {
  const amountAbs = Math.abs(options.transaction.amount);
  const isIncoming = options.transaction.amount >= 0;
  const statusLine: PostingLineInput = {
    account: options.transaction.statusAccount,
    debetOrCredit: isIncoming ? "Debet" : "Kredit",
    amount: amountAbs,
    text: truncate(options.text),
  };

  const landingLine: PostingLineInput = {
    account: options.landingAccount,
    accountSecondary: options.landingSecondary,
    accountTertiary: options.landingTertiary,
    debetOrCredit: isIncoming ? "Kredit" : "Debet",
    amount: amountAbs,
    text: truncate(options.text),
    cpr: options.cpr,
    attachments: options.attachments?.length ? options.attachments : undefined,
  };

  return [statusLine, landingLine];
}

function mapAttachments(rows: KmdAttachmentRow[] = []): PostingAttachment[] {
  return rows.map((row) => ({
    name: row.name,
    type: row.fileExtension,
    data: row.data,
  }));
}

function resolvePostingText(textTemplate: string | null | undefined, tx: MatchableTransaction): string {
  const payload = tx.payload ?? {};
  const message = payload.debtorMessage || payload.creditorMessage || payload.text || "";

  if (message.includes("BDP")) {
    const start = message.indexOf("BDP");
    return message.substring(start, start + 18).replace(/\s+/g, "");
  }

  if (message.includes("KSD")) {
    const start = message.indexOf("KSD");
    const counterpart = resolveCounterpartyName(tx);
    return `${message.substring(start, start + 21)}${counterpart ?? ""}`.trim();
  }

  if (!textTemplate) {
    return payload.text ?? payload.primaryReference ?? tx.transactionId;
  }

  const normalized = textTemplate.trim().toLowerCase();
  if (normalized === "tekst fra bank") {
    return payload.text ?? payload.primaryReference ?? tx.transactionId;
  }

  if (normalized === "afsender fra bank") {
    return resolveCounterpartyName(tx) ?? payload.text ?? tx.transactionId;
  }

  return textTemplate;
}

function resolveCounterpartyName(tx: MatchableTransaction): string | undefined {
  const payload = tx.payload;
  if (!payload) {
    return undefined;
  }

  const isOutgoing = tx.amount < 0;
  if (isOutgoing) {
    return payload.creditor?.name ?? payload.creditorText ?? payload.creditorMessage ?? payload.creditor?.id ?? undefined;
  }

  return payload.debtor?.name ?? payload.debtorText ?? payload.debtorMessage ?? payload.debtor?.id ?? undefined;
}

function resolveCpr(accounting: RuleAccounting, tx: MatchableTransaction): string | undefined {
  if (accounting.cprType === "statisk") {
    return accounting.cprNumber ?? undefined;
  }

  if (accounting.cprType === "dynamisk") {
    return extractCprFromTransaction(tx);
  }

  return undefined;
}

const CPR_REGEX = /(((0[1-9]|[12][0-9]|3[01])(0[13578]|10|12)(\d{2}))|(([0][1-9]|[12][0-9]|30)(0[469]|11)(\d{2}))|((0[1-9]|1[0-9]|2[0-8])(02)(\d{2}))|((29)(02)(00))|((29)(02)([2468][048]))|((29)(02)([13579][26])))[-]*\d{4}/gm;

function extractCprFromTransaction(tx: MatchableTransaction): string | undefined {
  const payload = tx.payload;
  if (!payload) {
    return undefined;
  }

  const haystacks = [
    payload.text,
    payload.primaryReference,
    payload.debtorMessage,
    payload.creditorMessage,
    payload.debtorText,
    payload.creditorText,
  ].filter(Boolean) as string[];

  for (const value of haystacks) {
    const match = value.match(CPR_REGEX);
    if (match?.length) {
      return match[0].replace("-", "");
    }
  }

  return undefined;
}

function buildNotification(
  recipient: string | null | undefined,
  tx: MatchableTransaction,
  accounting: RuleAccounting,
): MatchingNotification | undefined {
  if (!recipient) {
    return undefined;
  }

  const counterpart = resolveCounterpartyName(tx) ?? "modpart";
  const amountFormatted = formatAmount(tx.amount);

  const lines = [
    `Din indbetaling på ${amountFormatted} kr. fra ${counterpart} er modtaget og er blevet bogført med nedenstående kontering:`,
    "",
    accounting.primaryAccount,
  ];

  if (accounting.secondaryAccount) {
    lines.push("", accounting.secondaryAccount);
  }

  return {
    to: recipient,
    subject: NOTIFICATION_SUBJECT,
    body: lines.join("\n"),
  };
}

function parseAmount(value: unknown): number {
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

function parseNullableNumeric(value: unknown): number | undefined {
  if (value == null) {
    return undefined;
  }
  const parsed = parseAmount(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function truncate(text: string, length = 50): string {
  return text.length > length ? text.slice(0, length) : text;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function formatAmount(value: number): string {
  return Math.abs(value).toLocaleString("da-DK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type DbExecutor = Pick<typeof db, "insert" | "update">;

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
      .where(eq(transactionProcessing.transactionId, tx.transactionId));
    return;
  }

  await executor.insert(transactionProcessing).values({
    transactionId: tx.transactionId,
    status,
    ruleApplied: ruleId ?? null,
  });
}
