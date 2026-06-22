import type { BookingStatus, CprType, CreditDebitIndicator } from "~/lib/db/schema/enums";

export type TransactionReferenceDetail = {
  value: string;
  source: string;
};

export type TransactionSummaryChip = {
  value: string;
  source?: string;
};

export type TransactionSummarySection =
  | {
      key: "part" | "transaktionstype";
      label: string;
      items: Array<{ label: string; value: string; hint?: string }>;
    }
  | {
    key: "reference" | "teknisk";
    label: string;
    chips: TransactionSummaryChip[];
  };

export type TransactionSummary = {
  amount: { label: string; value: string; raw: number };
  bookingDate: { label: string; value: string };
  transactionId: { label: string; value: string };
  direction: "credit" | "debit";
  counterpartRole: string;
  sections: TransactionSummarySection[];
};

export type OpenTransaction = {
  id: string;
  runId: string;
  groupKey: string | null;
  bookingDate: string;
  amount: number;
  accountId: string;
  bankAccountName: string | null;
  status: BookingStatus | null;
  ruleApplied: number | null;
  draftNote?: string | null;
  transactionType: string | null;
  transactionTypeCode?: string | null;
  transactionTypeHint?: string | null;
  counterpart: string | null;
  counterpartHint?: string | null;
  references: string[];
  referenceDetails: TransactionReferenceDetail[];
  summary: TransactionSummary;
};

export type OpenTransactionInput = Omit<OpenTransaction, "summary">;

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
  totalTopTransactions?: number;
};

export type TransactionSummaryInput = {
  id: string;
  runId: string;
  bookingDate: string;
  amount: number;
  transactionType: string | null;
  transactionTypeCode?: string | null;
  transactionTypeHint?: string | null;
  counterpart: string | null;
  counterpartHint?: string | null;
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
  notifyTo?: string | null;
  note?: string | null;
  attachments?: ManualPostingAttachment[];
};

export type StatementTransaction = {
  id: string;
  topStackId?: string;
  runId: string;
  accountId: string | null;
  bankAccountName: string | null;

  statementId: string | null;
  entryIndex: number | null;
  entrySubIndex: number | null;

  amount: string;
  currency: string | null;
  creditDebitIndicator: CreditDebitIndicator | null;
  status: string | null;
  bookingDate: string;
  valueDate: string | null;

  ntryRef: string | null;
  ntryAcctSvcrRef: string | null;
  entryAdditionalInfo: string | null;

  txAcctSvcrRef: string | null;
  refsEndToEndId: string | null;
  refsInstrId: string | null;
  refsPmtInfId: string | null;
  uetr: string | null;
  txAdditionalInfo: string | null;

  bkTxCdDomain: string | null;
  bkTxCdFamily: string | null;
  bkTxCdSubFamily: string | null;
  bkTxCdProprietary: string | null;
  transactionType: string | null;
  transactionTypeCode?: string | null;
  transactionTypeHint?: string | null;

  debtorName: string | null;
  debtorId: string | null;
  debtorAccountIban: string | null;
  creditorName: string | null;
  creditorId: string | null;
  creditorAccountIban: string | null;
  ultimateDebtorName: string | null;
  ultimateCreditorName: string | null;

  remittanceUstrd: string[] | null;
  remittanceCreditorReference: string | null;
  remittanceAdditional: string[] | null;

  processingStatus: BookingStatus | null;
  ruleApplied: number | null;

  // Deterministic running balance computed from statement opening balance + entry order.
  // Present when statementId/entryIndex and OPBD balance exists.
  runningBalance: string | null;
};
