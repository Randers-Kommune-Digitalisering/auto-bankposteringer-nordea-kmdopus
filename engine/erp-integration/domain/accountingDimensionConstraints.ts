export type AccountingDimensionConstraintKind =
  | 'requires_any_of'
  | 'requires_all_of'
  | 'requires_exactly_one_of'

export type AccountingDimensionConstraintLike = {
  ifKey: string
  kind: AccountingDimensionConstraintKind
  members: string[]
}

export function validateAccountingDimensionConstraints(
  keys: Set<string>,
  constraints?: AccountingDimensionConstraintLike[],
) {
  for (const c of constraints ?? []) {
    if (!keys.has(c.ifKey)) continue

    if (c.kind === 'requires_any_of') {
      const ok = c.members.some(m => keys.has(m))
      if (!ok) {
        throw new Error(`Når '${c.ifKey}' er udfyldt, skal mindst én af [${c.members.join(', ')}] også være udfyldt`)
      }
      continue
    }

    if (c.kind === 'requires_all_of') {
      const missing = c.members.filter(m => !keys.has(m))
      if (missing.length) {
        throw new Error(`Når '${c.ifKey}' er udfyldt, skal også [${missing.join(', ')}] være udfyldt`)
      }
      continue
    }

    if (c.kind === 'requires_exactly_one_of') {
      const present = c.members.filter(m => keys.has(m))
      if (present.length === 0) {
        throw new Error(`Når '${c.ifKey}' er udfyldt, skal præcist én af [${c.members.join(', ')}] også være udfyldt`)
      }
      if (present.length > 1) {
        throw new Error(`Når '${c.ifKey}' er udfyldt, må kun én af [${c.members.join(', ')}] være udfyldt`)
      }
    }
  }
}
