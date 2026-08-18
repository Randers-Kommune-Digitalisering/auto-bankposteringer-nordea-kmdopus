<script setup lang="ts">
import { h } from 'vue'
import { today, type DateValue } from '@internationalized/date'
import type { TableColumn } from '@nuxt/ui'
import type { StatementTransaction } from '~/types/transactions'
import { TRANSACTION_BADGE_COLUMN_CLASS, TRANSACTION_BADGE_STYLE } from '~/lib/presenters/transactionBadgeStyles'
import { DEFAULT_TIME_ZONE, formatSignedDkk } from '~/utils'
import { formatTransactionFieldHint } from '~/lib/presenters/transactionFieldHints'
import { buildReferenceBadgeEntries, dedupeBadgeEntries, toCanonicalReferenceBadgeEntries, toCanonicalValueBadgeEntries, type BadgeEntry } from '~/lib/presenters/referenceBadgeEntries'
import { useStackedTransactions } from '~/composables/useStackedTransactions'
import { useDebouncedString } from '~/composables/useDebouncedString'
import { fuzzyRankRows } from '~/lib/search/fuzzyRanking'

const appConfig = useAppConfig()
const UBadge = resolveComponent('UBadge')

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

type StatementPage = {
  rows: StatementTransaction[]
  total: number
  page: number
  pageSize: number
  totalSamleposter?: number
}

const { data, status, refresh } = await useFetch<StatementPage>('/api/transactions', {
  // A single stable key keeps one cache entry; per-filter keys would replay stale payloads when a
  // previously used filter combination is revisited.
  key: 'statement-transactions',
  query: computed(() => ({
    mode: 'statement',
    start: start.value,
    end: end.value,
    // Always pass primitive IDs as a comma-separated string to avoid query serialization pitfalls.
    accountIds: selectedAccountIds.value.length ? selectedAccountIds.value.join(',') : undefined,
    search: search.value.length ? search.value : undefined,
    page: page.value,
    pageSize: pageSize.value,
  })),
  watch: [start, end, selectedAccountIds, search, page, pageSize],
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

watch([start, end, selectedAccountIds, search], () => {
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
const isRawTransactionOpen = ref(false)
const selectedRawTransaction = ref<StatementTransaction | null>(null)
type StatementSortKey = 'bookingDate' | 'account' | 'counterpart' | 'amount' | 'transactionType'
const sortKey = ref<StatementSortKey>('bookingDate')
const sortDirection = ref<'asc' | 'desc'>('desc')
const transactionTypeFilter = ref<string | undefined>(undefined)

function toggleSort(key: StatementSortKey): void {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = key
  sortDirection.value = key === 'bookingDate' ? 'desc' : 'asc'
}

function sortIndicator(key: StatementSortKey): string {
  if (sortKey.value !== key) return ''
  return sortDirection.value === 'asc' ? ' ↑' : ' ↓'
}

function sortableHeader(label: string, key: StatementSortKey) {
  return h('button', {
    type: 'button',
    class: 'font-semibold hover:text-primary',
    onClick: () => toggleSort(key),
  }, `${label}${sortIndicator(key)}`)
}

const transactionTypeFilterOptions = computed(() => [
  ...Array.from(new Set(
    stacked.value.stacks
      .map((stack) => resolveTransactionType(stack.representative))
      .filter((value): value is string => Boolean(value)),
  ))
    .sort((left, right) => left.localeCompare(right, 'da'))
    .map((value) => ({ label: value, value })),
])

const groupedVisibleRows = computed<StatementStackRow[]>(() => {
  const rows = stacked.value.stacks.map((stack) => {
    const items = stack.items
    const representative = stack.representative

    const counterpartEntries = toCanonicalValueBadgeEntries(
      representative.counterpart ?? resolveCounterpart(representative),
      representative.counterpartHint,
    )

    const referenceEntries = toCanonicalReferenceBadgeEntries(representative.referenceDetails)

    const transactionTypeEntries = toCanonicalValueBadgeEntries(
      resolveTransactionType(representative),
      representative.transactionTypeHint,
    )

    const amount = items.reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0)
    const category: StatementStackRow['category'] = items.length > 1 ? 'Samlepost' : 'Enkeltpost'

    return {
      stackId: stack.stackId,
      representative,
      items,
      bookingDate: representative.bookingDate,
      account: representative.bankAccountName ?? representative.accountId ?? '-',
      amount,
      runningBalance: representative.runningBalance,
      counterpartEntries,
      referenceEntries,
      transactionTypeEntries,
      category,
      lineCount: items.length,
    }
  })

  const filteredRows = transactionTypeFilter.value
    ? rows.filter((row) => row.transactionTypeEntries.some((entry) => entry.value === transactionTypeFilter.value))
    : rows

  const rankedRows = fuzzyRankRows({
    rows: filteredRows,
    query: search.value,
    getValues: (row) => [
      row.stackId,
      row.representative.id,
      row.representative.runId,
      row.account,
      row.category,
      row.amount,
      row.bookingDate,
      ...row.counterpartEntries.map((entry) => entry.value),
      ...row.referenceEntries.map((entry) => entry.value),
      ...row.transactionTypeEntries.map((entry) => entry.value),
    ],
    tieBreaker: (a, b) => {
      const dateDiff = new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
      if (dateDiff !== 0) return dateDiff
      return String(b.representative.id).localeCompare(String(a.representative.id), 'da', { sensitivity: 'base' })
    },
  })

  const direction = sortDirection.value === 'asc' ? 1 : -1
  return rankedRows.sort((left, right) => {
    let comparison = 0
    if (sortKey.value === 'bookingDate') {
      comparison = new Date(left.bookingDate).getTime() - new Date(right.bookingDate).getTime()
    } else if (sortKey.value === 'amount') {
      comparison = left.amount - right.amount
    } else {
      const leftValue = sortKey.value === 'account'
        ? left.account
        : sortKey.value === 'counterpart'
          ? left.counterpartEntries[0]?.value ?? ''
          : left.transactionTypeEntries[0]?.value ?? ''
      const rightValue = sortKey.value === 'account'
        ? right.account
        : sortKey.value === 'counterpart'
          ? right.counterpartEntries[0]?.value ?? ''
          : right.transactionTypeEntries[0]?.value ?? ''
      comparison = leftValue.localeCompare(rightValue, 'da', { sensitivity: 'base' })
    }

    if (comparison !== 0) return comparison * direction
    return String(left.stackId).localeCompare(String(right.stackId), 'da', { sensitivity: 'base' })
  })
})

const statementTableKey = computed(() => groupedVisibleRows.value.map((r) => r.stackId).join('|'))

function setPage(p: number): void {
  page.value = p
}

watch(pageSize, () => {
  page.value = 1
})

watch(transactionTypeFilter, () => {
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
    if ((item.entrySubIndex ?? 0) > (latest.entrySubIndex ?? 0)) return item
    return latest
  }, stack.representative)
}

function downloadStatementCsv(): void {
  if (!import.meta.client) return
  if (!groupedVisibleRows.value.length) return

  const columns: CsvColumn[] = [
    { header: 'Bogføringsdato', value: (r) => r.bookingDate },
    { header: 'Kontonavn', value: (r) => r.account },
    { header: 'Konto-id', value: (r) => r.representative.accountId ?? '' },
    { header: 'Beløb', value: (r) => formatDanishAmount(r.amount) },
    { header: 'Saldo', value: (r) => formatDanishAmount(lastEntryDetail(r).runningBalance) },
    { header: 'Valuta', value: (r) => r.representative.currency ?? 'DKK' },
    { header: 'Kredit/debet', value: (r) => r.representative.creditDebitIndicator === 'CRDT' ? 'K' : r.representative.creditDebitIndicator === 'DBIT' ? 'D' : '' },
    { header: 'Modpart', value: (r) => r.counterpartEntries[0]?.value ?? '' },
    { header: 'Posteringstekst', value: (r) => r.representative.postingText ?? r.referenceEntries.map((entry) => entry.value).join(' · ') },
    { header: 'EntryRef', value: (r) => r.representative.ntryRef ?? '' },
    { header: 'Transaktionstype', value: (r) => r.transactionTypeEntries[0]?.value ?? '' },
    { header: 'Kategori', value: (r) => r.category },
    { header: 'Antal linjer', value: (r) => r.lineCount },
  ]

  const csv = toCsv(groupedVisibleRows.value, columns)
  const bom = '\ufeff'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const fileName = `kontoudtog_${start.value}_${end.value}.csv`
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
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

function resolveCounterpart(row: StatementTransaction): string | null {
  const isOutgoing = row.creditDebitIndicator === 'DBIT'
  if (isOutgoing) {
    return row.creditorName ?? row.ultimateCreditorName ?? row.creditorId ?? row.creditorAccountIban ?? null
  }

  return row.debtorName ?? row.ultimateDebtorName ?? row.debtorId ?? row.debtorAccountIban ?? null
}

type StatementStackRow = {
  stackId: string
  representative: StatementTransaction
  items: StatementTransaction[]
  bookingDate: string
  account: string
  amount: number
  runningBalance: string | null
  counterpartEntries: BadgeEntry[]
  referenceEntries: BadgeEntry[]
  transactionTypeEntries: BadgeEntry[]
  category: 'Samlepost' | 'Enkeltpost'
  lineCount: number
}

function buildReferenceEntries(row: StatementTransaction): BadgeEntry[] {
  return buildReferenceBadgeEntries([
    ...(Array.isArray(row.remittanceUstrd)
      ? row.remittanceUstrd.map((value) => ({ value, hint: 'remittanceUstrd' }))
      : []),
    ...(Array.isArray(row.remittanceAdditional)
      ? row.remittanceAdditional.map((value) => ({ value, hint: 'remittanceAdditional' }))
      : []),
    { value: row.remittanceCreditorReference, hint: 'remittanceCreditorReference' },
    { value: row.entryAdditionalInfo, hint: 'entryAdditionalInfo' },
    { value: row.txAdditionalInfo, hint: 'txAdditionalInfo' },
    { value: row.refsEndToEndId, hint: 'refsEndToEndId' },
    { value: row.refsInstrId, hint: 'refsInstrId' },
    { value: row.refsPmtInfId, hint: 'refsPmtInfId' },
    { value: row.uetr, hint: 'uetr' },
    { value: row.txAcctSvcrRef, hint: 'txAcctSvcrRef' },
    { value: row.ntryAcctSvcrRef, hint: 'ntryAcctSvcrRef' },
    { value: row.ntryRef, hint: 'ntryRef' },
  ])
}

function openRawTransaction(row: StatementStackRow): void {
  selectedRawTransaction.value = row.representative
  isRawTransactionOpen.value = true
}

function extract500TriadValues(value: string | null): string[] {
  const text = String(value ?? '')
  if (!text.trim().length) return []

  const seen = new Set<string>()
  const values: string[] = []
  for (const token of text.split(';')) {
    const match = /^500:[^:]*:(.*)$/i.exec(token.trim())
    const triadValue = String(match?.[1] ?? '').trim()
    if (!triadValue.length) continue
    const dedupeKey = triadValue.toLowerCase()
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    values.push(triadValue)
  }

  return values
}

const rawReferenceEntries = computed<BadgeEntry[]>(() => {
  if (!selectedRawTransaction.value) return []
  return dedupeBadgeEntries(buildReferenceEntries(selectedRawTransaction.value))
})

const rawTriad500Values = computed<string[]>(() =>
  extract500TriadValues(selectedRawTransaction.value?.entryAdditionalInfo ?? null),
)

const columns: TableColumn<StatementStackRow>[] = [
  { // Banking date
    accessorKey: 'bookingDate',
    header: () => sortableHeader('Dato', 'bookingDate'),
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
    header: () => sortableHeader('Konto', 'account'),
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
    header: () => sortableHeader('Beløb', 'amount'),
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
        h('span', { class: 'text-xs text-muted' }, `${lineCount} linje${lineCount === 1 ? '' : 'r'}`),
      ])
    },
  },
  { // Counterparty
    id: 'counterpart',
    header: () => sortableHeader('Modpart', 'counterpart'),
    size: 220,
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
    }
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
  {
    id: 'actions',
    cell: ({ row }) => h(resolveComponent('UButton'), {
      size: 'sm',
      color: 'primary',
      variant: 'soft',
      trailingIcon: appConfig.ui.icons.leftAlign,
      onClick: () => openRawTransaction(row.original),
    }, () => 'Rå visning'),
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
  tbody: '[&>tr]:last:[&>td]:border-b-0',
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
              :disabled="!visibleRows.length || status === 'pending'"
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
        />

        <TransactionsTablePagination
          :page="page"
          :page-size="pageSize"
          :total="totalRows"
          :shown="groupedVisibleRows.length"
          :pending="pending"
          @update:page="setPage"
        />

        <UModal v-model:open="isRawTransactionOpen" title="Rå transaktion (repræsentantlinje)" :ui="{ body: 'space-y-4' }">
          <template #body>
            <div v-if="!selectedRawTransaction" class="text-sm text-muted">Ingen transaktion valgt.</div>
            <div v-else class="space-y-4">
              <UCard variant="soft" :ui="{ body: 'space-y-3 p-4' }">
                <div class="grid gap-2 sm:grid-cols-2">
                  <div>
                    <div class="text-xs font-semibold uppercase tracking-wide text-muted">Transaktions-ID</div>
                    <div class="text-sm break-all">{{ selectedRawTransaction.id }}</div>
                  </div>
                  <div>
                    <div class="text-xs font-semibold uppercase tracking-wide text-muted">Kørsel</div>
                    <div class="text-sm break-all">{{ selectedRawTransaction.runId }}</div>
                  </div>
                  <div>
                    <div class="text-xs font-semibold uppercase tracking-wide text-muted">Beløb</div>
                    <div class="text-sm">{{ formatSignedDkk(Number(selectedRawTransaction.amount ?? 0)) }}</div>
                  </div>
                  <div>
                    <div class="text-xs font-semibold uppercase tracking-wide text-muted">Modpart</div>
                    <div class="text-sm">{{ resolveCounterpart(selectedRawTransaction) ?? '-' }}</div>
                  </div>
                </div>
              </UCard>

              <UCard variant="soft" :ui="{ body: 'space-y-2 p-4' }">
                <div class="text-xs font-semibold uppercase tracking-wide text-muted">Reference (afledt)</div>
                <div v-if="rawReferenceEntries.length" class="space-y-1">
                  <UBadge
                    v-for="(entry, index) in rawReferenceEntries"
                    :key="`raw-ref-${index}`"
                    variant="soft"
                    color="success"
                    size="sm"
                    :title="formatTransactionFieldHint(entry.hint)"
                    class="block max-w-full whitespace-normal break-all"
                  >
                    {{ entry.value }}
                  </UBadge>
                </div>
                <div v-else class="text-xs text-muted">-</div>
              </UCard>

              <UCard variant="soft" :ui="{ body: 'space-y-2 p-4' }">
                <div class="text-xs font-semibold uppercase tracking-wide text-muted">500-triader fra AddtlNtryInf</div>
                <div v-if="rawTriad500Values.length" class="space-y-1">
                  <UBadge
                    v-for="(value, index) in rawTriad500Values"
                    :key="`raw-500-${index}`"
                    variant="soft"
                    color="warning"
                    size="sm"
                    class="block max-w-full whitespace-normal break-all"
                  >
                    {{ value }}
                  </UBadge>
                </div>
                <div v-else class="text-xs text-muted">-</div>
              </UCard>

              <UCard variant="soft" :ui="{ body: 'space-y-2 p-4' }">
                <div class="text-xs font-semibold uppercase tracking-wide text-muted">Rå felter</div>
                <div class="grid gap-2 sm:grid-cols-2">
                  <div class="text-xs text-muted">entryAdditionalInfo</div>
                  <div class="text-xs break-all">{{ selectedRawTransaction.entryAdditionalInfo || '-' }}</div>
                  <div class="text-xs text-muted">txAdditionalInfo</div>
                  <div class="text-xs break-all">{{ selectedRawTransaction.txAdditionalInfo || '-' }}</div>
                  <div class="text-xs text-muted">remittanceCreditorReference</div>
                  <div class="text-xs break-all">{{ selectedRawTransaction.remittanceCreditorReference || '-' }}</div>
                  <div class="text-xs text-muted">remittanceUstrd</div>
                  <div class="text-xs break-all">{{ (selectedRawTransaction.remittanceUstrd || []).join(' | ') || '-' }}</div>
                  <div class="text-xs text-muted">remittanceAdditional</div>
                  <div class="text-xs break-all">{{ (selectedRawTransaction.remittanceAdditional || []).join(' | ') || '-' }}</div>
                  <div class="text-xs text-muted">BkTxCd</div>
                  <div class="text-xs break-all">{{ [selectedRawTransaction.bkTxCdDomain, selectedRawTransaction.bkTxCdFamily, selectedRawTransaction.bkTxCdSubFamily].filter(Boolean).join('/') || '-' }}</div>
                  <div class="text-xs text-muted">BkTxCd Proprietary</div>
                  <div class="text-xs break-all">{{ selectedRawTransaction.bkTxCdProprietary || '-' }}</div>
                  <div class="text-xs text-muted">NtryRef / AcctSvcrRef</div>
                  <div class="text-xs break-all">{{ [selectedRawTransaction.ntryRef, selectedRawTransaction.ntryAcctSvcrRef].filter(Boolean).join(' / ') || '-' }}</div>
                  <div class="text-xs text-muted">Refs (EndToEnd, Instr, PmtInf, UETR)</div>
                  <div class="text-xs break-all">{{ [selectedRawTransaction.refsEndToEndId, selectedRawTransaction.refsInstrId, selectedRawTransaction.refsPmtInfId, selectedRawTransaction.uetr].filter(Boolean).join(' | ') || '-' }}</div>
                </div>
              </UCard>
            </div>
          </template>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>
