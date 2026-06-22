<script lang="ts" setup>
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import BookingModal from '~/components/open-items/BookingModal.vue'
import BookingSummaryCard from '~/components/open-items/BookingSummaryCard.vue'
import { TRANSACTION_BADGE_COLUMN_CLASS, TRANSACTION_BADGE_STYLE } from '~/lib/presenters/transactionBadgeStyles'
import { formatTransactionFieldHint } from '~/lib/presenters/transactionFieldHints'
import { extractSummaryCategoryEntries, type TransactionSummaryCategoryKey } from '~/lib/presenters/transactionSummaryEntries'
import { useOpenTransactions } from '~/composables/useOpenTransactions'
import type { OpenTransaction, TransactionSummary } from '~/types/transactions'

const appConfig = useAppConfig()
const UBadge = resolveComponent('UBadge')

const {
  pending,
  refresh,
  transactions,
  totalTransactions,
  shownTopTransactions,
  totalTopTransactions,
  pageLimit,
  isCapped,
  stacksByAccount
} = useOpenTransactions()

const { data: openItemsSettings } = useFetch<{ allowIndividualGroupedProcessing: boolean }>(
  '/api/settings/open-items',
  {
    key: 'open-items-settings',
    default: () => ({ allowIndividualGroupedProcessing: false }),
  },
)

const isBookingOpen = ref(false)
const useTableView = ref(false)
const tableSearchValue = ref('')
const tablePage = ref(1)
const tablePageSize = ref(25)
const tablePageSizeOptions = [5, 10, 25, 50].map((value) => ({
  label: `${value} pr. side`,
  value,
}))
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

const allowIndividualGroupedProcessing = computed(
  () => openItemsSettings.value?.allowIndividualGroupedProcessing ?? false,
)

type OpenTransactionStack = {
  stackId: string
  groupKey: string | null
  items: OpenTransaction[]
  representative: OpenTransaction
  totalAmount: number
  isGrouped: boolean
}

const expandedStackIds = ref<Record<string, boolean>>({})

function toggleStack(stackId: string) {
  expandedStackIds.value[stackId] = !expandedStackIds.value[stackId]
}

function isStackExpanded(stackId: string): boolean {
  return expandedStackIds.value[stackId] ?? false
}

function toggleTableStack(stackId: string) {
  expandedTableStackIds.value[stackId] = !expandedTableStackIds.value[stackId]
}

function isTableStackExpanded(stackId: string): boolean {
  return expandedTableStackIds.value[stackId] ?? false
}

const dkkFormatter = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
})

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

function buildSearchFlatValue(row: OpenItemsTableRow): string {
  return [
    row.bookingDate,
    row.account,
    String(row.amount),
    row.counterpartEntries.map((entry) => entry.value).join(' '),
    row.transactionTypeEntries.map((entry) => entry.value).join(' '),
    row.referenceEntries.map((entry) => entry.value).join(' '),
    row.notePreview,
    row.category,
    String(row.lineCount),
  ]
    .map((value) => String(value ?? '').trim())
    .filter((value) => Boolean(value))
    .join(' ')
}

const normalizedTableSearch = computed(() => tableSearchValue.value.trim().toLowerCase())

const filteredTableRows = computed<OpenItemsTableRow[]>(() => {
  if (!normalizedTableSearch.value.length) {
    return tableRows.value
  }

  return tableRows.value.filter((row) =>
    buildSearchFlatValue(row).toLowerCase().includes(normalizedTableSearch.value),
  )
})

const pagedTableRows = computed<OpenItemsTableRow[]>(() => {
  const start = (tablePage.value - 1) * tablePageSize.value
  const end = start + tablePageSize.value
  return filteredTableRows.value.slice(start, end)
})

const tablePageCount = computed<number>(() => Math.max(1, Math.ceil(filteredTableRows.value.length / tablePageSize.value)))

watch([tableSearchValue, tablePageSize], () => {
  tablePage.value = 1
})

watch(tablePageCount, (count) => {
  if (tablePage.value > count) {
    tablePage.value = count
  }
})

watch(useTableView, (enabled) => {
  if (enabled) {
    tablePage.value = 1
  }
  expandedTableStackIds.value = {}
})

const expandedTableRows = computed<OpenItemsTableRow[]>(() => {
  if (!allowIndividualGroupedProcessing.value) {
    return []
  }

  return pagedTableRows.value.filter((row) => row.stack.items.length > 1 && isTableStackExpanded(row.stackId))
})

const skeletonTableRows = Array.from({ length: 8 }, (_, index) => `skeleton-table-row-${index + 1}`)
const skeletonCardRows = Array.from({ length: 6 }, (_, index) => `skeleton-card-${index + 1}`)

const tableColumns: TableColumn<OpenItemsTableRow>[] = [
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
    cell: ({ row }) => h('span', { class: 'font-bold' }, dkkFormatter.format(row.original.amount)),
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
  { // Kategori (samlepost vs. enkeltpost)
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
        isGrouped && allowIndividualGroupedProcessing.value
          ? h(resolveComponent('UButton'), {
            size: 'xs',
            color: 'neutral',
            variant: 'outline',
            icon: isTableStackExpanded(row.original.stackId)
              ? appConfig.ui.icons.arrowUp
              : appConfig.ui.icons.arrowDown,
            onClick: () => toggleTableStack(row.original.stackId),
          }, () => (isTableStackExpanded(row.original.stackId) ? 'Skjul linjer' : 'Vis linjer'))
          : null,
      ])
    },
  },
]

const tableUi = {
  base: 'border-separate border-spacing-0',
  thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
  tbody: '[&>tr]:last:[&>td]:border-b-0',
  tr: 'group',
  th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
  td: 'align-top group-has-[td:not(:empty)]:border-b border-default',
  separator: 'h-0',
}

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
      value: dkkFormatter.format(stack.totalAmount),
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
        value: dkkFormatter.format(totalAmount),
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
          <div v-if="isCapped && !useTableView" class="relative z-40 mb-6 w-full">
            <UAlert
              class="w-full"
              color="warning"
              variant="soft"
              :icon="appConfig.ui.icons.warning"
              :ui="{ title: 'text-left', description: 'text-left' }"
            >
              <template #title>
                Viser {{ shownTopTransactions }} af {{ totalTopTransactions }} posteringer
              </template>
            </UAlert>
          </div>

          <template v-if="useTableView">
            <FiltersRow
              v-model:search="tableSearchValue"
              :show-search="true"
              :show-accounts="false"
              :show-date="false"
              search-placeholder="Søg i åbne poster..."
            />

            <div class="mb-3 mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="text-sm text-muted">
                <template v-if="pending">
                  <USkeleton class="h-4 w-56" />
                </template>
                <template v-else>
                  Viser {{ pagedTableRows.length }} af {{ totalTopTransactions }} posteringer
                </template>
              </div>

              <USelect
                v-model="tablePageSize"
                :items="tablePageSizeOptions"
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
              :columns="tableColumns"
              :ui="tableUi"
            />

            <div v-if="expandedTableRows.length" class="mt-4 space-y-3">
              <UCard
                v-for="row in expandedTableRows"
                :key="`expanded-${row.stackId}`"
                variant="soft"
                :ui="{ body: 'space-y-3 p-4' }"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="text-sm font-semibold">
                    {{ row.account }} · {{ row.lineCount }} linjer
                  </div>
                  <UBadge color="neutral" variant="subtle" size="sm">
                    Samlepost
                  </UBadge>
                </div>

                <UAlert
                  v-if="stackNotePreview(row.stack)"
                  color="primary"
                  variant="soft"
                  :icon="appConfig.ui.icons.notes"
                  title="Notat"
                  :description="stackNotePreview(row.stack) ?? ''"
                />

                <div class="space-y-2">
                  <div
                    v-for="member in row.stack.items"
                    :key="member.id"
                    class="flex items-center justify-between gap-2 rounded-md border border-default/60 bg-default px-3 py-2"
                  >
                    <div class="text-sm">
                      {{ member.summary.amount.value }}
                    </div>
                    <UButton
                      size="xs"
                      color="primary"
                      variant="soft"
                      @click="openBookingModal(member)"
                    >
                      Behandl linje
                    </UButton>
                  </div>
                </div>
              </UCard>
            </div>

            <div v-if="filteredTableRows.length > tablePageSize" class="mt-4 flex items-center border-t border-default pt-4">
              <div class="flex-1" />
              <div class="flex flex-1 justify-center">
                <UPagination
                  :default-page="tablePage"
                  :items-per-page="tablePageSize"
                  :total="filteredTableRows.length"
                  @update:page="(value) => (tablePage = value)"
                />
              </div>
              <div class="flex-1" />
            </div>
          </template>

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
                              :class="allowIndividualGroupedProcessing ? 'sm:grid-cols-2' : ''"
                            >
                              <UButton
                                v-if="allowIndividualGroupedProcessing"
                                class="w-full justify-center font-semibold"
                                color="neutral"
                                variant="outline"
                                size="lg"
                                :icon="isStackExpanded(stack.stackId) ? appConfig.ui.icons.arrowUp : appConfig.ui.icons.arrowDown"
                                @click="toggleStack(stack.stackId)"
                              >
                                {{ isStackExpanded(stack.stackId) ? 'Skjul poster' : 'Vis poster' }}
                              </UButton>
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

                          <UAlert
                            v-if="stack.items.length > 1 && !allowIndividualGroupedProcessing"
                            color="warning"
                            variant="soft"
                            :icon="appConfig.ui.icons.lock"
                            title="Individuel behandling er slået fra"
                          />

                          <div v-if="stack.items.length <= 1" class="grid grid-cols-1 gap-2">
                            <UButton
                              class="w-full justify-center font-bold"
                              color="primary"
                              variant="solid"
                              size="lg"
                              block
                              :trailing-icon="appConfig.ui.icons.edit"
                              @click="stack.items.length > 1 && allowIndividualGroupedProcessing ? openGroupedBookingModal(stack.items) : openBookingModal(stack.representative)"
                            >
                              Behandl
                            </UButton>
                          </div>

                          <UCard
                            v-if="stack.items.length > 1 && allowIndividualGroupedProcessing && isStackExpanded(stack.stackId)"
                            variant="soft"
                            :ui="{ body: 'space-y-2 p-2' }"
                          >
                            <div
                              v-for="member in stack.items"
                              :key="member.id"
                              class="flex items-center justify-between gap-2"
                            >
                              <span class="text-sm font-medium">{{ member.summary.amount.value }}</span>
                              <UButton
                                size="xs"
                                color="primary"
                                variant="soft"
                                :disabled="!allowIndividualGroupedProcessing"
                                @click="openBookingModal(member)"
                              >
                                Behandl linje
                              </UButton>
                            </div>
                          </UCard>
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