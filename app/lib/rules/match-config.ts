import type { RuleConditionField } from "~/lib/db/schema/enums";

export type MatchFieldMeta = {
  key: RuleConditionField;
  label: string;
};

const matchCatalog = [
  {
    category: "Fritekst",
    fields: [
      { key: "text", label: "Posteringstekst" },
      { key: "primary_reference", label: "Primær reference" },
      { key: "id", label: "Bank reference" },
      { key: "batch", label: "Batch" },
      { key: "end_to_end_id", label: "End-to-end ID" },
      { key: "ocr_reference", label: "OCR reference" },
      { key: "debtors_payment_id", label: "Debitors betalings-id" },
      { key: "debtor_text", label: "Debitor tekst" },
      { key: "debtor_message", label: "Debitor besked" },
      { key: "creditor_text", label: "Kreditor tekst" },
      { key: "creditor_message", label: "Kreditor besked" },
    ],
  },
  {
    category: "Part",
    fields: [
      { key: "debtor_id", label: "Debitor id" },
      { key: "debtor_name", label: "Debitor navn" },
      { key: "creditor_id", label: "Kreditor id" },
      { key: "creditor_name", label: "Kreditor navn" },
    ],
  },
  {
    category: "Transaktionstype",
    fields: [
      { key: "type", label: "Type" },
      { key: "tx_code_domain", label: "Kode domæne" },
      { key: "tx_code_family", label: "Kode familie" },
      { key: "tx_code_sub_family", label: "Kode underfamilie" },
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
