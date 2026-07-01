import { pgEnum } from "drizzle-orm/pg-core";

export const bankingDocumentFormatValues = ['camt053', 'unknown'] as const
export const bankingDocumentFormatEnum = pgEnum('banking_document_format', bankingDocumentFormatValues)
export type BankingDocumentFormat = typeof bankingDocumentFormatValues[number]

export const creditDebitIndicatorValues = ['CRDT', 'DBIT'] as const
export const creditDebitIndicatorEnum = pgEnum('credit_debit_indicator', creditDebitIndicatorValues)
export type CreditDebitIndicator = typeof creditDebitIndicatorValues[number]

export const ruleConditionOperatorValues = ['eq', 'neq', 'like', 'ilike', 'regex', 'gt', 'gte', 'lt', 'lte', 'in'] as const
export const ruleConditionOperatorEnum = pgEnum('rule_condition_operator', ruleConditionOperatorValues)
export type RuleConditionOperator = typeof ruleConditionOperatorValues[number]

// NOTE: This enum is intentionally CAMT.053-specific.
// It is used both in DB (rule_banking_condition.field) and in the UI match catalog.
export const ruleConditionFieldValues = [
	// References (ISO20022: Refs)
	'ntry_ref',
	'ntry_acct_svcr_ref',
	'tx_acct_svcr_ref',
	'refs_end_to_end_id',
	'refs_instr_id',
	'refs_pmt_inf_id',
	'uetr',

	// Parties (ISO20022: RltdPties)
	'dbtr_name',
	'dbtr_id',
	'dbtr_acct_iban',
	'cdtr_name',
	'cdtr_id',
	'cdtr_acct_iban',
	'ultmt_dbtr_name',
	'ultmt_cdtr_name',

	// Transaction type / classification (ISO20022: BkTxCd)
	'bk_tx_cd_domain',
	'bk_tx_cd_family',
	'bk_tx_cd_sub_family',
	'bk_tx_cd_proprietary',
	'cdt_dbt_ind',

	// Text / remittance
	'entry_additional_info',
	'tx_additional_info',
	'rmt_ustrd',
	'rmt_cdtr_ref',
	'rmt_addtl',
] as const
export const ruleConditionFieldEnum = pgEnum('rule_condition_field', ruleConditionFieldValues)
export type RuleConditionField = typeof ruleConditionFieldValues[number]

export const ruleStatusValues = ['aktiv', 'inaktiv'] as const
export const ruleStatusEnum = pgEnum('rule_status', ruleStatusValues)
export type RuleStatus = typeof ruleStatusValues[number]

export const ruleTypeValues = ['standard', 'undtagelse', 'engangs'] as const
export const ruleTypeEnum = pgEnum('rule_type', ruleTypeValues)
export type RuleType = typeof ruleTypeValues[number]

export const runErrorSourceValues = ['banking', 'application', 'erp'] as const
export const runErrorSourceEnum = pgEnum('run_error_source', runErrorSourceValues)
export type RunErrorSource = typeof runErrorSourceValues[number]

export const cprTypeValues = ['ingen', 'statisk', 'dynamisk'] as const
export const cprTypeEnum = pgEnum('cpr_type', cprTypeValues)
export type CprType = typeof cprTypeValues[number]

export const runStatusValues = ['afventer', 'indlæser', 'udført', 'fejl'] as const
export const runStatusEnum = pgEnum('run_status', runStatusValues)
export type RunStatus = typeof runStatusValues[number]

export const documentTypeValues = ['postering', 'afstemning'] as const
export const documentTypeEnum = pgEnum('document_type', documentTypeValues)
export type DocumentType = typeof documentTypeValues[number]

export const erpSupplierValues = ['kmd', 'andet'] as const
export const erpSupplierEnum = pgEnum('erp_supplier', erpSupplierValues)
export type ErpSupplier = typeof erpSupplierValues[number]

export const bookingStatusValues = ['åben', 'bogført', 'undtaget'] as const
export const bookingStatusEnum = pgEnum('booking_status', bookingStatusValues)
export type BookingStatus = typeof bookingStatusValues[number]

export const jobStatusValues = ['pending', 'in_progress', 'succeeded', 'failed'] as const
export const jobStatusEnum = pgEnum('job_status', jobStatusValues)
export type JobStatus = typeof jobStatusValues[number]

export const bankingAgreementDiscoveryStatusValues = ['started', 'running', 'completed', 'failed'] as const
export const bankingAgreementDiscoveryStatusEnum = pgEnum('banking_agreement_discovery_status', bankingAgreementDiscoveryStatusValues)
export type BankingAgreementDiscoveryStatus = typeof bankingAgreementDiscoveryStatusValues[number]

export const outboxStatusValues = ['pending', 'processing', 'sent', 'failed'] as const
export const outboxStatusEnum = pgEnum('outbox_status', outboxStatusValues)
export type OutboxStatus = typeof outboxStatusValues[number]

export const transactionReferenceTypeValues = ['reference', 'freetext', 'technical', 'remittance'] as const
export const transactionReferenceTypeEnum = pgEnum('transaction_reference_type', transactionReferenceTypeValues)
export type TransactionReferenceType = typeof transactionReferenceTypeValues[number]

export const transactionSourceScopeValues = ['entry', 'tx', 'remittance', 'party'] as const
export const transactionSourceScopeEnum = pgEnum('transaction_source_scope', transactionSourceScopeValues)
export type TransactionSourceScope = typeof transactionSourceScopeValues[number]

export const transactionPartyRoleValues = ['debtor', 'creditor', 'ultimateDebtor', 'ultimateCreditor'] as const
export const transactionPartyRoleEnum = pgEnum('transaction_party_role', transactionPartyRoleValues)
export type TransactionPartyRole = typeof transactionPartyRoleValues[number]
