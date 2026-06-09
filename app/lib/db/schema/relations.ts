import { relations } from "drizzle-orm";
import {
  rule,
  ruleBankAccount,
  ruleRuleTag,
  ruleBankingCondition,
  ruleAccountingParameters,
  ruleAccountingAttachment,
  erpAccountingDimensionDefinition,
  ruleAccountingDimensionValue,
} from "./rule";
import { ruleTag } from "./ruleTag";
import { document } from "./document";
import { transaction, transactionProcessing } from "./transaction";
import { transactionReference } from "./transactionReference";
import { transactionParty } from "./transactionParty";
import { manualBookingDraft } from "./manualBookingDraft";
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
import { bankingDocument, bankingStatement, bankingStatementBalance } from "./statement";
import { bankingAdapterCursor } from "./bankingAdapterCursor";
import { erpRequest, erpResponse, erpRequestLine } from "./erp";
import { errorLog } from "./error";

export const accountRelations = relations(account, ({ many }) => ({
  rules: many(ruleBankAccount),
  adapterCursors: many(bankingAdapterCursor),
}));

export const ruleRelations = relations(rule, ({ many, one }) => ({
  bankAccounts: many(ruleBankAccount),
  tags: many(ruleRuleTag),
  conditions: many(ruleBankingCondition),
  accountingDimensions: many(ruleAccountingDimensionValue),
  accountingParameters: one(ruleAccountingParameters, {
    fields: [rule.id],
    references: [ruleAccountingParameters.ruleId],
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

export const ruleAccountingParametersRelations = relations(ruleAccountingParameters, ({ one, many }) => ({
  rule: one(rule, { fields: [ruleAccountingParameters.ruleId], references: [rule.id] }),
  attachments: many(ruleAccountingAttachment),
}));

export const ruleAccountingAttachmentRelations = relations(ruleAccountingAttachment, ({ one }) => ({
  parameters: one(ruleAccountingParameters, { fields: [ruleAccountingAttachment.parameterId], references: [ruleAccountingParameters.id] }),
}));

export const ruleAccountingDimensionValueRelations = relations(ruleAccountingDimensionValue, ({ one }) => ({
  rule: one(rule, { fields: [ruleAccountingDimensionValue.ruleId], references: [rule.id] }),
  definition: one(erpAccountingDimensionDefinition, {
    fields: [ruleAccountingDimensionValue.definitionId],
    references: [erpAccountingDimensionDefinition.id],
  }),
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

export const erpRequestRelations = relations(erpRequest, ({ one, many }) => ({
  response: one(erpResponse),
  lines: many(erpRequestLine),
  run: one(run, {
    fields: [erpRequest.runId],
    references: [run.id],
  }),
}));

export const erpRequestLineRelations = relations(erpRequestLine, ({ one }) => ({
  request: one(erpRequest, {
    fields: [erpRequestLine.requestId],
    references: [erpRequest.id],
  }),
  transaction: one(transaction, {
    fields: [erpRequestLine.transactionId],
    references: [transaction.id],
  }),
}));

export const erpResponseRelations = relations(erpResponse, ({ one }) => ({
  request: one(erpRequest, {
    fields: [erpResponse.requestId],
    references: [erpRequest.id],
  }),
}));

export const transactionRelations = relations(transaction, ({ one, many }) => ({
  run: one(run, { fields: [transaction.runId], references: [run.id] }),
  account: one(account, { fields: [transaction.accountId], references: [account.id] }),
  statement: one(bankingStatement, { fields: [transaction.statementId], references: [bankingStatement.id] }),
  processing: one(transactionProcessing, { fields: [transaction.id], references: [transactionProcessing.transactionId] }),
  manualBookingDraft: one(manualBookingDraft, { fields: [transaction.id], references: [manualBookingDraft.transactionId] }),
  references: many(transactionReference),
  parties: many(transactionParty),
}));

export const transactionReferenceRelations = relations(transactionReference, ({ one }) => ({
  transaction: one(transaction, {
    fields: [transactionReference.transactionId],
    references: [transaction.id],
  }),
}));

export const transactionPartyRelations = relations(transactionParty, ({ one }) => ({
  transaction: one(transaction, {
    fields: [transactionParty.transactionId],
    references: [transaction.id],
  }),
}));

export const transactionProcessingRelations = relations(transactionProcessing, ({ one }) => ({
  transaction: one(transaction, { fields: [transactionProcessing.transactionId], references: [transaction.id] }),
  rule: one(rule, { fields: [transactionProcessing.ruleApplied], references: [rule.id] }),
}));

export const bankingPayloadRelations = relations(bankingPayload, ({ many }) => ({
  references: many(bankingReference),
  txCodes: many(bankingTxCode),
  parties: many(bankingParty),
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

export const bankingDocumentRelations = relations(bankingDocument, ({ many, one }) => ({
  account: one(account, { fields: [bankingDocument.accountId], references: [account.id] }),
  statements: many(bankingStatement),
}));

export const bankingStatementRelations = relations(bankingStatement, ({ many, one }) => ({
  document: one(bankingDocument, { fields: [bankingStatement.documentId], references: [bankingDocument.id] }),
  balances: many(bankingStatementBalance),
}));

export const bankingStatementBalanceRelations = relations(bankingStatementBalance, ({ one }) => ({
  statement: one(bankingStatement, { fields: [bankingStatementBalance.statementId], references: [bankingStatement.id] }),
}));

export const bankingAdapterCursorRelations = relations(bankingAdapterCursor, ({ one }) => ({
  account: one(account, {
    fields: [bankingAdapterCursor.accountId],
    references: [account.id],
  }),
}));

export const errorRelations = relations(errorLog, ({ one }) => ({
  run: one(run, { fields: [errorLog.runId], references: [run.id] }),
}));
