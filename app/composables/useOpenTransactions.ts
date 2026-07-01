import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type {
  OpenTransaction,
  OpenTransactionStack,
  OpenTransactionsResponse,
} from '~/types/transactions'
import { useStackedTransactions } from '~/composables/useStackedTransactions'

type AccountStackBuckets = Record<string, OpenTransactionStack[]>

type OpenTransactionsQueryOptions = {
  start?: MaybeRefOrGetter<Date | string | null | undefined>
  end?: MaybeRefOrGetter<Date | string | null | undefined>
  accountIds?: MaybeRefOrGetter<string[] | null | undefined>
  limit?: MaybeRefOrGetter<number | null | undefined>
  search?: MaybeRefOrGetter<string | null | undefined>
}

function toStackId(tx: OpenTransaction): string {
  return tx.groupKey ? `group:${tx.groupKey}` : `single:${tx.id}`
}

function normalizeResponse(
  v: OpenTransactionsResponse | OpenTransaction[] | null | undefined,
): OpenTransactionsResponse {
  if (!v) {
    return {
      items: [],
      stacks: undefined,
      groupedStacksByAccount: undefined,
      total: 0,
      limit: 0,
      totalSamleposter: 0,
    }
  }

  if (Array.isArray(v)) {
    return {
      items: v,
      stacks: undefined,
      groupedStacksByAccount: undefined,
      total: v.length,
      limit: v.length,
      totalSamleposter: new Set(v.map(toStackId)).size,
    }
  }

  return {
    items: v.items ?? [],
    stacks: v.stacks,
    groupedStacksByAccount: v.groupedStacksByAccount,
    total: v.total ?? 0,
    limit: v.limit ?? 0,
    totalSamleposter: v.totalSamleposter,
  }
}

function toDateOnlyParam(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined
    return value.toISOString().slice(0, 10)
  }

  const trimmed = String(value).trim()
  if (!trimmed) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toISOString().slice(0, 10)
}

export function useOpenTransactions(options: OpenTransactionsQueryOptions = {}) {
  const { data: rawData, pending, refresh } = useFetch<
    OpenTransactionsResponse | OpenTransaction[]
  >('/api/transactions', {
    key: computed(() => {
      const start = toDateOnlyParam(toValue(options.start)) ?? 'none'
      const end = toDateOnlyParam(toValue(options.end)) ?? 'none'
      const accountIds = (toValue(options.accountIds) ?? []).join(',') || 'all'
      const limit = Number(toValue(options.limit) ?? 200)
        const search = String(toValue(options.search) ?? '').trim() || 'none'
        return `open-transactions:${start}:${end}:${accountIds}:l${limit}:q:${search}`
    }),
    server: false,
    lazy: false,
    dedupe: 'cancel',
    query: computed(() => ({
      mode: 'open-items',
      start: toDateOnlyParam(toValue(options.start)),
      end: toDateOnlyParam(toValue(options.end)),
      accountIds: (toValue(options.accountIds) ?? []).length
        ? (toValue(options.accountIds) ?? []).join(',')
        : undefined,
      limit: Number(toValue(options.limit) ?? 200),
      search: String(toValue(options.search) ?? '').trim() || undefined,
    })),
    default: () => undefined,
  })

  const data = computed<OpenTransactionsResponse>(() =>
    normalizeResponse(rawData.value),
  )

  const stacked = useStackedTransactions({
    source: 'open-items',
    openItems: data,
  })

  /**
   * 1. BASE ITEMS (single source of truth)
   */
  const items = computed<OpenTransaction[]>(() => stacked.value.items)

  /**
   * 2. STACKS (either backend or client fallback)
   */
  const stacks = computed<OpenTransactionStack[]>(() => stacked.value.stacks)

  /**
   * 3. BUCKETS (group by account)
   */
  const stacksByAccount = computed<AccountStackBuckets>(() => stacked.value.stacksByAccount)

  /**
   * 4. FLAT VIEW (only when needed)
   */
  const transactions = computed<OpenTransaction[]>(() => {
    const result: OpenTransaction[] = []

    for (const stacks of Object.values(stacksByAccount.value)) {
      for (const stack of stacks) {
        result.push(...stack.items)
      }
    }

    return result
  })

  /**
   * 5. METRICS (cheap derivations)
   */
  const shownSamleposter = computed(() => stacked.value.shownSamleposter)

  const totalSamleposter = computed(() =>
    stacked.value.totalSamleposter,
  )

  const totalTransactions = computed(() =>
    stacked.value.totalTransactions,
  )

  const pageLimit = computed(() =>
    data.value.limit ?? transactions.value.length,
  )

  const isCapped = computed(() =>
    totalSamleposter.value > shownSamleposter.value &&
    shownSamleposter.value >= pageLimit.value,
  )

  return {
    pending,
    refresh,

    // core
    items,
    stacks,
    stacksByAccount,
    transactions,

    // meta
    totalTransactions,
    totalSamleposter,
    shownSamleposter,
    pageLimit,
    isCapped,
  }
}