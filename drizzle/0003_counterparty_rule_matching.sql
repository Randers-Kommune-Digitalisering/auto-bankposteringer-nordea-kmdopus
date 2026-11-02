ALTER TYPE "rule_condition_field" ADD VALUE 'counterparty_name' BEFORE 'dbtr_name';
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "counterparty_name" text; --