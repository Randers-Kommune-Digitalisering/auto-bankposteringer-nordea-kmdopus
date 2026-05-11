import { ruleListDtoArray, mapRuleToListDto, type RuleListDto } from '~/lib/db/schema/rule'
import db from '~/lib/db'

function reviveDates(rows: any[]): RuleListDto[] {
  return rows.map((row) => ({
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    lastUsed: row.lastUsed ? new Date(row.lastUsed) : null
  }))
}

function serializeDates(rows: RuleListDto[]) {
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lastUsed: row.lastUsed ? row.lastUsed.toISOString() : null
  }))
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const storage = useStorage('rules')
  const cached = await storage.getItem<unknown>('rule-list')

  const maybeParseCached = (value: unknown): RuleListDto[] | null => {
    if (Array.isArray(value)) return reviveDates(value)
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? reviveDates(parsed) : null
      } catch {
        return null
      }
    }
    return null
  }

  if (cached) {
    const revived = maybeParseCached(cached)
    if (revived) {
      return ruleListDtoArray.parse(revived)
    }
  }

  const rows = await db.query.rule.findMany({
    columns: {
      id: true,
      type: true,
      status: true,
      lastUsed: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      bankAccounts: {
        columns: {
          bankAccountId: true
        }
      },
      tags: {
        columns: {
          ruleTagId: true
        }
      },
      conditions: true,
    },
    orderBy: (rule, { desc }) => [desc(rule.updatedAt)]
  })

  const dto = rows.map(mapRuleToListDto)
  const parsed = ruleListDtoArray.parse(dto)

  await storage.setItem('rule-list', serializeDates(parsed), { ttl: 60 })

  return parsed
})
