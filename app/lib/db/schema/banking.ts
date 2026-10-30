import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { pgTable, uuid, json, text, integer } from "drizzle-orm/pg-core";
import { run } from "./run";

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

export const bankingRequestInsertSchema = createInsertSchema(BankingRequest);
export type BankingRequestInsertSchema = z.infer<typeof bankingRequestInsertSchema>;

export const bankingResponseInsertSchema = createInsertSchema(BankingResponse);
export type BankingResponseInsertSchema = z.infer<typeof bankingResponseInsertSchema>;
