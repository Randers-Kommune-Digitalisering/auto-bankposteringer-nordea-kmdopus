import type { ErpSupplier } from '../../../app/lib/db/schema/enums'
import type { AccountingDimensionConstraintKind } from '../../../app/lib/db/schema/accountingDimensionConstraint'

export type DefaultAccountingDimensionDefinition = {
  supplier: ErpSupplier
  key: string
  sortOrder: number
  required: boolean
  erpTarget?: string
  valueRegex?: string
  valueRegexFlags?: string
}

export type DefaultAccountingDimensionConstraint = {
  supplier: ErpSupplier
  ifKey: string
  kind: AccountingDimensionConstraintKind
  members: string[]
  ifValueRegex?: string | null
}

// Canonical, version-controlled defaults.
// These are *bootstrapped* into Postgres via system seed, but runtime behavior is always driven by DB state.
export const defaultAccountingDimensionDefinitions: DefaultAccountingDimensionDefinition[] = [
  {
    supplier: 'kmd',
    key: 'artskonto',
    sortOrder: 1,
    required: true,
    erpTarget: 'glAccount',
    valueRegex: '^(S\\d{7}|\\d{8})$',
  },
  {
    supplier: 'kmd',
    key: 'omkostningssted',
    sortOrder: 2,
    required: false,
    erpTarget: 'costCenter',
    valueRegex: '^[a-zA-Z0-9]{1,10}$',
  },
  {
    supplier: 'kmd',
    key: 'psp-element',
    sortOrder: 3,
    required: false,
    erpTarget: 'wbsElement',
    valueRegex: '^X[A-Z]-\\d{1,10}-\\d{1,5}$',
    valueRegexFlags: 'i',
  },
]

export const defaultAccountingDimensionConstraints: DefaultAccountingDimensionConstraint[] = [
  {
    supplier: 'kmd',
    ifKey: 'artskonto',
    kind: 'forbids_any_of',
    ifValueRegex: '^[S9].*',
    members: ['omkostningssted', 'psp-element'],
  },
  {
    supplier: 'kmd',
    ifKey: 'artskonto',
    kind: 'requires_exactly_one_of',
    ifValueRegex: '^(?![S9]).+',
    members: ['omkostningssted', 'psp-element'],
  },
]
