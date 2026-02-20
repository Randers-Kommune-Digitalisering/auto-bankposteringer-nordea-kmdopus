import type { BookingStatus, CprType } from "~/lib/db/schema";

export type TransactionSummarySection =
  | {
      key: "part" | "transaktionstype";
      label: string;
      items: Array<{ label: string; value: string }>;
    }
  | {
    key: "fritekst";
    label: string;
    chips: string[];
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
  bookingDate: string;
  amount: number;
  accountId: string;
  bankAccountName: string | null;
  status: BookingStatus | null;
  ruleApplied: number | null;
  transactionType: string | null;
  counterpart: string | null;
  references: string[];
  summary: TransactionSummary;
};

export type OpenTransactionInput = Omit<OpenTransaction, "summary">;

export type TransactionSummaryInput = {
  id: string;
  runId: string;
  bookingDate: string;
  amount: number;
  transactionType: string | null;
  counterpart: string | null;
  references: string[];
};

export type ManualPostingAttachment = {
  name: string;
  type: string;
  data: string;
};

export type ManualBookingPayload = {
  primaryAccount: string;
  secondaryAccount?: string | null;
  tertiaryAccount?: string | null;
  text?: string | null;
  cprType: CprType;
  cprNumber?: string | null;
  notifyTo?: string | null;
  note?: string | null;
  attachments?: ManualPostingAttachment[];
};
