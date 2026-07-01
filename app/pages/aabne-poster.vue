<script lang="ts" setup>
import { h } from 'vue'
import { today } from '@internationalized/date'
import type { TableColumn } from '@nuxt/ui'
import { DEFAULT_TIME_ZONE } from '~/utils'
import BookingModal from '~/components/open-items/BookingModal.vue'
import BookingSummaryCard from '~/components/open-items/BookingSummaryCard.vue'
import { TRANSACTION_BADGE_COLUMN_CLASS, TRANSACTION_BADGE_STYLE } from '~/lib/presenters/transactionBadgeStyles'
import { formatTransactionFieldHint } from '~/lib/presenters/transactionFieldHints'
import { extractSummaryCategoryEntries, type TransactionSummaryCategoryKey } from '~/lib/presenters/transactionSummaryEntries'
import { useOpenTransactions } from '~/composables/useOpenTransactions'
import type { OpenTransaction, TransactionSummary } from '~/types/transactions'

const appConfig = useAppConfig()
const UBadge = resolveComponent('UBadge')

const endDefault = today(DEFAULT_TIME_ZONE)
const startDefault = endDefault.subtract({ days: 29 })

const defaultRange = {
  start: startDefault,
  end: endDefault
}

const dateRange = ref<any>(defaultRange)

function toDateOnlyParam(value: unknown): string | undefined {
  if (!value) return undefined
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined
    return value.toISOString().slice(0, 10)
  }
  if (typeof value === 'object' && value && 'toString' in (value as any)) {
    const asText = String((value as any).toString?.() ?? '').trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(asText)) return asText
  }
  const trimmed = String(value).trim()
  if (!trimmed.length) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toISOString().slice(0, 10)
}

const start = computed(() => toDateOnlyParam(dateRange.value?.start))
const end = computed(() => toDateOnlyParam(dateRange.value?.end))

// Source of truth: selected account IDs (strings)
const selectedAccountIds = ref<string[]>([])
const tableSearchValue = ref('')
const openItemsSearch = computed(() => tableSearchValue.value.trim())

const page = ref(1)
const pageSize = ref(25)
const pageSizeOptions = [5, 10, 25, 50].map((value) => ({
  label: `${value} pr. side`,
  value,
}))

const {
  pending,
  refresh,
  transactions,
  shownSamleposter,
  totalSamleposter,
  isCapped,
  stacksByAccount
} = useOpenTransactions({
  start,
  end,
  accountIds: selectedAccountIds,
  search: openItemsSearch,
})

const isBookingOpen = ref(false)
const useTableView = ref(false)

const expandedTableStackIds = ref<Record<string, boolean>>({})
const selectedTransactionId = ref<string | null>(null)
const selectedGroupTransactions = ref<OpenTransaction[] | null>(null)

const selectedTransaction = computed(() =>
  transactions.value.find((tx) => tx.id === selectedTransactionId.value) ?? null
)

const modalTransaction = computed<OpenTransaction | null>(() => {
  if ((selectedGroupTransactions.value?.length ?? 0) > 1) {
    return toGroupedModalTransaction(selectedGroupTransactions.value ?? [])
  }
  return selectedTransaction.value
})

type OpenTransactionStack = {
  stackId: string
  groupKey: string | null
  items: OpenTransaction[]
  representative: OpenTransaction
  totalAmount: number
  isGrouped: boolean
}

function toggleTableStack(stackId: string) {
  expandedTableStackIds.value[stackId] = !expandedTableStackIds.value[stackId]
}

function isTableStackExpanded(stackId: string): boolean {
  return expandedTableStackIds.value[stackId] ?? false
}

function formatSignedDkk(amount: number): string {
  const value = Number(amount) || 0
  if (value < 0) return `-${dkkFormatter.format(Math.abs(value))}`
  if (value > 0) return `+${dkkFormatter.format(value)}`
  return dkkFormatter.format(0)
}

type OpenItemsTableRow = {
  stackId: string
  bookingDate: string
  account: string
  amount: number
  counterpartEntries: Array<{ value: string; hint?: string }>
  transactionTypeEntries: Array<{ value: string; hint?: string }>
  referenceEntries: Array<{ value: string; hint?: string }>
  notePreview: string | null
  category: 'Samlepost' | 'Enkeltpost'
  lineCount: number
  stack: OpenTransactionStack
}

type OpenItemsListCategory = 'counterpart' | 'transactionType' | 'reference'

const openItemsCategoryMap: Record<OpenItemsListCategory, TransactionSummaryCategoryKey> = {
  counterpart: 'part',
  transactionType: 'transaktionstype',
  reference: 'reference',
}

function extractEntriesForCategory(summary: TransactionSummary, category: OpenItemsListCategory): Array<{ value: string; hint?: string }> {
  const sectionKey = openItemsCategoryMap[category]
  return extractSummaryCategoryEntries(summary, sectionKey)
}

const tableRows = computed<OpenItemsTableRow[]>(() => {
  const buckets = Object.values(stacksByAccount.value) as OpenTransactionStack[][]

  return buckets
    .flatMap((stacks) => stacks)
    .map((stack) => {
      const representative = stack.representative
      const summary = toStackSummary(stack)
      const referenceEntries = stack.items.length > 1
        ? []
        : extractEntriesForCategory(summary, 'reference')
      const counterpartEntries = extractEntriesForCategory(summary, 'counterpart')
      const transactionTypeEntries = extractEntriesForCategory(summary, 'transactionType')

      return {
        stackId: stack.stackId,
        bookingDate: representative.bookingDate,
        account: representative.bankAccountName ?? representative.accountId,
        amount: stack.items.length > 1 ? stack.totalAmount : representative.amount,
        counterpartEntries,
        transactionTypeEntries,
        referenceEntries,
        notePreview: stackNotePreview(stack),
        category: stack.items.length > 1 ? 'Samlepost' : 'Enkeltpost',
        lineCount: stack.items.length,
        stack,
      }
    })
})

const pagedTableRows = computed<OpenItemsTableRow[]>(() => {
  const start = (page.value - 1) * pageSize.value
  const end = start + pageSize.value
  return tableRows.value.slice(start, end)
})

const filteredTableRows = computed<OpenItemsTableRow[]>(() => tableRows.value)

const tablePageCount = computed<number>(() => Math.max(1, Math.ceil(tableRows.value.length / pageSize.value)))

watch([tableSearchValue, pageSize], () => {
  page.value = 1
})

watch(tablePageCount, (count) => {
  if (page.value > count) {
    page.value = count
  }
})

watch(useTableView, (enabled) => {
  if (enabled) {
    page.value = 1
  }
  expandedTableStackIds.value = {}
})

const expandedTableRows = computed<OpenItemsTableRow[]>(() => {
  return pagedTableRows.value.filter((row) => row.stack.items.length > 1 && isTableStackExpanded(row.stackId))
})

const skeletonTableRows = Array.from({ length: 8 }, (_, index) => `skeleton-table-row-${index + 1}`)
const skeletonCardRows = Array.from({ length: 6 }, (_, index) => `skeleton-card-${index + 1}`)

const dkkFormatter = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
})

const columns: TableColumn<OpenItemsTableRow>[] = [
  { // Banking date
    accessorKey: 'bookingDate',
    header: 'Dato',
    cell: ({ row }) => {
      return new Date(row.original.bookingDate).toLocaleString('da-DK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    },
  },
  { // Bank account
    accessorKey: 'account',
    header: 'Konto',
    cell: ({ row }) => {
      const value = row.original.account
      if (!value) return '-'

      return h('div', { class: TRANSACTION_BADGE_COLUMN_CLASS }, [
        h(UBadge, { variant: 'subtle', color: 'neutral' }, () => value),
      ])
    },
  },
  { // Amount
    accessorKey: 'amount',
    header: 'Beløb',
    size: 140,
    cell: ({ row }) => h('span', { class: 'font-bold' }, formatSignedDkk(row.original.amount)),
  },
  { // Counterparty
    accessorKey: 'counterpartEntries',
    header: 'Modpart',
    cell: ({ row }) => {
      const entries = row.original.counterpartEntries
      if (!entries.length) return '-'

      return h(
        'div',
        { class: TRANSACTION_BADGE_COLUMN_CLASS },
        entries.map((entry, index) =>
          h(UBadge, {
            key: `counterpart-${index}`,
            class: TRANSACTION_BADGE_STYLE.counterpart.class,
            variant: TRANSACTION_BADGE_STYLE.counterpart.variant,
            color: TRANSACTION_BADGE_STYLE.counterpart.color,
            title: formatTransactionFieldHint(entry.hint),
          }, () => entry.value),
        ),
      )
    },
  },
  { // References
    accessorKey: 'referenceEntries',
    header: 'Reference',
    cell: ({ row }) => {
      const entries = row.original.referenceEntries
      if (!entries.length) return '-'

      return h(
        'div',
        { class: TRANSACTION_BADGE_COLUMN_CLASS },
        entries.map((entry, index) =>
          h(UBadge, {
            key: `reference-${index}`,
            class: TRANSACTION_BADGE_STYLE.freeTextOrReference.class,
            variant: TRANSACTION_BADGE_STYLE.freeTextOrReference.variant,
            color: TRANSACTION_BADGE_STYLE.freeTextOrReference.color,
            title: formatTransactionFieldHint(entry.hint),
          }, () => entry.value),
        ),
      )
    },
  },
  { // Transaction type
    accessorKey: 'transactionTypeEntries',
    header: 'Transaktionstype',
    cell: ({ row }) => {
      const entries = row.original.transactionTypeEntries
      if (!entries.length) return '-'

      return h(
        'div',
        { class: TRANSACTION_BADGE_COLUMN_CLASS },
        entries.map((entry, index) =>
          h(UBadge, {
            key: `transaction-type-${index}`,
            class: TRANSACTION_BADGE_STYLE.transactionType.class,
            variant: TRANSACTION_BADGE_STYLE.transactionType.variant,
            color: TRANSACTION_BADGE_STYLE.transactionType.color,
            title: formatTransactionFieldHint(entry.hint),
          }, () => entry.value),
        ),
      )
    },
  },
  { // Category (samlepost vs. enkeltpost)
    accessorKey: 'category',
    header: 'Kategori',
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2' }, [
      h(UBadge, {
        variant: 'subtle',
        color: 'neutral',
      }, () => row.original.category),
      h('span', { class: 'text-xs text-muted' }, `${row.original.lineCount} linje${row.original.lineCount === 1 ? '' : 'r'}`),
    ]),
  },
  { // Notat preview
    accessorKey: 'notePreview',
    header: 'Notat',
    cell: ({ row }) => {
      const notePreview = row.original.notePreview
      if (!notePreview) return '-'

      return h('span', {
        class: 'line-clamp-2 text-sm text-muted',
        title: notePreview,
      }, notePreview)
    },
  },
  { // Actions
    id: 'actions',
    header: 'Handling',
    cell: ({ row }) => {
      const stack = row.original.stack
      const isGrouped = stack.items.length > 1

      return h('div', { class: 'flex gap-2' }, [
        h(resolveComponent('UButton'), {
          size: 'sm',
          color: 'primary',
          variant: 'soft',
          trailingIcon: appConfig.ui.icons.edit,
          onClick: () => {
            if (isGrouped) {
              openGroupedBookingModal(stack.items)
              return
            }
            openBookingModal(stack.representative)
          },
        }, () => 'Behandl'),
      ])
    },
  },
]

function toStackSummary(stack: OpenTransactionStack): TransactionSummary {
  if (!stack.isGrouped || stack.items.length <= 1) {
    return stack.representative.summary
  }

  const base = stack.representative.summary
  const lineCount = stack.items.length

  return {
    ...base,
    sections: base.sections.filter((section) => section.key !== 'reference' && section.key !== 'teknisk'),
    amount: {
      ...base.amount,
      raw: stack.totalAmount,
      value: formatSignedDkk(stack.totalAmount),
    },
    transactionId: {
      ...base.transactionId,
      value: `Samlepost (${lineCount} linjer)`,
    },
  }
}

function toGroupedModalTransaction(items: OpenTransaction[]): OpenTransaction | null {
  if (items.length === 0) return null
  if (items.length === 1) return items[0] ?? null

  const representative = items[0]
  if (!representative) return null

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const base = representative.summary

  return {
    ...representative,
    amount: totalAmount,
    summary: {
      ...base,
      sections: base.sections.filter((section) => section.key !== 'reference' && section.key !== 'teknisk'),
      amount: {
        ...base.amount,
        raw: totalAmount,
        value: formatSignedDkk(totalAmount),
      },
      transactionId: {
        ...base.transactionId,
        value: `Samlepost (${items.length} linjer)`,
      },
    },
  }
}

function openBookingModal(transaction: OpenTransaction) {
  selectedGroupTransactions.value = null
  selectedTransactionId.value = transaction.id
  isBookingOpen.value = true
}

function openGroupedBookingModal(items: OpenTransaction[]) {
  selectedGroupTransactions.value = items
  selectedTransactionId.value = items[0]?.id ?? null
  isBookingOpen.value = true
}

function stackNotePreview(stack: OpenTransactionStack): string | null {
  const notes = stack.items
    .map((item) => String(item.draftNote ?? '').trim())
    .filter((value) => value.length > 0)

  if (!notes.length) return null
  if (notes.length === 1) return notes[0] ?? null

  const first = notes[0] ?? ''
  return `${first} (+${notes.length - 1} notat${notes.length - 1 === 1 ? '' : 'er'})`
}

async function handleBookingProcessed() {
  isBookingOpen.value = false
  selectedTransactionId.value = null
  selectedGroupTransactions.value = null
  await refresh()
}

function handleDraftSaved(payload: { transactionId: string; note: string | null }) {
  const tx = transactions.value.find((entry) => entry.id === payload.transactionId)
  if (tx) {
    tx.draftNote = payload.note
  }

  if (selectedGroupTransactions.value?.length) {
    for (const entry of selectedGroupTransactions.value) {
      if (entry.id === payload.transactionId) {
        entry.draftNote = payload.note
      }
    }
  }
}

const tableUi = {
  base: 'border-separate border-spacing-0',
  thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
  tbody: '[&>tr]:last:[&>td]:border-b-0',
  tr: 'group',
  th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
  td: 'align-top group-has-[td:not(:empty)]:border-b border-default',
  separator: 'h-0',
}
</script>

<template>
  <UDashboardPanel id="open-items">
      <template #header>
        <UDashboardNavbar title="Åbne poster">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <div class="flex items-center gap-3">
              <span class="text-xs text-muted">Kort</span>
              <USwitch v-model="useTableView" />
              <span class="text-xs text-muted">Liste</span>
            </div>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div v-if="!pending && !transactions.length" class="py-10 text-center text-gray-500">
          Der er ingen åbne transaktioner at behandle.
        </div>
        <template v-else>
          <!-- Transaction amount info -->
          <div v-if="isCapped && !useTableView" class="relative z-40 mb-6 w-full">
            <UAlert
              class="w-full"
              color="warning"
              variant="soft"
              :icon="appConfig.ui.icons.warning"
              :ui="{ title: 'text-left', description: 'text-left' }"
            >
              <template #title>
                Viser {{ shownSamleposter }} af {{ totalSamleposter }} posteringer
              </template>
            </UAlert>
          </div>

          <template v-if="useTableView">
            <FiltersRow
              v-model:account-ids="selectedAccountIds"
              v-model:search="tableSearchValue"
              v-model:date-range="dateRange"
              :reset-date-range="defaultRange"
              :time-zone="DEFAULT_TIME_ZONE"
              :show-search="true"
              search-placeholder="Søg i åbne poster..."
            />

            <div v-if="dateRange?.start && dateRange?.end" class="mb-3 mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="text-sm text-muted">
                <template v-if="pending">
                  <USkeleton class="h-4 w-56" />
                </template>
                <template v-else>
                  Viser {{ pagedTableRows.length }} af {{ totalSamleposter }} posteringer
                </template>
              </div>

              <USelect
                v-model="pageSize"
                :items="pageSizeOptions"
                labelKey="label"
                valueKey="value"
                class="w-full sm:w-28"
                :disabled="pending"
              />
            </div>

            <template v-if="pending">
              <UCard variant="subtle" :ui="{ body: 'p-0 overflow-hidden' }">
                <div class="divide-y divide-default">
                  <div v-for="rowKey in skeletonTableRows" :key="rowKey" class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-3">
                    <USkeleton class="h-4 w-20" />
                    <USkeleton class="h-4 w-28" />
                    <USkeleton class="h-4 w-24" />
                    <USkeleton class="h-4 w-28" />
                    <USkeleton class="h-4 w-36" />
                    <USkeleton class="h-8 w-20" />
                  </div>
                </div>
              </UCard>
            </template>
            <UTable
              v-else
              :data="pagedTableRows"
              :columns="columns"
              :ui="tableUi"
            />

            <div v-if="filteredTableRows.length > pageSize" class="mt-4 flex items-center border-t border-default pt-4">
              <div class="flex-1" />
              <div class="flex flex-1 justify-center">
                <UPagination
                  :default-page="page"
                  :items-per-page="pageSize"
                  :total="filteredTableRows.length"
                  @update:page="(value) => (page = value)"
                />
              </div>
              <div class="flex-1" />
            </div>
          </template>

          <!-- Card view -->
          <template v-else>
            <template v-if="pending">
              <div class="columns-1 md:columns-2 xl:columns-3 [column-gap:1.5rem]">
                <UCard
                  v-for="cardKey in skeletonCardRows"
                  :key="cardKey"
                  variant="subtle"
                  class="mb-6 break-inside-avoid"
                  :ui="{ body: 'space-y-3 p-5' }"
                >
                  <USkeleton class="h-4 w-24" />
                  <USkeleton class="h-8 w-40" />
                  <USkeleton class="h-4 w-full" />
                  <USkeleton class="h-4 w-5/6" />
                  <USkeleton class="h-10 w-full" />
                </UCard>
              </div>
            </template>
            <UPageSection
              v-else
              v-for="(stacks, accountKey) in stacksByAccount"
              :key="accountKey"
              :title="stacks[0]?.representative.accountId ?? accountKey"
              :headline="stacks[0]?.representative.bankAccountName ?? 'Nordea'"
            >
              <template #description>
                {{ stacks.length }} {{ stacks.length === 1 ? 'poster' : 'poster' }}
              </template>
              <div class="columns-1 md:columns-2 xl:columns-3 [column-gap:1.5rem]">
                <div
                  v-for="stack in stacks"
                  :key="stack.stackId"
                  class="relative isolate mb-6 w-full min-w-0 break-inside-avoid"
                  :class="stack.items.length > 1 ? 'pr-2 pt-2' : ''"
                >
                  <div class="relative">
                    <div
                      v-if="stack.items.length > 1"
                      class="pointer-events-none absolute inset-0 z-0 -translate-y-1 translate-x-1 rounded-xl border border-default/60 bg-accented"
                    />

                    <div class="relative z-20 rounded-xl border border-default/60 bg-default">
                      <BookingSummaryCard :summary="toStackSummary(stack)" :hide-section-keys="['teknisk']">
                      <template #footer>
                        <div class="mt-4 space-y-3">
                          <UAlert
                            v-if="stackNotePreview(stack)"
                            color="primary"
                            variant="soft"
                            :icon="appConfig.ui.icons.notes"
                            title="Notat"
                            :description="stackNotePreview(stack) ?? ''"
                          />

                          <div v-if="stack.items.length > 1" class="space-y-3">
                            <div class="flex items-center justify-center">
                              <UBadge color="neutral" variant="subtle" size="sm">
                                Samlepost · {{ stack.items.length }} poster
                              </UBadge>
                            </div>

                            <div
                              class="grid grid-cols-1 gap-2"
                            >
                              <UButton
                                class="font-bold"
                                color="primary"
                                variant="solid"
                                size="lg"
                                block
                                :trailing-icon="appConfig.ui.icons.edit"
                                @click="openGroupedBookingModal(stack.items)"
                              >
                                Behandl
                              </UButton>
                            </div>
                          </div>

                          <div v-if="stack.items.length <= 1" class="grid grid-cols-1 gap-2">
                            <UButton
                              class="w-full justify-center font-bold"
                              color="primary"
                              variant="solid"
                              size="lg"
                              block
                              :trailing-icon="appConfig.ui.icons.edit"
                              @click="openBookingModal(stack.representative)"
                            >
                              Behandl
                            </UButton>
                          </div>

                        </div>
                      </template>
                      </BookingSummaryCard>
                    </div>
                  </div>
                </div>
              </div>
            </UPageSection>
          </template>
        </template>
      </template>
  </UDashboardPanel>
  <BookingModal
    v-model:open="isBookingOpen"
    :transaction="modalTransaction"
    :group-transactions="selectedGroupTransactions"
    @processed="handleBookingProcessed"
    @draft-saved="handleDraftSaved"
  />
</template>