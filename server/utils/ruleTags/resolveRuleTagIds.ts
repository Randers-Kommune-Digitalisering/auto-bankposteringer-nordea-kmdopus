import { sql } from 'drizzle-orm'
import { ruleTag } from '~/lib/db/schema/ruleTag'
import { capitalizeFirst } from '~/lib/text/capitalizeFirst'

export function normalizeRuleTagIds(input: unknown): string[] {
  const raw = Array.isArray(input) ? input : []

  const out: string[] = []
  const seen = new Set<string>()

  for (const value of raw) {
    const normalized = capitalizeFirst(String(value ?? ''))
    if (!normalized) continue

    const key = normalized.toLocaleLowerCase('da-DK')
    if (seen.has(key)) continue

    seen.add(key)
    out.push(normalized)
  }

  return out
}

export async function resolveRuleTagIds(
  dbOrTx: any,
  normalizedTagIds: readonly string[],
): Promise<{ resolvedTagIds: string[]; unknownTagIds: string[] }> {
  const uniqueNormalized = normalizeRuleTagIds(normalizedTagIds)
  if (!uniqueNormalized.length) {
    return { resolvedTagIds: [], unknownTagIds: [] }
  }

  const lowerIds = uniqueNormalized.map((t) => t.toLocaleLowerCase('da-DK'))

  const existing = await dbOrTx
    .select({ id: ruleTag.id })
    .from(ruleTag)
    .where(
      sql`lower(${ruleTag.id}) IN (${sql.join(
        lowerIds.map((id) => sql`${id}`),
        sql`, `,
      )})`,
    )

  const map = new Map<string, string>()
  for (const row of existing) {
    map.set(String(row.id).toLocaleLowerCase('da-DK'), String(row.id))
  }

  const resolvedTagIds = uniqueNormalized.map((t) => map.get(t.toLocaleLowerCase('da-DK')) ?? t)
  const unknownTagIds = uniqueNormalized.filter((t) => !map.has(t.toLocaleLowerCase('da-DK')))

  return { resolvedTagIds, unknownTagIds }
}
