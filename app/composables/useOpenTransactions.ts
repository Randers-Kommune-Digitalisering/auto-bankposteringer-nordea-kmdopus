import { computed } from 'vue'
import type {
  OpenTransaction,
  OpenTransactionStack,
  OpenTransactionsResponse,
} from '~/types/transactions'

type AccountStackBuckets = Record<string, OpenTransactionStack[]>

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
      totalTopTransactions: 0,
    }
  }

  if (Array.isArray(v)) {
    return {
      items: v,
      stacks: undefined,
      groupedStacksByAccount: undefined,
      total: v.length,
      limit: v.length,
      totalTopTransactions: new Set(v.map(toStackId)).size,
    }
  }

  return {
    items: v.items ?? [],
    stacks: v.stacks,
    groupedStacksByAccount: v.groupedStacksByAccount,
    total: v.total ?? 0,
    limit: v.limit ?? 0,
    totalTopTransactions: v.totalTopTransactions,
  }
}

export function useOpenTransactions() {
  const { data: rawData, pending, refresh } = useFetch<
    OpenTransactionsResponse | OpenTransaction[]
  >('/api/transactions', {
    key: 'open-transactions',
    server: false,
    lazy: false,
    dedupe: 'cancel',
    staleTime: 30_000,
    default: () => normalizeResponse(undefined),
  })

  const data = computed<OpenTransactionsResponse>(() =>
    normalizeResponse(rawData.value),
  )

  /**
   * 1. BASE ITEMS (single source of truth)
   */
  const items = computed<OpenTransaction[]>(() => data.value.items ?? [])

  /**
   * 2. STACKS (either backend or client fallback)
   */
  const stacks = computed<OpenTransactionStack[]>(() => {
    if (data.value.stacks?.length) {
      return data.value.stacks
    }

    const map = new Map<string, OpenTransactionStack>()

    for (const tx of items.value) {
      const id = toStackId(tx)

      const existing = map.get(id)
      if (existing) {
        existing.items.push(tx)
        existing.totalAmount += tx.amount
        continue
      }

      map.set(id, {
        stackId: id,
        groupKey: tx.groupKey,
        items: [tx],
        representative: tx,
        totalAmount: tx.amount,
        isGrouped: !!tx.groupKey,
      })
    }

    return [...map.values()]
  })

  /**
   * 3. BUCKETS (group by account)
   */
  const stacksByAccount = computed<AccountStackBuckets>(() => {
    if (data.value.groupedStacksByAccount) {
      return data.value.groupedStacksByAccount
    }

    const buckets: AccountStackBuckets = {}

    for (const stack of stacks.value) {
      const key = stack.representative.bankAccountName ?? 'Ukendt konto'

      if (!buckets[key]) buckets[key] = []
      buckets[key].push(stack)
    }

    return buckets
  })

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
  const shownTopTransactions = computed(() => stacks.value.length)

  const totalTopTransactions = computed(() =>
    data.value.totalTopTransactions ?? shownTopTransactions.value,
  )

  const totalTransactions = computed(() =>
    data.value.total ?? transactions.value.length,
  )

  const pageLimit = computed(() =>
    data.value.limit ?? transactions.value.length,
  )

  const isCapped = computed(() =>
    totalTopTransactions.value > shownTopTransactions.value &&
    shownTopTransactions.value >= pageLimit.value,
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
    totalTopTransactions,
    shownTopTransactions,
    pageLimit,
    isCapped,
  }
}