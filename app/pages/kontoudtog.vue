<script setup lang="ts">
import { h } from 'vue'
import { today, type DateValue } from '@internationalized/date'
import type { TableColumn } from '@nuxt/ui'
import type { StatementTransaction } from '~/types/transactions'
import { TRANSACTION_BADGE_COLUMN_CLASS, TRANSACTION_BADGE_STYLE } from '~/lib/presenters/transactionBadgeStyles'
import { DEFAULT_TIME_ZONE, formatSignedDkk } from '~/utils'
import { formatTransactionFieldHint } from '~/lib/presenters/transactionFieldHints'
import { toCanonicalReferenceBadgeEntries, toCanonicalValueBadgeEntries, type BadgeEntry } from '~/lib/presenters/referenceBadgeEntries'
import BookingSummaryCard from '~/components/open-items/BookingSummaryCard.vue'
import { useStackedTransactions } from '~/composables/useStackedTransactions'
import { useDebouncedString } from '~/composables/useDebouncedString'
import {
  activateClickableTableRowOnKeydown,
  clickableTableRowsBodyClass,
  createTableRowSelectHandler,
} from '~/composables/useClickableTableRows'
import { fuzzyRankRows } from '~/lib/search/fuzzyRanking'

const appConfig = useAppConfig()
const toast = useToast()
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')

definePageMeta({
  path: '/kontoudtog'
})

const endDefault = today(DEFAULT_TIME_ZONE)
const startDefault = endDefault.subtract({ days: 29 })

const defaultRange = {
  start: startDefault,
  end: endDefault,
}

// shallowRef keeps CalendarDate class identity, which deep ref unwrapping would strip.
const dateRange = shallowRef<{ start: DateValue; end: DateValue }>(defaultRange)

const globalFilterValue = ref('')
const debouncedGlobalFilterValue = useDebouncedString(globalFilterValue, { delayMs: 500 })

const page = ref(1)
const pageSize = ref(25)
const pageSizeOptions = [5, 10, 25, 50].map((value) => ({
  label: `${value} pr. side`,
  value,
}))

// Source of truth: selected account IDs (strings)
const selectedAccountIds = ref<string[]>([])

const start = computed(() => {
  const v = dateRange.value?.start ?? startDefault
  return v.toString()
})

const end = computed(() => {
  const v = dateRange.value?.end ?? endDefault
  return v.toString()
})

const search = computed(() => debouncedGlobalFilterValue.value.trim())
type StatementSortKey = 'transactionType'
const sortKey = ref<StatementSortKey | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')
const transactionTypeFilter = ref<string[]>([])

type StatementPage = {
  rows: StatementTransaction[]
  total: number
  page: number
  pageSize: number
  totalSamleposter?: number
  transactionTypeValues?: string[]
}

function statementQuery(pageNumber: number, requestedPageSize: number) {
  return {
    mode: 'statement',
    start: start.value,
    end: end.value,
    // Pass primitive IDs as a comma-separated string to avoid query serialization pitfalls.
    accountIds: selectedAccountIds.value.length ? selectedAccountIds.value.join(',') : undefined,
    search: search.value.length ? search.value : undefined,
    sortBy: sortKey.value ?? undefined,
    sortDirection: sortKey.value ? sortDirection.value : undefined,
    transactionTypes: transactionTypeFilter.value.length ? transactionTypeFilter.value.join(',') : undefined,
    page: pageNumber,
    pageSize: requestedPageSize,
  }
}

const { data, status, refresh } = await useFetch<StatementPage>('/api/transactions', {
  // A single stable key keeps one cache entry; per-filter keys would replay stale payloads when a
  // previously used filter combination is revisited.
  key: 'statement-transactions',
  query: computed(() => statementQuery(page.value, pageSize.value)),
  watch: [start, end, selectedAccountIds, search, sortKey, sortDirection, transactionTypeFilter, page, pageSize],
  // Avoid "1 tick behind" behavior caused by out-of-order responses when filters change quickly.
  dedupe: 'cancel',
  deep: true,
  transform: (v: StatementPage) => {
    const rows = Array.isArray(v.rows) ? v.rows.slice() : []
    return {
      ...v,
      rows,
    }
  },
  default: () => ({ rows: [], total: 0, page: 1, pageSize: pageSize.value }),
})

watch([start, end, selectedAccountIds, search, sortKey, sortDirection, transactionTypeFilter], () => {
  page.value = 1
})

const pending = computed<boolean>(() => status.value === 'pending')

const statementPayload = computed<StatementPage>(() => ({
  rows: data.value?.rows ?? [],
  total: data.value?.total ?? 0,
  page: data.value?.page ?? 1,
  pageSize: data.value?.pageSize ?? pageSize.value,
  totalSamleposter: data.value?.totalSamleposter,
}))

const stacked = useStackedTransactions({
  source: 'statement',
  statement: statementPayload,
})

const fetchedRows = computed<StatementTransaction[]>(() => stacked.value.items)
const totalRows = computed<number>(() => data.value?.total ?? 0)
const visibleRows = computed<StatementTransaction[]>(() => fetchedRows.value)
const isTransactionSummaryOpen = ref(false)
const selectedTransaction = ref<StatementTransaction | null>(null)
const selectedEntryLabel = ref('')
const selectedUnderlyingTransactionCount = ref(0)
const isExportingCsv = ref(false)

function sortableHeader(label: string, key: StatementSortKey) {
  const isSorted = sortKey.value === key ? sortDirection.value : false

  return h(UDropdownMenu, {
    content: { align: 'start' },
    'aria-label': 'Sorteringsmuligheder',
    items: [
      {
        label: 'Sortér stigende',
        type: 'checkbox',
        icon: appConfig.ui.icons.sortAscending,
        checked: isSorted === 'asc',
        onSelect: () => {
          if (isSorted === 'asc') {
            sortKey.value = null
          } else {
            sortKey.value = key
            sortDirection.value = 'asc'
          }
        },
      },
      {
        label: 'Sortér faldende',
        type: 'checkbox',
        icon: appConfig.ui.icons.sortDescending,
        checked: isSorted === 'desc',
        onSelect: () => {
          if (isSorted === 'desc') {
            sortKey.value = null
          } else {
            sortKey.value = key
            sortDirection.value = 'desc'
          }
        },
      },
    ],
  }, () => h(resolveComponent('UButton'), {
    color: 'neutral',
    variant: 'ghost',
    label,
    icon: isSorted
      ? isSorted === 'asc'
        ? appConfig.ui.icons.sortAscending
        : appConfig.ui.icons.sortDescending
      : appConfig.ui.icons.unsorted,
    class: '-mx-2.5 data-[state=open]:bg-elevated',
    'aria-label': `Sortér efter ${isSorted === 'asc' ? 'faldende' : 'stigende'}`,
  }))
}

const transactionTypeFilterOptions = computed(() => [
  ...Array.from(new Set(data.value?.transactionTypeValues ?? []))
    .sort((left, right) => left.localeCompare(right, 'da'))
    .map((value) => ({ label: value, value })),
])

function buildGroupedRows(
  stacks: typeof stacked.value.stacks,
  query = search.value,
  activeSortKey = sortKey.value,
): StatementStackRow[] {
  const rows = stacks.map((stack) => {
    const items = stack.items
    const representative = stack.representative

    const referenceEntries = toCanonicalReferenceBadgeEntries(representative.referenceDetails)

    const transactionTypeEntries = toCanonicalValueBadgeEntries(
      resolveTransactionType(representative),
      representative.transactionTypeHint,
    )

    const amount = items.reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0)
    const category: StatementStackRow['category'] =
      items.length > 1 || representative.underlyingTransactionCount > 1 ? 'Samlepost' : 'Enkeltpost'
    const lineCount = items.length > 1
      ? items.reduce((total, item) => total + item.underlyingTransactionCount, 0)
      : representative.underlyingTransactionCount

    return {
      stackId: stack.stackId,
      representative,
      items,
      bookingDate: representative.bookingDate,
      account: representative.bankAccountName ?? representative.accountId ?? '-',
      amount,
      runningBalance: representative.runningBalance,
      referenceEntries,
      transactionTypeEntries,
      category,
      lineCount,
    }
  })

  if (query.length >= 2 || activeSortKey) return rows

  return fuzzyRankRows({
    rows,
    query,
    getValues: (row) => [
      row.stackId,
      row.representative.id,
      row.representative.runId,
      row.account,
      row.category,
      row.amount,
      row.bookingDate,
      ...row.referenceEntries.map((entry) => entry.value),
      ...row.transactionTypeEntries.map((entry) => entry.value),
    ],
    tieBreaker: (a, b) => {
      const dateDiff = new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
      if (dateDiff !== 0) return dateDiff
      return String(b.representative.id).localeCompare(String(a.representative.id), 'da', { sensitivity: 'base' })
    },
  })
}

function buildStatementStacks(rows: StatementTransaction[]): typeof stacked.value.stacks {
  const stacks = new Map<string, {
    stackId: string
    groupKey: string | null
    items: StatementTransaction[]
    representative: StatementTransaction
    totalAmount: number
    isGrouped: boolean
  }>()

  for (const row of rows) {
    const stackId = row.samlepostId ?? `single:${row.id}`
    const existing = stacks.get(stackId)
    if (existing) {
      existing.items.push(row)
      existing.totalAmount += Number(row.amount ?? 0)
      continue
    }

    stacks.set(stackId, {
      stackId,
      groupKey: stackId.startsWith('group:') ? stackId.slice('group:'.length) : null,
      items: [row],
      representative: row,
      totalAmount: Number(row.amount ?? 0),
      isGrouped: stackId.startsWith('group:'),
    })
  }

  return [...stacks.values()]
}

const groupedVisibleRows = computed<StatementStackRow[]>(() => buildGroupedRows(stacked.value.stacks))

const statementTableKey = computed(() => groupedVisibleRows.value.map((r) => r.stackId).join('|'))

function setPage(p: number): void {
  page.value = p
}

watch(pageSize, () => {
  page.value = 1
})

type CsvColumn = { header: string; value: (row: StatementStackRow) => string | number | null | undefined }

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  const needsQuotes = /["\n\r;]/.test(str)
  const escaped = str.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

function toCsv(rows: StatementStackRow[], columns: CsvColumn[]): string {
  const delimiter = ';'
  const headerLine = columns.map((c) => escapeCsvValue(c.header)).join(delimiter)
  const lines = rows.map((row) => columns.map((c) => escapeCsvValue(c.value(row))).join(delimiter))
  return [headerLine, ...lines].join('\n')
}

function formatDanishAmount(value: unknown): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return ''

  return new Intl.NumberFormat('da-DK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function lastEntryDetail(stack: StatementStackRow): StatementTransaction {
  return stack.items.reduce((latest, item) => {
    const sequenceDifference = (item.entryIndex ?? Number.MAX_SAFE_INTEGER) - (latest.entryIndex ?? Number.MAX_SAFE_INTEGER)
      || item.id.localeCompare(latest.id)

    if (sequenceDifference > 0) return item
    return latest
  }, stack.representative)
}

async function downloadStatementCsv(): Promise<void> {
  if (!import.meta.client) return
  if (isExportingCsv.value) return

  isExportingCsv.value = true
  try {
    const exportPageSize = 200
    const exportQuery = statementQuery(1, exportPageSize)
    const firstPage = await $fetch<StatementPage>('/api/transactions', {
      query: exportQuery,
    })
    const allRows = [...firstPage.rows]
    const totalPages = Math.ceil((firstPage.totalSamleposter ?? firstPage.total) / exportPageSize)

    for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
      const nextPage = await $fetch<StatementPage>('/api/transactions', {
        query: { ...exportQuery, page: pageNumber },
      })
      allRows.push(...nextPage.rows)
    }

    const exportRows = buildGroupedRows(
      buildStatementStacks(allRows),
      String(exportQuery.search ?? ''),
      exportQuery.sortBy ?? null,
    )
    if (!exportRows.length) return

    const columns: CsvColumn[] = [
      { header: 'Bogføringsdato', value: (r) => r.bookingDate },
      { header: 'Kontonavn', value: (r) => r.account },
      { header: 'Konto-id', value: (r) => r.representative.accountId ?? '' },
      { header: 'Beløb', value: (r) => formatDanishAmount(r.amount) },
      { header: 'Saldo', value: (r) => formatDanishAmount(lastEntryDetail(r).runningBalance) },
      { header: 'Kredit/debet', value: (r) => r.representative.creditDebitIndicator === 'CRDT' ? 'K' : r.representative.creditDebitIndicator === 'DBIT' ? 'D' : '' },
      { header: 'Reference', value: (r) => r.referenceEntries.map((entry) => entry.value).join(' · ') },
      { header: 'Transaktionstype', value: (r) => r.transactionTypeEntries[0]?.value ?? '' },
      { header: 'Kategori', value: (r) => r.category },
    ]

    const csv = toCsv(exportRows, columns)
    const bom = '\ufeff'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const fileName = `kontoudtog_${exportQuery.start}_${exportQuery.end}.csv`
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch {
    toast.add({ title: 'Kunne ikke hente alle transaktioner til CSV', color: 'error' })
  } finally {
    isExportingCsv.value = false
  }
}

function resolveTransactionType(row: StatementTransaction): string | null {
  if (row.transactionType && row.transactionType.trim().length) {
    return row.transactionType.trim()
  }

  if (row.bkTxCdProprietary && row.bkTxCdProprietary.trim().length) {
    return row.bkTxCdProprietary.trim()
  }

  const parts = [row.bkTxCdDomain, row.bkTxCdFamily, row.bkTxCdSubFamily]
    .map((value) => (value ? value.trim() : ''))
    .filter(Boolean)

  if (parts.length) {
    return parts.join('/')
  }

  return null
}

type StatementStackRow = {
  stackId: string
  representative: StatementTransaction
  items: StatementTransaction[]
  bookingDate: string
  account: string
  amount: number
  runningBalance: string | null
  referenceEntries: BadgeEntry[]
  transactionTypeEntries: BadgeEntry[]
  category: 'Samlepost' | 'Enkeltpost'
  lineCount: number
}

function openTransactionSummary(row: StatementStackRow): void {
  const isGrouped = row.items.length > 1
    || row.stackId.startsWith('group:')
    || row.representative.underlyingTransactionCount > 1
  const underlyingTransactionCount = row.items.length > 1
    ? row.items.reduce((total, item) => total + item.underlyingTransactionCount, 0)
    : row.representative.underlyingTransactionCount

  selectedTransaction.value = isGrouped
    ? {
      ...row.representative,
      summary: {
        ...row.representative.summary,
        sections: row.representative.summary.sections.map((section) => (
          section.key === 'part' ? { ...section, fields: [] } : section
        )),
        transactionId: {
          ...row.representative.summary.transactionId,
          value: `Samlepost (${row.items.length} poster)`,
        },
      },
    }
    : row.representative
  selectedEntryLabel.value = isGrouped ? 'Samlepost' : 'Enkeltpost'
  selectedUnderlyingTransactionCount.value = underlyingTransactionCount
  isTransactionSummaryOpen.value = true
}

const onStatementRowSelect = createTableRowSelectHandler(openTransactionSummary)

const columns: TableColumn<StatementStackRow>[] = [
  { // Banking date
    accessorKey: 'bookingDate',
    header: 'Dato',
    size: 120,
    cell: ({ row }) => {
      return new Date(row.original.bookingDate).toLocaleString('da-DK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
  },
  { // Bank account
    id: 'account',
    header: 'Konto',
    size: 180,
    cell: ({ row }) => {
      const value = row.original.account
      if (!value) return '-'

      return h('div', { class: TRANSACTION_BADGE_COLUMN_CLASS }, [
        h(UBadge, { variant: 'subtle', color: 'neutral' }, () => value),
      ])
    }
  },
  { // Amount
    id: 'amount',
    header: 'Beløb',
    size: 140,
    cell: ({ row }) => h('span', { class: 'font-bold' }, formatSignedDkk(row.original.amount)),
  },
  { // Category (samlepost vs. enkeltpost)
    id: 'category',
    header: 'Kategori',
    cell: ({ row }) => {
      const lineCount = row.original.lineCount
      const category = row.original.category

      return h('div', { class: 'flex items-center gap-2' }, [
        h(UBadge, {
          variant: 'subtle',
          color: 'neutral',
        }, () => category),
        ...(category === 'Samlepost' && lineCount > 0
          ? [h('span', { class: 'text-xs text-muted' }, `${lineCount} underliggende transaktioner`)]
          : []),
      ])
    },
  },
  { // Reference (aggregated from multiple fields)
    id: 'reference',
    header: 'Reference',
    enableSorting: false,
    cell: ({ row }) => {
      const entries = row.original.referenceEntries
      if (!entries.length) return '-'

      return h(
        'div',
        { class: TRANSACTION_BADGE_COLUMN_CLASS },
        entries.map((entry) =>
          h(UBadge, {
            class: TRANSACTION_BADGE_STYLE.freeTextOrReference.class,
            variant: TRANSACTION_BADGE_STYLE.freeTextOrReference.variant,
            color: TRANSACTION_BADGE_STYLE.freeTextOrReference.color,
            title: formatTransactionFieldHint(entry.hint),
          }, () => entry.value)
        )
      )
    }
  },
  { // Transaction type (aggregated from multiple fields)
    id: 'type',
    header: () => sortableHeader('Transaktionstype', 'transactionType'),
    size: 180,
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
    }
  },
]

const columnVisibility = ref<Record<string, boolean>>({
  search_flat: false,
})

function updateColumnVisibility(value: Record<string, boolean>): void {
  columnVisibility.value = value
}

const tableUi = {
  base: 'border-separate border-spacing-0',
  thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
  tbody: `${clickableTableRowsBodyClass} [&>tr]:last:[&>td]:border-b-0`,
  tr: 'group',
  th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
  td: 'align-top group-has-[td:not(:empty)]:border-b border-default',
  separator: 'h-0'
}
</script>

<template>
  <UDashboardPanel id="statement">
    <template #header>
      <UDashboardNavbar title="Kontoudtog">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              :icon="appConfig.ui.icons.download"
              label="Download CSV"
              variant="ghost"
              color="primary"
              :disabled="!visibleRows.length || status === 'pending' || isExportingCsv"
              :loading="isExportingCsv"
              @click="downloadStatementCsv()"
            />
            <UButton
              :icon="appConfig.ui.icons.reload"
              label="Opdater"
              variant="ghost"
              color="primary"
              :loading="status === 'pending'"
              @click="refresh()"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <FiltersRow
          v-model:account-ids="selectedAccountIds"
          v-model:search="globalFilterValue"
          v-model:date-range="dateRange"
          v-model:transaction-type="transactionTypeFilter"
          v-model:page-size="pageSize"
          :reset-date-range="defaultRange"
          :time-zone="DEFAULT_TIME_ZONE"
          :show-search="true"
          :show-transaction-type="true"
          :transaction-type-options="transactionTypeFilterOptions"
          :show-page-size="true"
          :page-size-options="pageSizeOptions"
          search-placeholder="Søg i kontoudtog..."
        />

        <TransactionsStackedTransactionsTable
          :table-key="statementTableKey"
          :rows="groupedVisibleRows"
          :columns="columns"
          :loading="status === 'pending'"
          :column-visibility="columnVisibility"
          empty-label="Der er ingen transaktioner at vise."
          :ui="tableUi"
          @update:column-visibility="updateColumnVisibility"
          @select="onStatementRowSelect"
          @keydown="activateClickableTableRowOnKeydown"
        />

        <TransactionsTablePagination
          :page="page"
          :page-size="pageSize"
          :total="totalRows"
          :shown="groupedVisibleRows.length"
          :pending="pending"
          @update:page="setPage"
        />

        <UModal v-model:open="isTransactionSummaryOpen" title="Transaktionsoversigt" :ui="{ content: 'max-w-2xl', body: 'space-y-3' }">
          <template #body>
            <div v-if="selectedTransaction" class="space-y-3">
              <p class="text-sm text-muted">
                {{ selectedEntryLabel }}
                <template v-if="selectedEntryLabel === 'Samlepost' && selectedUnderlyingTransactionCount > 0">
                  · {{ selectedUnderlyingTransactionCount }} underliggende transaktioner
                </template>
              </p>
              <BookingSummaryCard :summary="selectedTransaction.summary" />
            </div>
            <div v-else class="text-sm text-muted">Ingen transaktion valgt.</div>
          </template>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>
