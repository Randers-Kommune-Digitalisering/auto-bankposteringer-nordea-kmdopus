import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { pgTable, text, uuid, integer, primaryKey } from "drizzle-orm/pg-core";
import { run } from "./run";
import { transaction } from "./transaction";

export const erpRequest = pgTable("erp_request", {
  id: text().primaryKey(),
  runId: uuid("run_id").notNull().references(() => run.id),
  payload: text("payload"),
});

export const erpResponse = pgTable("erp_response", {
  id: text().primaryKey(),
  requestId: text("request_id").references(() => erpRequest.id).unique(),
  statusText: text("status_text"),
  payload: text("payload"),
});

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
  },
  (table) => ([
    primaryKey({ columns: [table.requestId, table.lineNo] }),
  ]),
);

export const erpRequestInsertSchema = createInsertSchema(erpRequest);
export type ErpRequestInsertSchema = z.infer<typeof erpRequestInsertSchema>;

export const erpResponseInsertSchema = createInsertSchema(erpResponse);
export const erpResponseSelectSchema = createSelectSchema(erpResponse);
export type ErpResponseInsertSchema = z.infer<typeof erpResponseInsertSchema>;
export type ErpResponseSelectSchema = z.infer<typeof erpResponseSelectSchema>;

export const erpRequestLineInsertSchema = createInsertSchema(erpRequestLine);
export const erpRequestLineSelectSchema = createSelectSchema(erpRequestLine);

export type ErpRequestLineInsertSchema = z.infer<typeof erpRequestLineInsertSchema>;
export type ErpRequestLineSelectSchema = z.infer<typeof erpRequestLineSelectSchema>;
