<script setup lang="ts">
import { h } from 'vue'
import { today } from '@internationalized/date'
import type { TableColumn } from '@nuxt/ui'
import type { StatementTransaction } from '~/types/transactions'
import { TRANSACTION_BADGE_COLUMN_CLASS, TRANSACTION_BADGE_STYLE } from '~/lib/presenters/transactionBadgeStyles'
import { DEFAULT_TIME_ZONE } from '~/lib/timeZone'
import { formatTransactionFieldHint } from '~/lib/presenters/transactionFieldHints'

const UBadge = resolveComponent('UBadge')

definePageMeta({
  path: '/kontoudtog'
})

// Use a fixed timezone to keep SSR + client hydration deterministic.
// (Node SSR often runs in UTC while the browser is local time.)
const timeZone = DEFAULT_TIME_ZONE

const endDefault = today(timeZone)
const startDefault = endDefault.subtract({ days: 29 })

const defaultRange = {
  start: startDefault,
  end: endDefault
}

const dateRange = ref<any>(defaultRange)
const globalFilterValue = ref('')

const page = ref(1)
const pageSize = ref(50)

// Source of truth: selected account IDs (strings)
const selectedAccountIds = ref<string[]>([])

const start = computed(() => {
  const v = dateRange.value?.start ?? startDefault
  return v.toDate(timeZone).toISOString().slice(0, 10)
})

const end = computed(() => {
  const v = dateRange.value?.end ?? endDefault
  return v.toDate(timeZone).toISOString().slice(0, 10)
})

const search = computed(() => globalFilterValue.value.trim())

type StatementPage = {
  rows: StatementTransaction[]
  total: number
  page: number
  pageSize: number
  totalTopTransactions?: number
}

const { data, status, refresh } = await useFetch<StatementPage>('/api/transactions/statement', {
  // Key intentionally excludes accountIds so fast toggles don't create multiple keys.
  // This allows `dedupe: 'cancel'` to cancel in-flight requests and prevents "1 tick behind".
  key: computed(() => `statement:${start.value}:${end.value}:q:${search.value}:p${page.value}:s${pageSize.value}`),
  query: computed(() => ({
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
  transform: (v) => {
    const rows = Array.isArray((v as any)?.rows) ? (v as any).rows.slice() : []
    return {
      ...(v as any),
      rows,
    } as any
  },
  default: () => ({ rows: [], total: 0, page: 1, pageSize: pageSize.value }),
})

watch([start, end, selectedAccountIds, search], () => {
  page.value = 1
})

const fetchedRows = computed<StatementTransaction[]>(() => data.value?.rows ?? [])
const totalRows = computed<number>(() => data.value?.total ?? 0)
const shownTopTransactions = computed<number>(() => new Set(
  fetchedRows.value.map((row) => String(row.topStackId ?? row.id)),
).size)
const totalTopTransactions = computed<number>(() => Number(data.value?.totalTopTransactions ?? shownTopTransactions.value))

const visibleRows = computed<StatementTransaction[]>(() => fetchedRows.value)
const visibleRowCount = computed<number>(() => fetchedRows.value.length)

const groupedVisibleRows = computed<StatementStackRow[]>(() => {
  const byStack = new Map<string, StatementTransaction[]>()
  const stackOrder: string[] = []

  for (const row of visibleRows.value) {
    const stackId = String(row.topStackId ?? row.id)
    if (!byStack.has(stackId)) {
      byStack.set(stackId, [])
      stackOrder.push(stackId)
    }
    byStack.get(stackId)!.push(row)
  }

  return stackOrder.map((stackId) => {
    const items = byStack.get(stackId) ?? []
    const representative = items[0]!

    const counterpartEntries = dedupeBadgeEntries(
      [resolveCounterpartEntry(representative)].filter((entry): entry is BadgeEntry => Boolean(entry)),
    )

    const referenceEntries = dedupeBadgeEntries(buildReferenceEntries(representative))

    const transactionTypeEntries = dedupeBadgeEntries(
      [resolveTransactionTypeEntry(representative)].filter((entry): entry is BadgeEntry => Boolean(entry)),
    )

    const amount = items.reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0)

    return {
      stackId,
      representative,
      items,
      bookingDate: representative.bookingDate,
      account: representative.bankAccountName ?? representative.accountId ?? '-',
      amount,
      runningBalance: representative.runningBalance,
      counterpartEntries,
      referenceEntries,
      transactionTypeEntries,
      category: items.length > 1 ? 'Samlepost' : 'Enkeltpost',
      lineCount: items.length,
    }
  })
})

const statementTableKey = computed(() => groupedVisibleRows.value.map((r) => r.stackId).join('|'))

function setPage(p: number): void {
  page.value = p
}

watch(pageSize, () => {
  page.value = 1
})

type CsvColumn = { header: string; value: (row: StatementTransaction) => string | number | null | undefined }

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  const needsQuotes = /["\n\r;]/.test(str)
  const escaped = str.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

function toCsv(rows: StatementTransaction[], columns: CsvColumn[]): string {
  const delimiter = ';'
  const headerLine = columns.map((c) => escapeCsvValue(c.header)).join(delimiter)
  const lines = rows.map((row) => columns.map((c) => escapeCsvValue(c.value(row))).join(delimiter))
  return [headerLine, ...lines].join('\n')
}

function downloadStatementCsv(): void {
  if (!process.client) return
  if (!visibleRows.value.length) return

  const columns: CsvColumn[] = [
    { header: 'Bogføringsdato', value: (r) => r.bookingDate },
    { header: 'Kontonavn', value: (r) => r.bankAccountName ?? '' },
    { header: 'Konto-id', value: (r) => r.accountId },
    { header: 'Beløb', value: (r) => r.amount },
    { header: 'Saldo', value: (r) => r.runningBalance ?? '' },
    { header: 'Valuta', value: (r) => r.currency ?? 'DKK' },
    { header: 'Kredit/debet', value: (r) => r.creditDebitIndicator },
    { header: 'Modpart', value: (r) => resolveCounterpart(r) ?? '' },
    { header: 'Reference', value: (r) => buildReference(r).join(' · ') },
    { header: 'Transaktionstype', value: (r) => resolveTransactionType(r) ?? '' },
    { header: 'Transaktions-id', value: (r) => r.id },
    { header: 'Kørsel', value: (r) => r.runId },
    { header: 'Status', value: (r) => r.status ?? '' },
    { header: 'Behandlingsstatus', value: (r) => r.processingStatus ?? '' },
    { header: 'Regel-id', value: (r) => r.ruleApplied ?? '' }
  ]

  const csv = toCsv(visibleRows.value, columns)
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

type BadgeEntry = { value: string; hint?: string }
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

function normalizeText(value: string): string {
  return value.trim()
}

function uniqueTexts(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>()
  values.forEach((v) => {
    if (!v) return
    const n = normalizeText(v)
    if (n.length) set.add(n)
  })
  return Array.from(set)
}

function uniqueTextsFromArray(values: Array<string[] | null | undefined>): string[] {
  const set = new Set<string>()
  values.forEach((arr) => {
    if (!Array.isArray(arr)) return
    arr.forEach((v) => {
      const n = normalizeText(v)
      if (n.length) set.add(n)
    })
  })
  return Array.from(set)
}

function dedupeBadgeEntries(entries: BadgeEntry[]): BadgeEntry[] {
  const byValue = new Map<string, { value: string; hints: Set<string> }>()

  for (const entry of entries) {
    const value = normalizeText(entry.value)
    if (!value.length) continue
    const key = value.toLowerCase()
    const existing = byValue.get(key) ?? { value, hints: new Set<string>() }
    const hint = String(entry.hint ?? '').trim()
    if (hint.length) existing.hints.add(hint)
    byValue.set(key, existing)
  }

  return Array.from(byValue.values()).map((entry) => ({
    value: entry.value,
    hint: entry.hints.size ? Array.from(entry.hints).join(' | ') : undefined,
  }))
}

function resolveCounterpartEntry(row: StatementTransaction): BadgeEntry | null {
  const isOutgoing = row.creditDebitIndicator === 'DBIT'

  const outgoingCandidates: Array<{ value: string | null; hint: string }> = [
    { value: row.creditorName, hint: 'creditorName' },
    { value: row.ultimateCreditorName, hint: 'ultimateCreditorName' },
    { value: row.creditorId, hint: 'creditorId' },
    { value: row.creditorAccountIban, hint: 'creditorAccountIban' },
  ]

  const incomingCandidates: Array<{ value: string | null; hint: string }> = [
    { value: row.debtorName, hint: 'debtorName' },
    { value: row.ultimateDebtorName, hint: 'ultimateDebtorName' },
    { value: row.debtorId, hint: 'debtorId' },
    { value: row.debtorAccountIban, hint: 'debtorAccountIban' },
  ]

  const selected = isOutgoing ? outgoingCandidates : incomingCandidates
  for (const candidate of selected) {
    const value = String(candidate.value ?? '').trim()
    if (value.length) {
      return { value, hint: candidate.hint }
    }
  }

  return null
}

function resolveTransactionTypeEntry(row: StatementTransaction): BadgeEntry | null {
  if (row.bkTxCdProprietary && row.bkTxCdProprietary.trim().length) {
    return {
      value: row.bkTxCdProprietary.trim(),
      hint: 'bkTxCdProprietary',
    }
  }

  const parts: string[] = []
  const sourceParts: string[] = []

  if (row.bkTxCdDomain?.trim()) {
    parts.push(row.bkTxCdDomain.trim())
    sourceParts.push('bkTxCdDomain')
  }
  if (row.bkTxCdFamily?.trim()) {
    parts.push(row.bkTxCdFamily.trim())
    sourceParts.push('bkTxCdFamily')
  }
  if (row.bkTxCdSubFamily?.trim()) {
    parts.push(row.bkTxCdSubFamily.trim())
    sourceParts.push('bkTxCdSubFamily')
  }

  if (!parts.length) {
    return null
  }

  return {
    value: parts.join('/'),
    hint: sourceParts.join(' + '),
  }
}

function buildReferenceEntries(row: StatementTransaction): BadgeEntry[] {
  const entries: BadgeEntry[] = []

  if (Array.isArray(row.remittanceUstrd)) {
    for (const value of row.remittanceUstrd) {
      const text = normalizeText(value)
      if (text.length) {
        entries.push({ value: text, hint: 'remittanceUstrd' })
      }
    }
  }

  if (Array.isArray(row.remittanceAdditional)) {
    for (const value of row.remittanceAdditional) {
      const text = normalizeText(value)
      if (text.length) {
        entries.push({ value: text, hint: 'remittanceAdditional' })
      }
    }
  }

  const singleFields: Array<{ value: string | null; hint: string }> = [
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
  ]

  for (const field of singleFields) {
    const text = normalizeText(field.value ?? '')
    if (text.length) {
      entries.push({ value: text, hint: field.hint })
    }
  }

  return dedupeBadgeEntries(entries)
}

function buildReference(row: StatementTransaction): string[] {
  return buildReferenceEntries(row).map((entry) => entry.value)
}

function formatMoney(amount: string | number | null | undefined, currency: string | null | undefined): string {
  const ccy = currency ?? 'DKK'
  if (amount === null || amount === undefined) return `-`
  const n = Number(String(amount).replace(/,/g, '.'))
  if (Number.isFinite(n)) {
    return n.toLocaleString('da-DK', { style: 'currency', currency: ccy })
  }
  return `${amount} ${ccy}`
}

const formatAmount = (row: StatementStackRow): string => {
  return formatMoney(row.amount, row.representative.currency)
}

const columns: TableColumn<StatementStackRow>[] = [
  {
    id: 'search_flat',
    accessorFn: (row) => {
      const parts: Array<string | number | null | undefined> = [
        row.bookingDate,
        row.account,
        row.amount,
        row.runningBalance,
        row.counterpartEntries.map((entry) => entry.value).join(' '),
        row.referenceEntries.map((entry) => entry.value).join(' '),
        row.transactionTypeEntries.map((entry) => entry.value).join(' '),
        row.items.map((entry) => entry.id).join(' '),
        row.items.map((entry) => entry.runId).join(' '),
        row.category,
        row.lineCount,
      ]

      return parts
        .filter((v) => v !== null && v !== undefined)
        .map((v) => String(v))
        .join(' ')
    },
    enableHiding: false,
    enableSorting: false,
    cell: () => undefined
  },
  { // Bogføringsdato
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
  { // Konto
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
  { // Beløb
    id: 'amount',
    header: 'Beløb',
    size: 140,
    cell: ({ row }) => {
      return h('span', { class: 'font-bold' }, formatAmount(row.original))
    }
  },
  { // Counterpart
    id: 'counterpart',
    header: 'Modpart',
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
  { // Transaktionstype (aggregated from multiple fields)
    id: 'type',
    header: 'Transaktionstype',
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
]

const columnVisibility = ref({
  search_flat: false,
})

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
              icon="solar:download-bold-duotone"
              label="Download CSV"
              variant="ghost"
              color="primary"
              :disabled="!visibleRows.length || status === 'pending'"
              @click="downloadStatementCsv()"
            />
            <UButton
              icon="solar:refresh-bold-duotone"
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
          v-model:date-range="dateRange"
          :reset-date-range="defaultRange"
          :time-zone="timeZone"
          v-model:account-ids="selectedAccountIds"
          v-model:search="globalFilterValue"
          :show-search="true"
          search-placeholder="Søg i kontoudtog..."
        />

        <div v-if="dateRange?.start && dateRange?.end" class="mb-3 mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="text-sm text-muted">
            Viser {{ groupedVisibleRows.length }} af {{ totalTopTransactions }} posteringer ({{ visibleRowCount }} linjer i visningen)
          </div>

          <USelect
            v-model="pageSize"
            :items="[10, 25, 50, 100]"
            class="w-full sm:w-28"
          />
        </div>

        <UEmpty
          v-if="!visibleRows.length && status !== 'pending'"
          icon="solar:archive-bold-duotone"
          :title="fetchedRows.length ? 'Ingen resultater' : 'Ingen transaktioner'"
          :description="fetchedRows.length
            ? 'Ingen transaktioner matcher den valgte søgning/konto i perioden.'
            : 'Der er ingen transaktioner i den valgte periode endnu.'"
          class="border border-dashed border-default rounded-lg"
        >
          <template #actions>
            <UButton size="sm" variant="solid" @click="refresh()">
              Opdater
            </UButton>
          </template>
        </UEmpty>

        <UTable
          v-else
          :key="statementTableKey"
          v-model:column-visibility="columnVisibility"
          :data="groupedVisibleRows"
          :columns="columns"
          :loading="status === 'pending'"
          :ui="tableUi"
        />

        <div v-if="totalRows > pageSize" class="flex items-center border-t border-default pt-4 mt-auto">
          <div class="flex-1" />
          <div class="flex justify-center flex-1">
            <UPagination
              :default-page="page"
              :items-per-page="pageSize"
              :total="totalRows"
              @update:page="setPage"
            />
          </div>
          <div class="flex-1" />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
