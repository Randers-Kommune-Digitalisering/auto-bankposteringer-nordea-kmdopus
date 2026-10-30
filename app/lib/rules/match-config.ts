// This file defines the configuration for matching rules, including the available fields and their categories.
// It also provides utility types and constants for working with these fields in the application.

import type { RuleConditionField } from "../db/schema/enums";

export type MatchFieldMeta = {
  key: RuleConditionField;
  label: string;
};

export const matchCategoryLabels = {
  reference: 'Reference',
  counterparty: 'Modpart',
  transactionType: 'Transaktionstype',
} as const;

const matchCatalog = [
  {
    category: matchCategoryLabels.reference,
    fields: [
      { key: "ntry_ref", label: "Entry reference (NtryRef)" },
      { key: "ntry_acct_svcr_ref", label: "Entry AcctSvcrRef" },
      { key: "entry_additional_info", label: "Additional entry info" },
    ],
  },
  {
    category: matchCategoryLabels.counterparty,
    fields: [],
  },
  {
    category: matchCategoryLabels.transactionType,
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
