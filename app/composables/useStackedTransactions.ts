import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import type {
  OpenTransaction,
  OpenTransactionStack,
  OpenTransactionsResponse,
  StatementTransaction,
} from '~/types/transactions'

export type StackedTransactionsSource = 'open-items' | 'statement'

export type StackedTransactionsStatementPayload = {
  rows: StatementTransaction[]
  total: number
  page: number
  pageSize: number
  totalSamleposter?: number
}

export type StackedTransactionsStack<T> = {
  stackId: string
  groupKey: string | null
  items: T[]
  representative: T
  totalAmount: number
  isGrouped: boolean
}

export type StackedTransactionsResult<T> = {
  items: T[]
  stacks: StackedTransactionsStack<T>[]
  stacksByAccount: Record<string, StackedTransactionsStack<T>[]>
  totalTransactions: number
  totalSamleposter: number
  shownSamleposter: number
}

function toOpenItemStackId(tx: OpenTransaction): string {
  return tx.groupKey ? `group:${tx.groupKey}` : `single:${tx.id}`
}

function toStatementStackId(tx: StatementTransaction): string {
  return tx.samlepostId ?? `single:${tx.id}`
}

function toNumericAmount(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toAccountBucketKey(tx: { bankAccountName: string | null; accountId: string | null }): string {
  return tx.bankAccountName ?? tx.accountId ?? 'Ukendt konto'
}

function groupStacksByAccount<T extends { bankAccountName: string | null; accountId: string | null }>(
  stacks: StackedTransactionsStack<T>[],
): Record<string, StackedTransactionsStack<T>[]> {
  const buckets: Record<string, StackedTransactionsStack<T>[]> = {}

  for (const stack of stacks) {
    const key = toAccountBucketKey(stack.representative)
    if (!buckets[key]) buckets[key] = []
    buckets[key].push(stack)
  }

  return buckets
}

function normalizeOpenItemsResponse(
  input: OpenTransactionsResponse | OpenTransaction[] | null | undefined,
): StackedTransactionsResult<OpenTransaction> {
  if (!input) {
    return {
      items: [],
      stacks: [],
      stacksByAccount: {},
      totalTransactions: 0,
      totalSamleposter: 0,
      shownSamleposter: 0,
    }
  }

  const normalized: OpenTransactionsResponse = Array.isArray(input)
    ? {
        items: input,
        total: input.length,
        limit: input.length,
      }
    : {
        items: input.items ?? [],
        stacks: input.stacks,
        total: input.total ?? 0,
        limit: input.limit ?? 0,
        totalSamleposter: input.totalSamleposter,
      }

  const stacks = normalized.stacks?.length
    ? normalized.stacks
    : (() => {
        const map = new Map<string, StackedTransactionsStack<OpenTransaction>>()
        for (const tx of normalized.items ?? []) {
          const stackId = toOpenItemStackId(tx)
          const existing = map.get(stackId)
          if (existing) {
            existing.items.push(tx)
            existing.totalAmount += tx.amount
            continue
          }

          map.set(stackId, {
            stackId,
            groupKey: tx.groupKey,
            items: [tx],
            representative: tx,
            totalAmount: tx.amount,
            isGrouped: Boolean(tx.groupKey),
          })
        }
        return [...map.values()]
      })()

  const stacksByAccount = normalized.groupedStacksByAccount
    ? (normalized.groupedStacksByAccount as Record<string, StackedTransactionsStack<OpenTransaction>[]>)
    : groupStacksByAccount(stacks)

  const shownSamleposter = stacks.length

  return {
    items: normalized.items ?? [],
    stacks,
    stacksByAccount,
    totalTransactions: normalized.total ?? (normalized.items?.length ?? 0),
    totalSamleposter: normalized.totalSamleposter ?? stacks.length,
    shownSamleposter,
  }
}

function normalizeStatementPayload(
  input: StackedTransactionsStatementPayload | null | undefined,
): StackedTransactionsResult<StatementTransaction> {
  const items = input?.rows ?? []

  const stackMap = new Map<string, StackedTransactionsStack<StatementTransaction>>()
  for (const tx of items) {
    const stackId = toStatementStackId(tx)
    const existing = stackMap.get(stackId)
    if (existing) {
      existing.items.push(tx)
      existing.totalAmount += toNumericAmount(tx.amount)
      continue
    }

    stackMap.set(stackId, {
      stackId,
      groupKey: stackId.startsWith('group:') ? stackId.slice('group:'.length) : null,
      items: [tx],
      representative: tx,
      totalAmount: toNumericAmount(tx.amount),
      isGrouped: stackId.startsWith('group:'),
    })
  }

  const stacks = [...stackMap.values()]
  const shownSamleposter = stacks.length

  return {
    items,
    stacks,
    stacksByAccount: groupStacksByAccount(stacks),
    totalTransactions: input?.total ?? items.length,
    totalSamleposter: input?.totalSamleposter ?? shownSamleposter,
    shownSamleposter,
  }
}

export function useStackedTransactions(input: {
  source: MaybeRefOrGetter<'open-items'>
  openItems: MaybeRefOrGetter<OpenTransactionsResponse | OpenTransaction[] | null | undefined>
}): ReturnType<typeof computed<StackedTransactionsResult<OpenTransaction>>>
export function useStackedTransactions(input: {
  source: MaybeRefOrGetter<'statement'>
  statement: MaybeRefOrGetter<StackedTransactionsStatementPayload | null | undefined>
}): ReturnType<typeof computed<StackedTransactionsResult<StatementTransaction>>>

export function useStackedTransactions(input: {
  source: MaybeRefOrGetter<StackedTransactionsSource>
  openItems?: MaybeRefOrGetter<OpenTransactionsResponse | OpenTransaction[] | null | undefined>
  statement?: MaybeRefOrGetter<StackedTransactionsStatementPayload | null | undefined>
}) {
  return computed(() => {
    const source = toValue(input.source)

    if (source === 'open-items') {
      return normalizeOpenItemsResponse(toValue(input.openItems))
    }

    return normalizeStatementPayload(toValue(input.statement))
  })
}
