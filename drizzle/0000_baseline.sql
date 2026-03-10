CREATE TYPE "public"."banking_document_format" AS ENUM('camt053', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('åben', 'bogført', 'undtaget');--> statement-breakpoint
CREATE TYPE "public"."cpr_type" AS ENUM('ingen', 'statisk', 'dynamisk');--> statement-breakpoint
CREATE TYPE "public"."credit_debit_indicator" AS ENUM('CRDT', 'DBIT');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('postering', 'afstemning');--> statement-breakpoint
CREATE TYPE "public"."erp_supplier" AS ENUM('kmd', 'andet');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'in_progress', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'processing', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."rule_condition_field" AS ENUM('ntry_ref', 'ntry_acct_svcr_ref', 'tx_acct_svcr_ref', 'refs_end_to_end_id', 'refs_instr_id', 'refs_pmt_inf_id', 'uetr', 'dbtr_name', 'dbtr_id', 'dbtr_acct_iban', 'cdtr_name', 'cdtr_id', 'cdtr_acct_iban', 'ultmt_dbtr_name', 'ultmt_cdtr_name', 'bk_tx_cd_domain', 'bk_tx_cd_family', 'bk_tx_cd_sub_family', 'bk_tx_cd_proprietary', 'cdt_dbt_ind', 'entry_additional_info', 'tx_additional_info', 'rmt_ustrd', 'rmt_cdtr_ref', 'rmt_addtl');--> statement-breakpoint
CREATE TYPE "public"."rule_condition_operator" AS ENUM('eq', 'neq', 'like', 'ilike', 'gt', 'gte', 'lt', 'lte', 'in');--> statement-breakpoint
CREATE TYPE "public"."rule_status" AS ENUM('aktiv', 'inaktiv');--> statement-breakpoint
CREATE TYPE "public"."rule_type" AS ENUM('standard', 'undtagelse', 'engangs');--> statement-breakpoint
CREATE TYPE "public"."run_error_source" AS ENUM('banking', 'application', 'erp');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('afventer', 'indlæser', 'udført', 'fejl');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"status_account" integer NOT NULL
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
CREATE TABLE "kmd_accounting_parameters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" integer,
	"primary_account" text NOT NULL,
	"secondary_account" text,
	"tertiary_account" text,
	"booking_text" text,
	"cpr_type" "cpr_type",
	"cpr_number" text,
	"notify_to" text,
	"note" text
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
CREATE TABLE "rule" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "rule_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"last_used" date,
	"created_at" date DEFAULT now(),
	"updated_at" date DEFAULT now(),
	"locked_at" date,
	"locked_by" text,
	"current_version_id" bigint NOT NULL,
	"rule_type" "rule_type",
	"rule_status" "rule_status",
	"amount_min" numeric,
	"amount_max" numeric
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
	"status" "run_status"
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
	"account" text,
	"statement_id" uuid,
	"entry_index" integer,
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
	"rmt_addtl" text[]
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
ALTER TABLE "banking_request" ADD CONSTRAINT "banking_request_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_response" ADD CONSTRAINT "banking_response_request_id_banking_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."banking_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_party" ADD CONSTRAINT "banking_party_payload_id_banking_payload_id_fk" FOREIGN KEY ("payload_id") REFERENCES "public"."banking_payload"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_reference" ADD CONSTRAINT "banking_reference_payload_id_banking_payload_id_fk" FOREIGN KEY ("payload_id") REFERENCES "public"."banking_payload"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_tx_code" ADD CONSTRAINT "banking_tx_code_payload_id_banking_payload_id_fk" FOREIGN KEY ("payload_id") REFERENCES "public"."banking_payload"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banking_adapter_cursor" ADD CONSTRAINT "banking_adapter_cursor_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_request" ADD CONSTRAINT "erp_request_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_request_line" ADD CONSTRAINT "erp_request_line_request_id_erp_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."erp_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_request_line" ADD CONSTRAINT "erp_request_line_transaction_id_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_response" ADD CONSTRAINT "erp_response_request_id_erp_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."erp_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error" ADD CONSTRAINT "error_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job" ADD CONSTRAINT "job_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox" ADD CONSTRAINT "outbox_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kmd_accounting_parameters" ADD CONSTRAINT "kmd_accounting_parameters_rule_id_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kmd_attachment" ADD CONSTRAINT "kmd_attachment_parameter_id_kmd_accounting_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."kmd_accounting_parameters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "transaction_processing" ADD CONSTRAINT "transaction_processing_rule_applied_rule_id_fk" FOREIGN KEY ("rule_applied") REFERENCES "public"."rule"("id") ON DELETE no action ON UPDATE no action;