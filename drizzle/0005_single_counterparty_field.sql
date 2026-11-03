ALTER TYPE "rule_condition_field" ADD VALUE 'counterparty_name' BEFORE 'dbtr_name';
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "dbtr_name";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "dbtr_id";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "dbtr_acct_iban";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "cdtr_name";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "cdtr_id";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "cdtr_acct_iban";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "ultmt_dbtr_name";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "ultmt_cdtr_name";
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "counterpart_name" text;
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "counterpart_name_source" text;
