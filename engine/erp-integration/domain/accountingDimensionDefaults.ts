import type { ErpSupplier } from '~/lib/db/schema/enums'
import type { AccountingDimensionConstraintKind } from '~/lib/db/schema/accountingDimensionConstraint'

export type DefaultAccountingDimensionDefinition = {
  supplier: ErpSupplier
  key: string
  sortOrder: number
  required: boolean
  erpTarget?: string
}

export type DefaultAccountingDimensionConstraint = {
  supplier: ErpSupplier
  ifKey: string
  kind: AccountingDimensionConstraintKind
  members: string[]
}

// Canonical, version-controlled defaults.
// These are *bootstrapped* into Postgres via system seed, but runtime behavior is always driven by DB state.
export const defaultAccountingDimensionDefinitions: DefaultAccountingDimensionDefinition[] = [
  { supplier: 'kmd', key: 'artskonto', sortOrder: 1, required: true, erpTarget: 'glAccount' },
  { supplier: 'kmd', key: 'omkostningssted', sortOrder: 2, required: false, erpTarget: 'costCenter' },
  { supplier: 'kmd', key: 'psp-element', sortOrder: 3, required: false, erpTarget: 'wbsElement' },
]

export const defaultAccountingDimensionConstraints: DefaultAccountingDimensionConstraint[] = [
  {
    supplier: 'kmd',
    ifKey: 'artskonto',
    kind: 'requires_exactly_one_of',
    members: ['omkostningssted', 'psp-element'],
  },
]
