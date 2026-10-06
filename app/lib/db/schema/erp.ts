import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { pgTable, text, uuid, integer, numeric, jsonb, primaryKey, index } from "drizzle-orm/pg-core";
import { run } from "./run";
import { transaction } from "./transaction";

export const erpRequest = pgTable("erp_request", {
  id: text().primaryKey(),
  runId: uuid("run_id").notNull().references(() => run.id),
  documentId: text("document_id").references(() => erpDocument.id),
  filename: text().unique(),
  payload: text("payload"),
}, (t) => ({
  runIdIdx: index('erp_request_run_id_idx').on(t.runId),
  documentIdIdx: index('erp_request_document_id_idx').on(t.documentId),
}));

export const erpDocument = pgTable("erp_document", {
  id: text().primaryKey(),
  runId: uuid("run_id").notNull().references(() => run.id),
}, (t) => ({
  runIdIdx: index('erp_document_run_id_idx').on(t.runId),
}));

export const erpResponse = pgTable("erp_response", {
  id: text().primaryKey(),
  requestId: text("request_id").references(() => erpRequest.id).unique(),
  statusText: text("status_text"),
  payload: text("payload"),
});

export const erpResponseDocument = pgTable(
  "erp_response_document",
  {
    responseId: text("response_id").notNull().references(() => erpResponse.id, { onDelete: 'cascade' }),
    documentId: text("document_id").notNull().references(() => erpDocument.id),
    status: text().notNull(),
    messages: jsonb().$type<Array<{ type: string; number: string; text: string }>>().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.responseId, table.documentId] }),
    index('erp_response_document_document_id_idx').on(table.documentId),
  ],
);

/**
 * Line-level linkage from an ERP request to originating transactions.
 * Enables granular recovery and auditing without parsing ERP XML.
 */
export const erpRequestLine = pgTable(
  "erp_request_line",
  {
    requestId: text("request_id").notNull().references(() => erpRequest.id, { onDelete: 'cascade' }),
    lineNo: integer("line_no").notNull(),
    transactionId: uuid("transaction_id").references(() => transaction.id),
    amount: numeric("amount"),
    debetOrCredit: text("debet_or_credit"),
    dimensions: jsonb("dimensions").$type<Record<string, string>>(),
    postingText: text("posting_text"),
    cpr: text("cpr"),
  },
  (table) => ([
    primaryKey({ columns: [table.requestId, table.lineNo] }),
    index('erp_request_line_transaction_id_idx').on(table.transactionId),
  ]),
);