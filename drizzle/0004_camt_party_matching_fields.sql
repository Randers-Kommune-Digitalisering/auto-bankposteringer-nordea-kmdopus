INSERT INTO "rule_banking_condition" ("rule_id", "field", "operator", "gate", "value")
SELECT "rule_id", 'dbtr_name'::"rule_condition_field", "operator", 'ELLER'::"rule_condition_gate", "value"
FROM "rule_banking_condition"
WHERE "field"::text = 'counterparty_name'
UNION ALL
SELECT "rule_id", 'cdtr_name'::"rule_condition_field", "operator", 'ELLER'::"rule_condition_gate", "value"
FROM "rule_banking_condition"
WHERE "field"::text = 'counterparty_name';
--> statement-breakpoint
DELETE FROM "rule_banking_condition" WHERE "field"::text = 'counterparty_name';
--> statement-breakpoint
ALTER TYPE "rule_condition_field" RENAME TO "rule_condition_field_legacy";
--> statement-breakpoint
CREATE TYPE "rule_condition_field" AS ENUM (
  'ntry_ref',
  'ntry_acct_svcr_ref',
  'tx_acct_svcr_ref',
  'refs_end_to_end_id',
  'refs_instr_id',
  'refs_pmt_inf_id',
  'uetr',
  'dbtr_name',
  'dbtr_id',
  'dbtr_acct_iban',
  'cdtr_name',
  'cdtr_id',
  'cdtr_acct_iban',
  'ultmt_dbtr_name',
  'ultmt_cdtr_name',
  'bk_tx_cd_domain',
  'bk_tx_cd_family',
  'bk_tx_cd_sub_family',
  'bk_tx_cd_proprietary',
  'cdt_dbt_ind',
  'entry_additional_info',
  'tx_additional_info',
  'rmt_ustrd',
  'rmt_cdtr_ref',
  'rmt_addtl'
);
--> statement-breakpoint
ALTER TABLE "rule_banking_condition"
ALTER COLUMN "field" TYPE "rule_condition_field"
USING "field"::text::"rule_condition_field";
--> statement-breakpoint
DROP TYPE "rule_condition_field_legacy";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "counterparty_name";
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "dbtr_name" text;
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "dbtr_id" text;
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "dbtr_acct_iban" text;
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "cdtr_name" text;
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "cdtr_id" text;
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "cdtr_acct_iban" text;
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "ultmt_dbtr_name" text;
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "ultmt_cdtr_name" text; --