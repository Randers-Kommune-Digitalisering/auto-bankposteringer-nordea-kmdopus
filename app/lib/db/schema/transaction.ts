import { z } from "zod"
import { pgTable, uuid, text, numeric, date, integer, unique } from "drizzle-orm/pg-core"
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { account } from "./account"
import { run } from "./run"
import { bookingStatusEnum, creditDebitIndicatorEnum } from "./enums"
import { rule } from "./rule"
import { bankingStatement } from "./statement"

export const transaction = pgTable('transaction', {
  id: uuid().defaultRandom().primaryKey(),
  runId: uuid('run_id').notNull().references(() => run.id),
  accountId: text('account').references(() => account.id),

  // Source linkage (CAMT.053: Document -> Statement -> Entry)
  statementId: uuid('statement_id').references(() => bankingStatement.id),
  entryIndex: integer('entry_index'),
  entrySubIndex: integer('entry_sub_index'),

  // Entry core
  amount: numeric('amount').notNull(),
  currency: text('currency'),
  creditDebitIndicator: creditDebitIndicatorEnum('credit_debit_indicator'), // CAMT: CdtDbtInd
  status: text('status'), // CAMT: Sts (e.g. BOOK)
  bookingDate: date('booking_date', { mode: "date" }).notNull(),
  valueDate: date('value_date', { mode: "date" }),

  // Entry references
  ntryRef: text('ntry_ref'),
  ntryAcctSvcrRef: text('ntry_acct_svcr_ref'),
  entryAdditionalInfo: text('entry_additional_info'), // CAMT: AddtlNtryInf

  // Transaction details references (TxDtls/Refs)
  txAcctSvcrRef: text('tx_acct_svcr_ref'),
  refsEndToEndId: text('refs_end_to_end_id'),
  refsInstrId: text('refs_instr_id'),
  refsPmtInfId: text('refs_pmt_inf_id'),
  uetr: text('uetr'),
  txAdditionalInfo: text('tx_additional_info'),

  // Bank transaction code (BkTxCd)
  bkTxCdDomain: text('bk_tx_cd_domain'),
  bkTxCdFamily: text('bk_tx_cd_family'),
  bkTxCdSubFamily: text('bk_tx_cd_sub_family'),
  bkTxCdProprietary: text('bk_tx_cd_proprietary'),

  // Related parties (RltdPties)
  debtorName: text('dbtr_name'),
  debtorId: text('dbtr_id'),
  debtorAccountIban: text('dbtr_acct_iban'),
  creditorName: text('cdtr_name'),
  creditorId: text('cdtr_id'),
  creditorAccountIban: text('cdtr_acct_iban'),
  ultimateDebtorName: text('ultmt_dbtr_name'),
  ultimateCreditorName: text('ultmt_cdtr_name'),

  // Remittance information (RmtInf)
  remittanceUstrd: text('rmt_ustrd').array(),
  remittanceCreditorReference: text('rmt_cdtr_ref'),
  remittanceAdditional: text('rmt_addtl').array(),
}, (t) => ({
  statementEntryUnique: unique('transaction_statement_entry_unique').on(t.statementId, t.entryIndex, t.entrySubIndex),
}))

export const transactionSelectSchema = createSelectSchema(transaction)
export const transactionInsertSchema = createInsertSchema(transaction)

export type TransactionSelectSchema = z.infer<typeof transactionSelectSchema>
export type TransactionInsertSchema = z.infer<typeof transactionInsertSchema>

export const transactionProcessing = pgTable('transaction_processing', {
  transactionId: uuid('transaction_id').primaryKey().references(() => transaction.id),
  status: bookingStatusEnum('status'),
  ruleApplied: integer('rule_applied').references(() => rule.id),
  lockedAt: date('locked_at', { mode: "date" }),
  lockedBy: text('locked_by'),
})

export const transactionProcessingInsertSchema = createInsertSchema(transactionProcessing)
export const transactionProcessingUpdateSchema = createUpdateSchema(transactionProcessing)
export const transactionProcessingSelectSchema = createSelectSchema(transactionProcessing)

export type TransactionProcessingInsertSchema = z.infer<typeof transactionProcessingInsertSchema>
export type TransactionProcessingUpdateSchema = z.infer<typeof transactionProcessingUpdateSchema>
export type TransactionProcessingSelectSchema = z.infer<typeof transactionProcessingSelectSchema>
