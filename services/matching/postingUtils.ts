import type { SimpleAccountReportEntry } from "../banking/batchFetchTransactions";
import type { PostingAttachment, PostingLineInput } from "../erp/postingXmlBuilder";

export type PostingTransactionContext = {
  transactionId: string;
  amount: number;
  statusAccount: string;
  payload: SimpleAccountReportEntry | null;
};

export function buildPostingLines(options: {
  transaction: PostingTransactionContext;
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

export function resolvePostingText(
  textTemplate: string | null | undefined,
  tx: PostingTransactionContext,
): string {
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

export function resolveCounterpartyName(tx: PostingTransactionContext): string | undefined {
  const payload = tx.payload;
  if (!payload) {
    return undefined;
  }

  const isOutgoing = tx.amount < 0;
  if (isOutgoing) {
    return (
      payload.creditor?.name ??
      payload.creditorText ??
      payload.creditorMessage ??
      payload.creditor?.id ??
      undefined
    );
  }

  return (
    payload.debtor?.name ??
    payload.debtorText ??
    payload.debtorMessage ??
    payload.debtor?.id ??
    undefined
  );
}

const CPR_REGEX =
  /(((0[1-9]|[12][0-9]|3[01])(0[13578]|10|12)(\d{2}))|(([0][1-9]|[12][0-9]|30)(0[469]|11)(\d{2}))|((0[1-9]|1[0-9]|2[0-8])(02)(\d{2}))|((29)(02)(00))|((29)(02)([2468][048]))|((29)(02)([13579][26])))[-]*\d{4}/gm;

export function extractCprFromTransaction(tx: PostingTransactionContext): string | undefined {
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

function truncate(text: string, length = 50): string {
  return text.length > length ? text.slice(0, length) : text;
}
