import { relations } from "drizzle-orm";
import { rule, ruleBankAccount, ruleRuleTag, ruleBankingCondition, kmdAccountingParameters, kmdAttachment } from "./rule";
import { ruleTag } from "./ruleTag";
import { document } from "./document";
import { transaction, transactionProcessing } from "./transaction";
import { run } from "./run";
import { account } from "./account";
import {
  BankingRequest,
  BankingResponse,
  bankingPayload,
  bankingReference,
  bankingTxCode,
  bankingParty,
} from "./banking";
import { erpRequest, erpResponse } from "./erp";
import { errorLog } from "./error";

export const ruleRelations = relations(rule, ({ many, one }) => ({
  bankAccounts: many(ruleBankAccount),
  tags: many(ruleRuleTag),
  conditions: many(ruleBankingCondition),
  accountingParameters: one(kmdAccountingParameters, {
    fields: [rule.id],
    references: [kmdAccountingParameters.ruleId],
  }),
}));

export const ruleBankAccountRelations = relations(ruleBankAccount, ({ one }) => ({
  rule: one(rule, { fields: [ruleBankAccount.ruleId], references: [rule.id] }),
  account: one(account, { fields: [ruleBankAccount.bankAccountId], references: [account.id] }),
}));

export const ruleRuleTagRelations = relations(ruleRuleTag, ({ one }) => ({
  rule: one(rule, { fields: [ruleRuleTag.ruleId], references: [rule.id] }),
  tag: one(ruleTag, { fields: [ruleRuleTag.ruleTagId], references: [ruleTag.id] }),
}));

export const ruleBankingConditionRelations = relations(ruleBankingCondition, ({ one }) => ({
  rule: one(rule, { fields: [ruleBankingCondition.ruleId], references: [rule.id] }),
}));

export const kmdAccountingParametersRelations = relations(kmdAccountingParameters, ({ one, many }) => ({
  rule: one(rule, { fields: [kmdAccountingParameters.ruleId], references: [rule.id] }),
  attachments: many(kmdAttachment),
}));

export const kmdAttachmentRelations = relations(kmdAttachment, ({ one }) => ({
  parameters: one(kmdAccountingParameters, { fields: [kmdAttachment.parameterId], references: [kmdAccountingParameters.id] }),
}));

export const runRelations = relations(run, ({ many }) => ({
  transactions: many(transaction),
  documents: many(document),
  bankingRequests: many(BankingRequest),
  erpRequests: many(erpRequest),
  errors: many(errorLog),
}));

export const bankingRequestRelations = relations(BankingRequest, ({ one }) => ({
  response: one(BankingResponse),
  run: one(run, {
    fields: [BankingRequest.runId],
    references: [run.id],
  }),
}));

export const bankingResponseRelations = relations(BankingResponse, ({ one }) => ({
  request: one(BankingRequest, {
    fields: [BankingResponse.requestId],
    references: [BankingRequest.id],
  }),
}));

export const erpRequestRelations = relations(erpRequest, ({ one }) => ({
  response: one(erpResponse),
  run: one(run, {
    fields: [erpRequest.runId],
    references: [run.id],
  }),
}));

export const erpResponseRelations = relations(erpResponse, ({ one }) => ({
  request: one(erpRequest, {
    fields: [erpResponse.requestId],
    references: [erpRequest.id],
  }),
}));

export const transactionRelations = relations(transaction, ({ one }) => ({
  run: one(run, { fields: [transaction.runId], references: [run.id] }),
  payload: one(bankingPayload, { fields: [transaction.payloadId], references: [bankingPayload.id] }),
  processing: one(transactionProcessing, { fields: [transaction.id], references: [transactionProcessing.transactionId] }),
}));

export const transactionProcessingRelations = relations(transactionProcessing, ({ one }) => ({
  transaction: one(transaction, { fields: [transactionProcessing.transactionId], references: [transaction.id] }),
  rule: one(rule, { fields: [transactionProcessing.ruleApplied], references: [rule.id] }),
}));

export const bankingPayloadRelations = relations(bankingPayload, ({ many }) => ({
  references: many(bankingReference),
  txCodes: many(bankingTxCode),
  parties: many(bankingParty),
  transactions: many(transaction),
}));

export const bankingReferenceRelations = relations(bankingReference, ({ one }) => ({
  payload: one(bankingPayload, { fields: [bankingReference.payloadId], references: [bankingPayload.id] }),
}));

export const bankingTxCodeRelations = relations(bankingTxCode, ({ one }) => ({
  payload: one(bankingPayload, { fields: [bankingTxCode.payloadId], references: [bankingPayload.id] }),
}));

export const bankingPartyRelations = relations(bankingParty, ({ one }) => ({
  payload: one(bankingPayload, { fields: [bankingParty.payloadId], references: [bankingPayload.id] }),
}));

export const errorRelations = relations(errorLog, ({ one }) => ({
  run: one(run, { fields: [errorLog.runId], references: [run.id] }),
}));
