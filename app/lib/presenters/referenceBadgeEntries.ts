export type BadgeEntry = {
  value: string
  hint?: string
}

type SourceValue = {
  value: string | null | undefined
  hint: string
}

type TriadToken = {
  code: string
  label: string
  value: string
}

function normalizeText(value: string): string {
  return value.trim()
}

function splitSourceValue(entry: SourceValue): Array<{ token: string; hint: string }> {
  return String(entry.value ?? '')
    .split(';')
    .map((token) => normalizeText(token))
    .filter(Boolean)
    .map((token) => ({ token, hint: entry.hint }))
}

function parseTriadToken(token: string): TriadToken | null {
  const match = /^(\d{2,3}):([^:]+):(.*)$/.exec(token)
  if (!match) return null

  const code = normalizeText(String(match[1] ?? ''))
  const label = normalizeText(String(match[2] ?? ''))
  const value = normalizeText(String(match[3] ?? ''))
  if (!code || !label || !value) return null

  return { code, label, value }
}

export function dedupeBadgeEntries(entries: BadgeEntry[]): BadgeEntry[] {
  const byValue = new Map<string, { value: string; hints: Set<string> }>()

  for (const entry of entries) {
    const value = normalizeText(entry.value)
    if (!value.length) continue

    const key = value.toLowerCase()
    const existing = byValue.get(key) ?? { value, hints: new Set<string>() }
    const hint = normalizeText(String(entry.hint ?? ''))
    if (hint.length) existing.hints.add(hint)
    byValue.set(key, existing)
  }

  return Array.from(byValue.values()).map((entry) => ({
    value: entry.value,
    hint: entry.hints.size ? Array.from(entry.hints).join(' | ') : undefined,
  }))
}

export function buildReferenceBadgeEntries(values: SourceValue[]): BadgeEntry[] {
  const entries: BadgeEntry[] = []

  for (const sourceValue of values) {
    const tokens = splitSourceValue(sourceValue)
    for (const token of tokens) {
      const triad = parseTriadToken(token.token)
      if (triad) {
        entries.push({
          value: triad.value,
          hint: `${triad.code}: ${triad.label}`,
        })
        continue
      }

      entries.push({ value: token.token, hint: token.hint })
    }
  }

  return dedupeBadgeEntries(entries)
}