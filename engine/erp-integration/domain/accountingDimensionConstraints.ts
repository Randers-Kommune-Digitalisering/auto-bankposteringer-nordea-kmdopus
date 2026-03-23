export type AccountingDimensionConstraintKind =
  | 'requires_any_of'
  | 'requires_all_of'
  | 'requires_exactly_one_of'
  | 'forbids_any_of'

export type AccountingDimensionConstraintLike = {
  ifKey: string
  kind: AccountingDimensionConstraintKind
  members: string[]
  ifValueRegex?: string | null
}

export function validateAccountingDimensionConstraints(
  values: Map<string, string>,
  constraints?: AccountingDimensionConstraintLike[],
) {
  const keys = new Set(values.keys())

  const matchesRegex = (pattern: string, value: string) => {
    try {
      return new RegExp(pattern).test(value)
    } catch {
      // Invalid patterns should fail fast so operators can fix configuration.
      throw new Error(`Ugyldig regex i konteringsconstraint: ${pattern}`)
    }
  }

  const byIfKey = new Map<string, AccountingDimensionConstraintLike[]>()
  for (const c of constraints ?? []) {
    const bucket = byIfKey.get(c.ifKey) ?? []
    bucket.push(c)
    byIfKey.set(c.ifKey, bucket)
  }

  for (const [ifKey, group] of byIfKey.entries()) {
    if (!keys.has(ifKey)) continue

    const ifValue = values.get(ifKey) ?? ''

    const regexConstraints = group.filter(c => (c.ifValueRegex ?? null) != null)
    const matchingRegex = regexConstraints.filter(c => matchesRegex(c.ifValueRegex!, ifValue))

    // Precedence: if any regex constraints match, ignore generic (null-regex) constraints for this key.
    const applicable = matchingRegex.length
      ? matchingRegex
      : group.filter(c => (c.ifValueRegex ?? null) == null)

    for (const c of applicable) {

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

      if (c.kind === 'forbids_any_of') {
      const present = c.members.filter(m => keys.has(m))
      if (present.length) {
          throw new Error(`Når '${c.ifKey}' er udfyldt, må [${present.join(', ')}] ikke være udfyldt`)
      }
      }
    }
  }
}
