import { computed } from 'vue'
import type { OpenTransaction, OpenTransactionStack, OpenTransactionsResponse } from '~/types/transactions'

type AccountStackBuckets = Record<string, OpenTransactionStack[]>

function toStackId(tx: OpenTransaction): string {
  return tx.groupKey ? `group:${tx.groupKey}` : `single:${tx.id}`
}

export async function useOpenTransactions() {
  const { data: rawData, pending, refresh } = await useFetch<OpenTransactionsResponse | OpenTransaction[]>(
    '/api/transactions',
    {
      key: 'open-transactions',
      lazy: false,
      deep: true,
      transform: (v) => {
        if (Array.isArray(v)) {
          return {
            items: v.slice(),
            stacks: undefined,
            groupedStacksByAccount: undefined,
            total: v.length,
            limit: v.length,
            totalTopTransactions: new Set(
              v.map((entry) => toStackId(entry)),
            ).size,
          }
        }
        return {
          items: Array.isArray(v?.items) ? v.items.slice() : [],
          stacks: Array.isArray(v?.stacks) ? v.stacks : undefined,
          groupedStacksByAccount: v?.groupedStacksByAccount && typeof v.groupedStacksByAccount === 'object'
            ? v.groupedStacksByAccount
            : undefined,
          total: typeof v?.total === 'number' ? v.total : 0,
          limit: typeof v?.limit === 'number' ? v.limit : 0,
          totalTopTransactions: typeof v?.totalTopTransactions === 'number' ? v.totalTopTransactions : undefined,
        }
      },
    }
  )

  const data = computed<OpenTransactionsResponse>(() => {
    const value = rawData.value
    if (Array.isArray(value)) {
      return {
        items: value,
        stacks: undefined,
        groupedStacksByAccount: undefined,
        total: value.length,
        limit: value.length,
        totalTopTransactions: new Set(
          value.map((entry) => toStackId(entry)),
        ).size,
      }
    }

    return {
      items: Array.isArray(value?.items) ? value.items : [],
      stacks: Array.isArray(value?.stacks) ? value.stacks : undefined,
      groupedStacksByAccount: value?.groupedStacksByAccount && typeof value.groupedStacksByAccount === 'object'
        ? value.groupedStacksByAccount
        : undefined,
      total: typeof value?.total === 'number' ? value.total : 0,
      limit: typeof value?.limit === 'number' ? value.limit : 0,
      totalTopTransactions: typeof value?.totalTopTransactions === 'number' ? value.totalTopTransactions : undefined,
    }
  })

  const stacks = computed<OpenTransactionStack[]>(() => {
    if (Array.isArray(data.value.stacks)) {
      return data.value.stacks
    }

    const byStack = new Map<string, OpenTransactionStack>()
    for (const tx of data.value.items ?? []) {
      const stackId = toStackId(tx)
      const existing = byStack.get(stackId)
      if (!existing) {
        byStack.set(stackId, {
          stackId,
          groupKey: tx.groupKey,
          items: [tx],
          representative: tx,
          totalAmount: tx.amount,
          isGrouped: Boolean(tx.groupKey),
        })
        continue
      }

      existing.items.push(tx)
      existing.totalAmount += tx.amount
    }

    return Array.from(byStack.values())
  })

  const stacksByAccount = computed<AccountStackBuckets>(() => {
    if (data.value.groupedStacksByAccount) {
      return data.value.groupedStacksByAccount
    }

    const buckets: AccountStackBuckets = {}
    for (const stack of stacks.value) {
      const accountKey = stack.representative.bankAccountName || 'Ukendt konto'
      if (!buckets[accountKey]) {
        buckets[accountKey] = []
      }
      buckets[accountKey]!.push(stack)
    }

    return buckets
  })

  const transactions = computed<OpenTransaction[]>(() => {
    return Object.values(stacksByAccount.value)
      .flatMap((entry) => entry)
      .flatMap((stack) => stack.items)
  })
  const totalTransactions = computed<number>(() => Number(data.value.total ?? transactions.value.length))
  const pageLimit = computed<number>(() => Number(data.value.limit ?? transactions.value.length))
  const shownTopTransactions = computed<number>(() => stacks.value.length)
  const totalTopTransactions = computed<number>(() => Number(data.value.totalTopTransactions ?? shownTopTransactions.value))
  const isCapped = computed<boolean>(() =>
    totalTopTransactions.value > shownTopTransactions.value && shownTopTransactions.value >= pageLimit.value,
  )

  return {
    pending,
    refresh,
    transactions,
    totalTransactions,
    shownTopTransactions,
    totalTopTransactions,
    pageLimit,
    isCapped,
    stacksByAccount,
  }
}
