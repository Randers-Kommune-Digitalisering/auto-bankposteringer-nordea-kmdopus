// This file defines the configuration for matching rules, including the available fields and their categories.
// It also provides utility types and constants for working with these fields in the application.

import type { RuleConditionField } from "~/lib/db/schema/enums";

export type MatchFieldMeta = {
  key: RuleConditionField;
  label: string;
};

const matchCatalog = [
  {
    category: "Fritekst",
    fields: [
      { key: "ntry_ref", label: "Entry reference (NtryRef)" },
      { key: "ntry_acct_svcr_ref", label: "Entry AcctSvcrRef" },
      { key: "tx_acct_svcr_ref", label: "Transaktion AcctSvcrRef" },
      { key: "refs_end_to_end_id", label: "End-to-end ID" },
      { key: "refs_instr_id", label: "InstrId" },
      { key: "refs_pmt_inf_id", label: "PmtInfId" },
      { key: "uetr", label: "UETR" },
      { key: "entry_additional_info", label: "Additional entry info" },
      { key: "tx_additional_info", label: "Additional transaction info" },
      { key: "rmt_ustrd", label: "Remittance (Ustrd)" },
      { key: "rmt_cdtr_ref", label: "Kreditorreference" },
      { key: "rmt_addtl", label: "Additional remittance info" },
    ],
  },
  {
    category: "Part",
    fields: [
      { key: "dbtr_id", label: "Debitor id" },
      { key: "dbtr_name", label: "Debitor navn" },
      { key: "dbtr_acct_iban", label: "Debitor konto (IBAN)" },
      { key: "cdtr_id", label: "Kreditor id" },
      { key: "cdtr_name", label: "Kreditor navn" },
      { key: "cdtr_acct_iban", label: "Kreditor konto (IBAN)" },
      { key: "ultmt_dbtr_name", label: "Ultimat debitor" },
      { key: "ultmt_cdtr_name", label: "Ultimat kreditor" },
    ],
  },
  {
    category: "Transaktionstype",
    fields: [
      { key: "bk_tx_cd_domain", label: "Kode domæne" },
      { key: "bk_tx_cd_family", label: "Kode familie" },
      { key: "bk_tx_cd_sub_family", label: "Kode underfamilie" },
      { key: "bk_tx_cd_proprietary", label: "Proprietary kode" },
      { key: "cdt_dbt_ind", label: "Credit/Debit (CRDT/DBIT)" },
    ],
  },
] as const satisfies readonly {
  category: string;
  fields: readonly MatchFieldMeta[];
}[];

export type MatchCategory = typeof matchCatalog[number]["category"];
export type MatchField = typeof matchCatalog[number]["fields"][number]["key"];

type NonEmptyTuple<T> = readonly [T, ...T[]];

function ensureNonEmptyTuple<T>(values: readonly T[], label: string): NonEmptyTuple<T> {
  if (!values.length) {
    throw new Error(`matchCatalog is missing ${label}`);
  }
  return values as NonEmptyTuple<T>;
}

const categoryTuple = ensureNonEmptyTuple(
  matchCatalog.map((group) => group.category),
  'categories',
);
const fieldTuple = ensureNonEmptyTuple(
  matchCatalog.flatMap((group) => group.fields.map((field) => field.key)),
  'fields',
);

export const matchCategories = [...categoryTuple];
export const matchCategoryEnumValues = categoryTuple;
export const matchFieldEnumValues = fieldTuple;

export const matchCategoryColumns = matchCatalog.reduce((acc, group) => {
  acc[group.category] = group.fields.map((field) => field.key);
  return acc;
}, {} as Record<MatchCategory, MatchField[]>);

export const fieldToCategory = matchCatalog.reduce((acc, group) => {
  for (const field of group.fields) {
    acc[field.key] = group.category;
  }
  return acc;
}, {} as Record<MatchField, MatchCategory>);

export const matchFieldOptionsByCategory = matchCatalog.reduce((acc, group) => {
  acc[group.category] = group.fields.map((field) => ({
    label: field.label,
    value: field.key,
  }));
  return acc;
}, {} as Record<MatchCategory, Array<{ label: string; value: MatchField }>>);

export { matchCatalog };
