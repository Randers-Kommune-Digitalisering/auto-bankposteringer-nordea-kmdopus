CREATE TYPE "public"."bank_provider" AS ENUM('danskebank', 'nordea', 'bankconnect');--> statement-breakpoint
CREATE TYPE "public"."accounting_dimension_constraint_kind" AS ENUM('requires_any_of', 'requires_all_of', 'requires_exactly_one_of', 'forbids_any_of');--> statement-breakpoint
CREATE TYPE "public"."bank_channel" AS ENUM('iso20022', 'rest');--> statement-breakpoint
CREATE TYPE "public"."banking_agreement_discovery_status" AS ENUM('started', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."banking_document_format" AS ENUM('camt053', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('åben', 'bogført', 'undtaget');--> statement-breakpoint
CREATE TYPE "public"."cpr_type" AS ENUM('ingen', 'statisk', 'dynamisk');--> statement-breakpoint
CREATE TYPE "public"."credit_debit_indicator" AS ENUM('CRDT', 'DBIT');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('postering', 'afstemning');--> statement-breakpoint
CREATE TYPE "public"."erp_supplier" AS ENUM('kmd', 'andet');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'in_progress', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'processing', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."rule_condition_field" AS ENUM('ntry_ref', 'ntry_acct_svcr_ref', 'tx_acct_svcr_ref', 'refs_end_to_end_id', 'refs_instr_id', 'refs_pmt_inf_id', 'uetr', 'dbtr_name', 'dbtr_id', 'dbtr_acct_iban', 'cdtr_name', 'cdtr_id', 'cdtr_acct_iban', 'ultmt_dbtr_name', 'ultmt_cdtr_name', 'bk_tx_cd_domain', 'bk_tx_cd_family', 'bk_tx_cd_sub_family', 'bk_tx_cd_proprietary', 'cdt_dbt_ind', 'entry_additional_info', 'tx_additional_info', 'rmt_ustrd', 'rmt_cdtr_ref', 'rmt_addtl');--> statement-breakpoint
CREATE TYPE "public"."rule_condition_operator" AS ENUM('eq', 'neq', 'like', 'ilike', 'regex', 'gt', 'gte', 'lt', 'lte', 'in');--> statement-breakpoint
CREATE TYPE "public"."rule_status" AS ENUM('aktiv', 'inaktiv');--> statement-breakpoint
CREATE TYPE "public"."rule_type" AS ENUM('standard', 'undtagelse', 'engangs');--> statement-breakpoint
CREATE TYPE "public"."run_error_source" AS ENUM('banking', 'application', 'erp');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('afventer', 'indlæser', 'udført', 'fejl');--> statement-breakpoint
CREATE TYPE "public"."transaction_party_role" AS ENUM('debtor', 'creditor', 'ultimateDebtor', 'ultimateCreditor');--> statement-breakpoint
CREATE TYPE "public"."transaction_reference_type" AS ENUM('reference', 'freetext', 'technical', 'remittance');--> statement-breakpoint
CREATE TYPE "public"."transaction_source_scope" AS ENUM('entry', 'tx', 'remittance', 'party');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"provider" "bank_provider" NOT NULL,
	"iban" text NOT NULL,
	"currency" text
);
--> statement-breakpoint
CREATE TABLE "erp_accounting_dimension_constraint" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"erp_supplier" "erp_supplier" NOT NULL,
	"if_key" text NOT NULL,
	"kind" "accounting_dimension_constraint_kind" NOT NULL,
	"if_value_regex" text,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	CONSTRAINT "erp_accounting_dimension_constraint_supplier_if_kind_unique" UNIQUE("erp_supplier","if_key","kind","if_value_regex")
);
--> statement-breakpoint
CREATE TABLE "erp_accounting_dimension_constraint_member" (
	"constraint_id" uuid NOT NULL,
	"key" text NOT NULL,
	CONSTRAINT "erp_accounting_dimension_constraint_member_constraint_id_key_pk" PRIMARY KEY("constraint_id","key")
);
--> statement-breakpoint
CREATE TABLE "banking_request" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" uuid NOT NULL,
	"payload" json
);
--> statement-breakpoint
CREATE TABLE "banking_response" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text,
	"status_code" integer,
	"status_text" text,
	CONSTRAINT "banking_response_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "banking_party" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payload_id" uuid,
	"debtor_id" text,
	"debtor_name" text,
	"creditor_id" text,
	"creditor_name" text
);
--> statement-breakpoint
CREATE TABLE "banking_payload" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raw" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banking_reference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payload_id" uuid,
	"text" text,
	"primary_reference" text,
	"banking_id" text,
	"batch" text,
	"end_to_end_id" text,
	"ocr_reference" text,
	"debtors_payment_id" text,
	"debtor_text" text,
	"debtor_message" text,
	"creditor_text" text,
	"creditor_message" text
);
--> statement-breakpoint
CREATE TABLE "banking_tx_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payload_id" uuid,
	"type" text,
	"domain" text,
	"family" text,
	"sub_family" text
);
--> statement-breakpoint
CREATE TABLE "banking_adapter_cursor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"adapter_key" text NOT NULL,
	"cursor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "banking_adapter_cursor_account_adapter_unique" UNIQUE("account_id","adapter_key")
);
--> statement-breakpoint
CREATE TABLE "banking_agreement" (
	"provider" "bank_provider" PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"channel" "bank_channel" DEFAULT 'iso20022' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banking_agreement_account_allowlist" (
	"provider" "bank_provider" NOT NULL,
	"iban" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "banking_agreement_account_allowlist_provider_iban_pk" PRIMARY KEY("provider","iban")
);
--> statement-breakpoint
CREATE TABLE "banking_agreement_account_dimension" (
	"provider" "bank_provider" NOT NULL,
	"iban" text NOT NULL,
	"dimension_key" text NOT NULL,
	"dimension_value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "banking_agreement_account_dimension_provider_iban_dimension_key_pk" PRIMARY KEY("provider","iban","dimension_key")
);
--> statement-breakpoint
CREATE TABLE "banking_agreement_cursor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "bank_provider" NOT NULL,
	"adapter_key" text NOT NULL,
	"cursor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "banking_agreement_cursor_provider_adapter_unique" UNIQUE("provider","adapter_key")
);
--> statement-breakpoint
CREATE TABLE "banking_agreement_discovery_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "bank_provider" NOT NULL,
	"channel" "bank_channel" NOT NULL,
	"status" "banking_agreement_discovery_status" DEFAULT 'started' NOT NULL,
	"job_id" uuid,
	"trigger_source" text DEFAULT 'agreement_activation' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"discovered_accounts" integer DEFAULT 0 NOT NULL,
	"inspected_documents" integer DEFAULT 0 NOT NULL,
	"skipped_days" integer DEFAULT 0 NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"type" "document_type",
	"content" text NOT NULL,
	"filename" text NOT NULL,
	"file_extension" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp_request" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" uuid NOT NULL,
	"payload" text
);
--> statement-breakpoint
CREATE TABLE "erp_request_line" (
	"request_id" text NOT NULL,
	"line_no" integer NOT NULL,
	"transaction_id" uuid,
	CONSTRAINT "erp_request_line_request_id_line_no_pk" PRIMARY KEY("request_id","line_no")
);
--> statement-breakpoint
CREATE TABLE "erp_response" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text,
	"status_text" text,
	"payload" text,
	CONSTRAINT "erp_response_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "error" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid,
	"source" "run_error_source",
	"error_code" integer,
	"error_string" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"run_id" uuid,
	"payload" jsonb NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 10 NOT NULL,
	"run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manual_booking_draft" (
	"transaction_id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"text" text,
	"cpr_type" "cpr_type" NOT NULL,
	"cpr_number" text,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "manual_booking_draft_attachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"sort_order" integer NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"data" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manual_booking_draft_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"sort_order" integer NOT NULL,
	"amount" numeric NOT NULL,
	"text" text
);
--> statement-breakpoint
CREATE TABLE "manual_booking_draft_line_dimension" (
	"line_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "manual_booking_draft_line_dimension_line_id_key_pk" PRIMARY KEY("line_id","key")
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic" text NOT NULL,
	"status" "outbox_status" DEFAULT 'pending' NOT NULL,
	"run_id" uuid,
	"dedupe_key" text,
	"payload" jsonb NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "outbox_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "erp_accounting_dimension_definition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"erp_supplier" "erp_supplier" NOT NULL,
	"key" text NOT NULL,
	"value_regex" text,
	"value_regex_flags" text,
	"erp_target" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	CONSTRAINT "erp_accounting_dimension_definition_supplier_key_unique" UNIQUE("erp_supplier","key")
);
--> statement-breakpoint
CREATE TABLE "rule" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "rule_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"last_used" date,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"locked_at" date,
	"locked_by" text,
	"active_from" date,
	"active_to" date,
	"current_version_id" bigint NOT NULL,
	"erp_supplier" "erp_supplier" NOT NULL,
	"rule_type" "rule_type",
	"rule_status" "rule_status",
	"amount_min" numeric,
	"amount_max" numeric
);
--> statement-breakpoint
CREATE TABLE "kmd_attachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parameter_id" uuid NOT NULL,
	"name" text NOT NULL,
	"file_extension" text NOT NULL,
	"data" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_accounting_dimension_value" (
	"rule_id" integer NOT NULL,
	"definition_id" uuid NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "rule_accounting_dimension_value_rule_id_definition_id_pk" PRIMARY KEY("rule_id","definition_id")
);
--> statement-breakpoint
CREATE TABLE "kmd_accounting_parameters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" integer,
	"booking_text" text,
	"cpr_type" "cpr_type",
	"cpr_number" text,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "rule_bank_account" (
	"rule_id" integer NOT NULL,
	"bank_account_id" text NOT NULL,
	CONSTRAINT "rule_bank_account_rule_id_bank_account_id_pk" PRIMARY KEY("rule_id","bank_account_id")
);
--> statement-breakpoint
CREATE TABLE "rule_banking_condition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" integer NOT NULL,
	"field" "rule_condition_field" NOT NULL,
	"operator" "rule_condition_operator" DEFAULT 'eq' NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_rule_tag" (
	"rule_id" integer NOT NULL,
	"rule_tag_id" text NOT NULL,
	CONSTRAINT "rule_rule_tag_rule_id_rule_tag_id_pk" PRIMARY KEY("rule_id","rule_tag_id")
);
--> statement-breakpoint
CREATE TABLE "tenant_configuration" (
	"id" integer PRIMARY KEY NOT NULL,
	"active_erp_supplier" "erp_supplier" NOT NULL,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rule_tag" (
	"id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ruleId" integer NOT NULL,
	"version" integer NOT NULL,
	"content" jsonb NOT NULL,
	"createdAt" date DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_date" date NOT NULL,
	"status" "run_status",
	CONSTRAINT "run_booking_date_unique" UNIQUE("booking_date")
);
--> statement-breakpoint
CREATE TABLE "banking_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text,
	"format" "banking_document_format" NOT NULL,
	"filename" text,
	"content" text NOT NULL,
	"content_hash" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"message_id" text,
	"created_at" timestamp with time zone,
	CONSTRAINT "banking_document_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
CREATE TABLE "banking_statement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"statement_id" text NOT NULL,
	"electronic_seq_no" integer,
	"legal_seq_no" integer,
	"statement_created_at" timestamp with time zone,
	"iban" text,
	"currency" text,
	"owner_name" text,
	"servicer_bic" text,
	"from_date" date,
	"to_date" date
);
--> statement-breakpoint
CREATE TABLE "banking_statement_balance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"statement_id" uuid NOT NULL,
	"type_code" text NOT NULL,
	"amount" numeric NOT NULL,
	"currency" text,
	"credit_debit_indicator" "credit_debit_indicator",
	"balance_date" date
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"account" text NOT NULL,
	"statement_id" uuid,
	"entry_index" integer,
	"entry_sub_index" integer,
	"amount" numeric NOT NULL,
	"currency" text,
	"credit_debit_indicator" "credit_debit_indicator",
	"status" text,
	"booking_date" date NOT NULL,
	"value_date" date,
	"ntry_ref" text,
	"ntry_acct_svcr_ref" text,
	"entry_additional_info" text,
	"tx_acct_svcr_ref" text,
	"refs_end_to_end_id" text,
	"refs_instr_id" text,
	"refs_pmt_inf_id" text,
	"uetr" text,
	"tx_additional_info" text,
	"bk_tx_cd_domain" text,
	"bk_tx_cd_family" text,
	"bk_tx_cd_sub_family" text,
	"bk_tx_cd_proprietary" text,
	"dbtr_name" text,
	"dbtr_id" text,
	"dbtr_acct_iban" text,
	"cdtr_name" text,
	"cdtr_id" text,
	"cdtr_acct_iban" text,
	"ultmt_dbtr_name" text,
	"ultmt_cdtr_name" text,
	"rmt_ustrd" text[],
	"rmt_cdtr_ref" text,
	"rmt_addtl" text[],
	CONSTRAINT "transaction_statement_entry_unique" UNIQUE("statement_id","entry_index","entry_sub_index")
);
--> statement-breakpoint
CREATE TABLE "transaction_processing" (
	"transaction_id" uuid PRIMARY KEY NOT NULL,
	"status" "booking_status",
	"rule_applied" integer,
	"locked_at" date,
	"locked_by" text
);
--> statement-breakpoint
CREATE TABLE "transaction_code_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "bank_provider" NOT NULL,
	"code_key" text NOT NULL,
	"domain" text,
	"family" text,
	"sub_family" text,
	"proprietary" text,
	"display_name" text NOT NULL,
	"description" text,
	"source_document" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transaction_code_catalog_provider_code_key_unique" UNIQUE("provider","code_key")
);
--> statement-breakpoint
CREATE TABLE "transaction_party" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"role" "transaction_party_role" NOT NULL,
	"sequence_no" integer NOT NULL,
	"display_name" text,
	"identifier" text,
	"account_iban" text,
	"xml_path_name" text,
	"xml_path_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transaction_party_transaction_role_sequence_unique" UNIQUE("transaction_id","role","sequence_no")
);
--> statement-breakpoint
CREATE TABLE "transaction_reference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"xml_path" text NOT NULL,
	"source_scope" "transaction_source_scope" NOT NULL,
	"reference_type" "transaction_reference_type" NOT NULL,
	"sequence_no" integer NOT NULL,
	"value_raw" text NOT NULL,
	"value_normalized" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transaction_reference_source_value_unique" UNIQUE("transaction_id","xml_path","value_normalized")
);
--> statement-breakpoint
ALTER TABLE "erp_accounting_dimension_constraint_member" ADD CONSTRAINT "erp_accounting_dimension_constraint_member_constraint_id_erp_accounting_dimension_constraint_id_fk" FOREIGN KEY ("constraint_id") REFERENCES "public"."erp_accounting_dimension_constraint"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_request" ADD CONSTRAINT "banking_request_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_response" ADD CONSTRAINT "banking_response_request_id_banking_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."banking_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_party" ADD CONSTRAINT "banking_party_payload_id_banking_payload_id_fk" FOREIGN KEY ("payload_id") REFERENCES "public"."banking_payload"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_reference" ADD CONSTRAINT "banking_reference_payload_id_banking_payload_id_fk" FOREIGN KEY ("payload_id") REFERENCES "public"."banking_payload"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_tx_code" ADD CONSTRAINT "banking_tx_code_payload_id_banking_payload_id_fk" FOREIGN KEY ("payload_id") REFERENCES "public"."banking_payload"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_adapter_cursor" ADD CONSTRAINT "banking_adapter_cursor_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_agreement_account_allowlist" ADD CONSTRAINT "banking_agreement_account_allowlist_provider_banking_agreement_provider_fk" FOREIGN KEY ("provider") REFERENCES "public"."banking_agreement"("provider") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_agreement_account_dimension" ADD CONSTRAINT "banking_agreement_account_dimension_provider_banking_agreement_provider_fk" FOREIGN KEY ("provider") REFERENCES "public"."banking_agreement"("provider") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_agreement_cursor" ADD CONSTRAINT "banking_agreement_cursor_provider_banking_agreement_provider_fk" FOREIGN KEY ("provider") REFERENCES "public"."banking_agreement"("provider") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_agreement_discovery_run" ADD CONSTRAINT "banking_agreement_discovery_run_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_request" ADD CONSTRAINT "erp_request_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_request_line" ADD CONSTRAINT "erp_request_line_request_id_erp_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."erp_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_request_line" ADD CONSTRAINT "erp_request_line_transaction_id_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_response" ADD CONSTRAINT "erp_response_request_id_erp_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."erp_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error" ADD CONSTRAINT "error_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job" ADD CONSTRAINT "job_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_booking_draft" ADD CONSTRAINT "manual_booking_draft_transaction_id_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_booking_draft_attachment" ADD CONSTRAINT "manual_booking_draft_attachment_transaction_id_manual_booking_draft_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."manual_booking_draft"("transaction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_booking_draft_line" ADD CONSTRAINT "manual_booking_draft_line_transaction_id_manual_booking_draft_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."manual_booking_draft"("transaction_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_booking_draft_line_dimension" ADD CONSTRAINT "manual_booking_draft_line_dimension_line_id_manual_booking_draft_line_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."manual_booking_draft_line"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox" ADD CONSTRAINT "outbox_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kmd_attachment" ADD CONSTRAINT "kmd_attachment_parameter_id_kmd_accounting_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."kmd_accounting_parameters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_accounting_dimension_value" ADD CONSTRAINT "rule_accounting_dimension_value_rule_id_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_accounting_dimension_value" ADD CONSTRAINT "rule_accounting_dimension_value_definition_id_erp_accounting_dimension_definition_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."erp_accounting_dimension_definition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kmd_accounting_parameters" ADD CONSTRAINT "kmd_accounting_parameters_rule_id_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_bank_account" ADD CONSTRAINT "rule_bank_account_rule_id_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_bank_account" ADD CONSTRAINT "rule_bank_account_bank_account_id_account_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_banking_condition" ADD CONSTRAINT "rule_banking_condition_rule_id_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_rule_tag" ADD CONSTRAINT "rule_rule_tag_rule_id_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_rule_tag" ADD CONSTRAINT "rule_rule_tag_rule_tag_id_rule_tag_id_fk" FOREIGN KEY ("rule_tag_id") REFERENCES "public"."rule_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_version" ADD CONSTRAINT "rule_version_ruleId_rule_id_fk" FOREIGN KEY ("ruleId") REFERENCES "public"."rule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_document" ADD CONSTRAINT "banking_document_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_statement" ADD CONSTRAINT "banking_statement_document_id_banking_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."banking_document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_statement_balance" ADD CONSTRAINT "banking_statement_balance_statement_id_banking_statement_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."banking_statement"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_account_account_id_fk" FOREIGN KEY ("account") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_statement_id_banking_statement_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."banking_statement"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_processing" ADD CONSTRAINT "transaction_processing_transaction_id_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_processing" ADD CONSTRAINT "transaction_processing_rule_applied_rule_id_fk" FOREIGN KEY ("rule_applied") REFERENCES "public"."rule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_party" ADD CONSTRAINT "transaction_party_transaction_id_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_reference" ADD CONSTRAINT "transaction_reference_transaction_id_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_iban_currency_provider_idx" ON "account" USING btree ("iban","currency","provider");--> statement-breakpoint
CREATE INDEX "erp_accounting_dimension_constraint_supplier_idx" ON "erp_accounting_dimension_constraint" USING btree ("erp_supplier");--> statement-breakpoint
CREATE INDEX "banking_agreement_account_allowlist_iban_provider_idx" ON "banking_agreement_account_allowlist" USING btree ("iban","provider");--> statement-breakpoint
CREATE INDEX "banking_agreement_discovery_run_provider_requested_at_idx" ON "banking_agreement_discovery_run" USING btree ("provider","requested_at");--> statement-breakpoint
CREATE INDEX "banking_agreement_discovery_run_status_updated_at_idx" ON "banking_agreement_discovery_run" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "banking_agreement_discovery_run_job_id_idx" ON "banking_agreement_discovery_run" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "document_run_id_idx" ON "document" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "erp_request_run_id_idx" ON "erp_request" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "erp_request_line_transaction_id_idx" ON "erp_request_line" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "error_run_id_created_at_idx" ON "error" USING btree ("run_id","created_at");--> statement-breakpoint
CREATE INDEX "error_created_at_idx" ON "error" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "job_status_run_at_idx" ON "job" USING btree ("status","run_at");--> statement-breakpoint
CREATE INDEX "job_run_id_updated_at_idx" ON "job" USING btree ("run_id","updated_at");--> statement-breakpoint
CREATE INDEX "job_status_updated_at_idx" ON "job" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "manual_booking_draft_attachment_transaction_sort_order_idx" ON "manual_booking_draft_attachment" USING btree ("transaction_id","sort_order");--> statement-breakpoint
CREATE INDEX "manual_booking_draft_line_transaction_sort_order_idx" ON "manual_booking_draft_line" USING btree ("transaction_id","sort_order");--> statement-breakpoint
CREATE INDEX "outbox_status_next_attempt_at_idx" ON "outbox" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "outbox_run_id_created_at_idx" ON "outbox" USING btree ("run_id","created_at");--> statement-breakpoint
CREATE INDEX "outbox_status_created_at_idx" ON "outbox" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "erp_accounting_dimension_definition_supplier_sort_order_idx" ON "erp_accounting_dimension_definition" USING btree ("erp_supplier","sort_order");--> statement-breakpoint
CREATE INDEX "rule_status_updated_at_idx" ON "rule" USING btree ("rule_status","updated_at");--> statement-breakpoint
CREATE INDEX "rule_status_last_used_idx" ON "rule" USING btree ("rule_status","last_used");--> statement-breakpoint
CREATE INDEX "kmd_accounting_parameters_rule_id_idx" ON "kmd_accounting_parameters" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "rule_banking_condition_rule_id_idx" ON "rule_banking_condition" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "rule_version_rule_id_version_idx" ON "rule_version" USING btree ("ruleId","version");--> statement-breakpoint
CREATE INDEX "run_status_booking_date_idx" ON "run" USING btree ("status","booking_date");--> statement-breakpoint
CREATE INDEX "banking_document_account_received_at_idx" ON "banking_document" USING btree ("account_id","received_at");--> statement-breakpoint
CREATE INDEX "banking_statement_document_id_idx" ON "banking_statement" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "banking_statement_statement_id_idx" ON "banking_statement" USING btree ("statement_id");--> statement-breakpoint
CREATE INDEX "banking_statement_balance_statement_type_code_idx" ON "banking_statement_balance" USING btree ("statement_id","type_code");--> statement-breakpoint
CREATE INDEX "transaction_run_id_idx" ON "transaction" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "transaction_run_id_account_id_idx" ON "transaction" USING btree ("run_id","account");--> statement-breakpoint
CREATE INDEX "transaction_booking_date_id_idx" ON "transaction" USING btree ("booking_date","id");--> statement-breakpoint
CREATE INDEX "transaction_account_booking_date_id_idx" ON "transaction" USING btree ("account","booking_date","id");--> statement-breakpoint
CREATE INDEX "transaction_statement_order_idx" ON "transaction" USING btree ("statement_id","entry_index","entry_sub_index");--> statement-breakpoint
CREATE INDEX "transaction_processing_status_transaction_id_idx" ON "transaction_processing" USING btree ("status","transaction_id");--> statement-breakpoint
CREATE INDEX "transaction_processing_rule_applied_idx" ON "transaction_processing" USING btree ("rule_applied");--> statement-breakpoint
CREATE INDEX "transaction_party_transaction_sequence_idx" ON "transaction_party" USING btree ("transaction_id","sequence_no");--> statement-breakpoint
CREATE INDEX "transaction_reference_transaction_sequence_idx" ON "transaction_reference" USING btree ("transaction_id","sequence_no");