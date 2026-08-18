import { compareItems, rankItem } from '@tanstack/match-sorter-utils'

type Primitive = string | number | boolean | null | undefined

export type FuzzyRankOptions<T> = {
  rows: T[]
  query: string
  getValues: (row: T) => Primitive[]
  tieBreaker?: (a: T, b: T) => number
}

function normalizeValue(value: Primitive): string {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  return String(value)
}

function buildHaystack(values: Primitive[]): string {
  return values
    .map(normalizeValue)
    .filter(Boolean)
    .join(' ')
}

export function fuzzyRankRows<T>(options: FuzzyRankOptions<T>): T[] {
  const query = options.query.trim()
  if (!query.length) {
    return options.rows.slice()
  }

  const ranked = options.rows
    .map((row) => {
      const haystack = buildHaystack(options.getValues(row))
      return {
        row,
        rank: rankItem(haystack, query),
      }
    })
    .filter((entry) => entry.rank.passed)

  ranked.sort((a, b) => {
    const fuzzyOrder = compareItems(a.rank, b.rank)
    if (fuzzyOrder !== 0) return fuzzyOrder

    if (options.tieBreaker) {
      return options.tieBreaker(a.row, b.row)
    }

    return 0
  })

  return ranked.map((entry) => entry.row)
}
