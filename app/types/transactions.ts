import type { BookingStatus, CprType, CreditDebitIndicator } from "~/lib/db/schema/enums";

export type TransactionReferenceDetail = {
  value: string;
  source: string;
};

export type TransactionSummaryField = {
  label: string;
  value: string;
  sourcePath?: string;
};

export type TransactionSummarySection = {
  key: "part" | "reference" | "transaktionstype";
  label: string;
  fields: TransactionSummaryField[];
};

export type TransactionSummary = {
  amount: { label: string; value: string; raw: number };
  bookingDate: { label: string; value: string };
  transactionId: { label: string; value: string };
  direction: "credit" | "debit";
  sections: TransactionSummarySection[];
};

export type OpenTransaction = {
  id: string;
  runId: string;
  groupKey: string | null;
  bookingDate: string;
  amount: number;
  underlyingTransactionCount: number;
  accountId: string;
  bankAccountName: string | null;
  status: BookingStatus | null;
  ruleApplied: number | null;
  draftNote?: string | null;
  groupDraftNote?: string | null;
  transactionType: string | null;
  transactionTypeCode?: string | null;
  transactionTypeHint?: string | null;
  counterpart: string | null;
  counterpartHint?: string | null;
  counterpartSource?: string | null;
  references: string[];
  referenceDetails: TransactionReferenceDetail[];
  summary: TransactionSummary;
};

export type OpenTransactionInput = Omit<OpenTransaction, "summary">;

export type StackedTransactionsTableRow = {
  stackId: string;
  lineCount: number;
  category: "Samlepost" | "Enkeltpost";
  [key: string]: unknown;
};

export type OpenTransactionStack = {
  stackId: string;
  groupKey: string | null;
  items: OpenTransaction[];
  representative: OpenTransaction;
  totalAmount: number;
  isGrouped: boolean;
};

export type OpenTransactionsResponse = {
  items: OpenTransaction[];
  stacks?: OpenTransactionStack[];
  groupedStacksByAccount?: Record<string, OpenTransactionStack[]>;
  total: number;
  limit: number;
  totalSamleposter?: number;
  // Deprecated migration alias.
  totalTopTransactions?: number;

};

export type TransactionSummaryInput = {
  id: string;
  runId: string;
  bookingDate: string;
  amount: number;
  underlyingTransactionCount?: number;
  transactionType: string | null;
  transactionTypeCode?: string | null;
  transactionTypeHint?: string | null;
  counterpart: string | null;
  counterpartHint?: string | null;
  counterpartSource?: string | null;
  references: string[];
  referenceDetails: TransactionReferenceDetail[];
};

export type ManualPostingAttachment = {
  name: string;
  type: string;
  data: string;
};

export type ManualBookingPayload = {
  lines: Array<{
    amount: number;
    dimensions?: Array<{ key: string; value: string }>;
    text?: string | null;
  }>;
  text?: string | null;
  cprType: CprType;
  cprNumber?: string | null;
  note?: string | null;
  attachments?: ManualPostingAttachment[];
};

export type StatementTransaction = {
  id: string;
  samlepostId?: string;

  runId: string;
  accountId: string | null;
  bankAccountName: string | null;

  statementId: string | null;
  entryIndex: number | null;
  underlyingTransactionCount: number;

  amount: string;
  currency: string | null;
  creditDebitIndicator: CreditDebitIndicator | null;
  status: string | null;
  bookingDate: string;
  valueDate: string | null;

  ntryRef: string | null;
  ntryAcctSvcrRef: string | null;
  entryAdditionalInfo: string | null;

  bkTxCdDomain: string | null;
  bkTxCdFamily: string | null;
  bkTxCdSubFamily: string | null;
  bkTxCdProprietary: string | null;
  transactionType: string | null;
  transactionTypeCode?: string | null;
  transactionTypeHint?: string | null;
  postingText?: string | null;
  counterpart?: string | null;
  counterpartHint?: string | null;
  counterpartSource?: string | null;
  referenceDetails?: TransactionReferenceDetail[];
  summary: TransactionSummary;

  processingStatus: BookingStatus | null;
  ruleApplied: number | null;

  // Deterministic running balance computed from statement opening balance + entry order.
  // Present when statementId/entryIndex and OPBD balance exists.
  runningBalance: string | null;
};
