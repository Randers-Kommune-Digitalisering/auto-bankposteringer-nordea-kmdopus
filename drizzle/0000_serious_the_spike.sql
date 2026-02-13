CREATE TYPE "public"."booking_status" AS ENUM('åben', 'bogført', 'undtaget');--> statement-breakpoint
CREATE TYPE "public"."cpr_type" AS ENUM('ingen', 'statisk', 'dynamisk');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('postering', 'afstemning');--> statement-breakpoint
CREATE TYPE "public"."erp_supplier" AS ENUM('kmd', 'andet');--> statement-breakpoint
CREATE TYPE "public"."rule_condition_field" AS ENUM('id', 'end_to_end_id', 'ocr_reference', 'text', 'batch', 'debtor_text', 'debtor_message', 'debtors_payment_id', 'creditor_text', 'creditor_message', 'primary_reference', 'type', 'tx_code_domain', 'tx_code_family', 'tx_code_sub_family', 'debtor_name', 'debtor_id', 'creditor_name', 'creditor_id');--> statement-breakpoint
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
	"error_string" text
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
	"version" bigint NOT NULL,
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
CREATE TABLE "transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"payload_id" uuid,
	"account" text,
	"amount" numeric NOT NULL,
	"booking_date" date NOT NULL
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
ALTER TABLE "document" ADD CONSTRAINT "document_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_request" ADD CONSTRAINT "erp_request_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_response" ADD CONSTRAINT "erp_response_request_id_erp_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."erp_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error" ADD CONSTRAINT "error_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kmd_accounting_parameters" ADD CONSTRAINT "kmd_accounting_parameters_rule_id_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kmd_attachment" ADD CONSTRAINT "kmd_attachment_parameter_id_kmd_accounting_parameters_id_fk" FOREIGN KEY ("parameter_id") REFERENCES "public"."kmd_accounting_parameters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_bank_account" ADD CONSTRAINT "rule_bank_account_rule_id_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_bank_account" ADD CONSTRAINT "rule_bank_account_bank_account_id_account_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_banking_condition" ADD CONSTRAINT "rule_banking_condition_rule_id_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_rule_tag" ADD CONSTRAINT "rule_rule_tag_rule_id_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_rule_tag" ADD CONSTRAINT "rule_rule_tag_rule_tag_id_rule_tag_id_fk" FOREIGN KEY ("rule_tag_id") REFERENCES "public"."rule_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_version" ADD CONSTRAINT "rule_version_ruleId_rule_id_fk" FOREIGN KEY ("ruleId") REFERENCES "public"."rule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_run_id_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."run"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_payload_id_banking_payload_id_fk" FOREIGN KEY ("payload_id") REFERENCES "public"."banking_payload"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_account_account_id_fk" FOREIGN KEY ("account") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_processing" ADD CONSTRAINT "transaction_processing_transaction_id_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_processing" ADD CONSTRAINT "transaction_processing_rule_applied_rule_id_fk" FOREIGN KEY ("rule_applied") REFERENCES "public"."rule"("id") ON DELETE no action ON UPDATE no action;