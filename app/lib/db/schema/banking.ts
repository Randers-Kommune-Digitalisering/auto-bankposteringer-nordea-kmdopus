import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { pgTable, uuid, json, text, integer } from "drizzle-orm/pg-core";
import { run } from "./run";

export const bankingPayload = pgTable("banking_payload", {
  id: uuid().defaultRandom().primaryKey(),
  raw: json("raw").notNull(),
});

export const bankingReference = pgTable("banking_reference", {
  id: uuid().defaultRandom().primaryKey(),
  payloadId: uuid("payload_id").references(() => bankingPayload.id),
  text: text("text"),
  primaryReference: text("primary_reference"),
  bankingId: text("banking_id"),
  batch: text("batch"),
  endToEndId: text("end_to_end_id"),
  ocrReference: text("ocr_reference"),
  debtorsPaymentId: text("debtors_payment_id"),
  debtorText: text("debtor_text"),
  debtorMessage: text("debtor_message"),
  creditorText: text("creditor_text"),
  creditorMessage: text("creditor_message"),
});

export const bankingParty = pgTable("banking_party", {
  id: uuid().defaultRandom().primaryKey(),
  payloadId: uuid("payload_id").references(() => bankingPayload.id),
  debtorId: text("debtor_id"),
  debtorName: text("debtor_name"),
  creditorId: text("creditor_id"),
  creditorName: text("creditor_name"),
});

export const bankingTxCode = pgTable("banking_tx_code", {
  id: uuid().defaultRandom().primaryKey(),
  payloadId: uuid("payload_id").references(() => bankingPayload.id),
  type: text("type"),
  domain: text("domain"),
  family: text("family"),
  subFamily: text("sub_family"),
});

export const BankingRequest = pgTable("banking_request", {
  id: text().primaryKey(),
  runId: uuid("run_id").notNull().references(() => run.id),
  payload: json(),
});

export const BankingResponse = pgTable("banking_response", {
  id: text().primaryKey(),
  requestId: text("request_id").references(() => BankingRequest.id).unique(),
  statusCode: integer("status_code"),
  statusText: text("status_text"),
});

export const bankingPayloadInsertSchema = createInsertSchema(bankingPayload);
export const bankingPayloadSelectSchema = createSelectSchema(bankingPayload);
export type BankingPayloadInsertSchema = z.infer<typeof bankingPayloadInsertSchema>;
export type BankingPayloadSelectSchema = z.infer<typeof bankingPayloadSelectSchema>;

export const bankingReferenceInsertSchema = createInsertSchema(bankingReference);
export const bankingReferenceSelectSchema = createSelectSchema(bankingReference);
export type BankingReferenceInsertSchema = z.infer<typeof bankingReferenceInsertSchema>;
export type BankingReferenceSelectSchema = z.infer<typeof bankingReferenceSelectSchema>;

export const bankingPartyInsertSchema = createInsertSchema(bankingParty);
export const bankingPartySelectSchema = createSelectSchema(bankingParty);
export type BankingPartyInsertSchema = z.infer<typeof bankingPartyInsertSchema>;
export type BankingPartySelectSchema = z.infer<typeof bankingPartySelectSchema>;

export const bankingTxCodeInsertSchema = createInsertSchema(bankingTxCode);
export const bankingTxCodeSelectSchema = createSelectSchema(bankingTxCode);
export type BankingTxCodeInsertSchema = z.infer<typeof bankingTxCodeInsertSchema>;
export type BankingTxCodeSelectSchema = z.infer<typeof bankingTxCodeSelectSchema>;

export const bankingRequestInsertSchema = createInsertSchema(BankingRequest);
export type BankingRequestInsertSchema = z.infer<typeof bankingRequestInsertSchema>;

export const bankingResponseInsertSchema = createInsertSchema(BankingResponse);
export type BankingResponseInsertSchema = z.infer<typeof bankingResponseInsertSchema>;
