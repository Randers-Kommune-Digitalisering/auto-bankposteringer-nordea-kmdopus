import { computed } from 'vue'
import useFlattenArray from '~/composables/useFlattenArray'
import type { OpenTransaction } from '~/types/transactions'

type AccountBuckets = Record<string, OpenTransaction[]>

export async function useOpenTransactions() {
  const { data, pending, refresh } = await useFetch<OpenTransaction[]>(
    '/api/transactions',
    { key: 'open-transactions', lazy: false }
  )

  const transactions = computed<OpenTransaction[]>(() => useFlattenArray<OpenTransaction>(data))

  const groupedByAccount = computed<AccountBuckets>(() => {
    const buckets: AccountBuckets = {}
    transactions.value.forEach((tx) => {
      const accountName = tx.bankAccountName || 'Ukendt konto'
      if (!buckets[accountName]) {
        buckets[accountName] = []
      }
      buckets[accountName].push(tx)
    })
    return buckets
  })

  return {
    pending,
    refresh,
    transactions,
    groupedByAccount
  }
}
