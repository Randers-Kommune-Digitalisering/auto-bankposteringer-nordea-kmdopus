// This file defines the configuration for matching rules, including the available fields and their categories.
// It also provides utility types and constants for working with these fields in the application.

import type { RuleConditionField } from "../db/schema/enums";
import {
  formatTransactionFieldOptionLabel,
  transactionFieldCatalog,
} from "../../../engine/matching/domain/transactionFieldCatalog";

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
      {
        key: transactionFieldCatalog.ntryAcctSvcrRef.matchField,
        label: transactionFieldCatalog.ntryAcctSvcrRef.label,
        pathLabel: transactionFieldCatalog.ntryAcctSvcrRef.pathLabel,
      },
      {
        key: transactionFieldCatalog.entryAdditionalInfo.matchField,
        label: transactionFieldCatalog.entryAdditionalInfo.label,
        pathLabel: transactionFieldCatalog.entryAdditionalInfo.pathLabel,
      },
    ],
  },
  {
    category: matchCategoryLabels.counterparty,
    fields: [
      {
        key: transactionFieldCatalog.counterpartName.matchField,
        label: transactionFieldCatalog.counterpartName.label,
        pathLabel: transactionFieldCatalog.counterpartName.pathLabel,
      },
    ],
  },
  {
    category: matchCategoryLabels.transactionType,
    fields: [
      {
        key: transactionFieldCatalog.bkTxCdDomain.matchField,
        label: transactionFieldCatalog.bkTxCdDomain.label,
        pathLabel: transactionFieldCatalog.bkTxCdDomain.pathLabel,
      },
      {
        key: transactionFieldCatalog.bkTxCdFamily.matchField,
        label: transactionFieldCatalog.bkTxCdFamily.label,
        pathLabel: transactionFieldCatalog.bkTxCdFamily.pathLabel,
      },
      {
        key: transactionFieldCatalog.bkTxCdSubFamily.matchField,
        label: transactionFieldCatalog.bkTxCdSubFamily.label,
        pathLabel: transactionFieldCatalog.bkTxCdSubFamily.pathLabel,
      },
      {
        key: transactionFieldCatalog.bkTxCdProprietary.matchField,
        label: transactionFieldCatalog.bkTxCdProprietary.label,
        pathLabel: transactionFieldCatalog.bkTxCdProprietary.pathLabel,
      },
      {
        key: transactionFieldCatalog.creditDebitIndicator.matchField,
        label: transactionFieldCatalog.creditDebitIndicator.label,
        pathLabel: transactionFieldCatalog.creditDebitIndicator.pathLabel,
      },
    ],
  },
] as const satisfies readonly {
  category: string;
  fields: readonly (MatchFieldMeta & { pathLabel: string })[];
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
    label: formatTransactionFieldOptionLabel(field),
    value: field.key,
  }));
  return acc;
}, {} as Record<MatchCategory, Array<{ label: string; value: MatchField }>>);

export { matchCatalog };
