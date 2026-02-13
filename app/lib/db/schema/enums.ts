import { pgEnum } from "drizzle-orm/pg-core";

export const ruleConditionOperatorValues = ['eq', 'neq', 'like', 'ilike', 'gt', 'gte', 'lt', 'lte', 'in'] as const
export const ruleConditionOperatorEnum = pgEnum('rule_condition_operator', ruleConditionOperatorValues)
export type RuleConditionOperator = typeof ruleConditionOperatorValues[number]

export const ruleConditionFieldValues = ['id', 'end_to_end_id', 'ocr_reference', 'text', 'batch', 'debtor_text', 'debtor_message', 'debtors_payment_id', 'creditor_text', 'creditor_message', 'primary_reference', 'type', 'tx_code_domain', 'tx_code_family', 'tx_code_sub_family', 'debtor_name', 'debtor_id', 'creditor_name', 'creditor_id'] as const
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
