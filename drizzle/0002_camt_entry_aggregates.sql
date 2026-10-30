DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "transaction"
    WHERE statement_id IS NOT NULL AND entry_index IS NOT NULL
    GROUP BY statement_id, entry_index
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate CAMT entry rows exist. Run the approved bank-derived data reset before this migration.';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_statement_entry_unique";
--> statement-breakpoint
DROP INDEX "transaction_statement_order_idx";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "entry_sub_index";
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "underlying_transaction_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "tx_acct_svcr_ref";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "refs_end_to_end_id";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "refs_instr_id";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "refs_pmt_inf_id";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "uetr";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "tx_additional_info";
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
ALTER TABLE "transaction" DROP COLUMN "rmt_ustrd";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "rmt_cdtr_ref";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "rmt_addtl";
--> statement-breakpoint
ALTER TABLE "banking_document" DROP COLUMN "content";
--> statement-breakpoint
DROP TABLE "transaction_party";
--> statement-breakpoint
DROP TABLE "transaction_reference";
--> statement-breakpoint
DROP TABLE "banking_reference";
--> statement-breakpoint
DROP TABLE "banking_party";
--> statement-breakpoint
DROP TABLE "banking_tx_code";
--> statement-breakpoint
DROP TABLE "banking_payload";
--> statement-breakpoint
DROP TYPE "transaction_party_role";
--> statement-breakpoint
DROP TYPE "transaction_reference_type";
--> statement-breakpoint
DROP TYPE "transaction_source_scope";
--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_statement_entry_unique" UNIQUE ("statement_id", "entry_index");
--> statement-breakpoint
CREATE INDEX "transaction_statement_order_idx" ON "transaction" USING btree ("statement_id", "entry_index");
