<script setup lang="ts">
import { h } from 'vue'
import { today } from '@internationalized/date'
import type { TableColumn } from '@nuxt/ui'
import type { StatementTransaction } from '~/types/transactions'
import { DEFAULT_TIME_ZONE } from '~/lib/timeZone'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UPopover = resolveComponent('UPopover')
const UInput = resolveComponent('UInput')
const USelectMenu = resolveComponent('USelectMenu')

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

type StatementPage = { rows: StatementTransaction[]; total: number; page: number; pageSize: number }

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
  default: () => ({ rows: [], total: 0, page: 1, pageSize: pageSize.value }),
})

watch([start, end, selectedAccountIds, search], () => {
  page.value = 1
})

const fetchedRows = computed<StatementTransaction[]>(() => data.value?.rows ?? [])
const totalRows = computed<number>(() => data.value?.total ?? 0)

const visibleRows = computed<StatementTransaction[]>(() => fetchedRows.value)
const visibleRowCount = computed<number>(() => fetchedRows.value.length)
const pageCount = computed<number>(() => Math.max(1, Math.ceil(totalRows.value / pageSize.value)))

function setPage(p: number): void {
  page.value = p
}

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
    { header: 'Fritekst', value: (r) => buildFreeText(r).join(' · ') },
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

type DetailEntry = { label: string; value: string }

const classBadgeColumn = 'flex flex-wrap gap-1'

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

function buildFreeText(row: StatementTransaction): string[] {
  return uniqueTexts([
    ...uniqueTextsFromArray([row.remittanceUstrd, row.remittanceAdditional]),
    ...uniqueTexts([row.remittanceCreditorReference, row.entryAdditionalInfo, row.txAdditionalInfo])
  ])
}

function buildDetails(row: StatementTransaction): DetailEntry[] {
  const details: DetailEntry[] = []

  const add = (label: string, value: unknown) => {
    if (value === null || value === undefined) return
    if (Array.isArray(value)) {
      const filtered = value.filter((v) => typeof v === 'string' && v.trim().length)
      if (!filtered.length) return
      details.push({ label, value: filtered.join(' · ') })
      return
    }

    const str = String(value)
    if (!str.trim().length) return
    details.push({ label, value: str })
  }

  add('Transaktions-id', row.id)
  add('Kørsel', row.runId)
  add('Konto-id', row.accountId)
  add('Kontonavn', row.bankAccountName)

  add('Beløb', row.amount)
  add('Saldo', row.runningBalance)
  add('Valuta', row.currency)
  add('Kredit/debet', row.creditDebitIndicator)
  add('Status', row.status)
  add('Bogføringsdato', row.bookingDate)
  add('Valørdag', row.valueDate)

  add('Statement-id', row.statementId)
  add('Entry index', row.entryIndex)
  add('Entry sub index', row.entrySubIndex)

  add('NtryRef', row.ntryRef)
  add('NtryAcctSvcrRef', row.ntryAcctSvcrRef)
  add('Entry additional info', row.entryAdditionalInfo)

  add('TxAcctSvcrRef', row.txAcctSvcrRef)
  add('EndToEndId', row.refsEndToEndId)
  add('InstrId', row.refsInstrId)
  add('PmtInfId', row.refsPmtInfId)
  add('UETR', row.uetr)
  add('Tx additional info', row.txAdditionalInfo)

  add('BkTxCd (domain)', row.bkTxCdDomain)
  add('BkTxCd (family)', row.bkTxCdFamily)
  add('BkTxCd (sub family)', row.bkTxCdSubFamily)
  add('BkTxCd (proprietary)', row.bkTxCdProprietary)

  add('Debtor name', row.debtorName)
  add('Debtor id', row.debtorId)
  add('Debtor IBAN', row.debtorAccountIban)
  add('Creditor name', row.creditorName)
  add('Creditor id', row.creditorId)
  add('Creditor IBAN', row.creditorAccountIban)
  add('Ultimate debtor', row.ultimateDebtorName)
  add('Ultimate creditor', row.ultimateCreditorName)

  add('Remittance (Ustrd)', row.remittanceUstrd)
  add('Creditor reference', row.remittanceCreditorReference)
  add('Remittance additional', row.remittanceAdditional)

  add('Behandlingsstatus', row.processingStatus)
  add('Regel-id', row.ruleApplied)

  return details
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

const formatAmount = (row: StatementTransaction): string => {
  return formatMoney(row.amount, row.currency)
}

const columns: TableColumn<StatementTransaction>[] = [
  {
    id: 'search_flat',
    accessorFn: (row) => {
      const parts: Array<string | number | null | undefined> = [
        row.bookingDate,
        row.valueDate,
        row.bankAccountName,
        row.accountId,
        row.amount,
        row.runningBalance,
        row.currency,
        row.creditDebitIndicator,
        resolveCounterpart(row),
        resolveTransactionType(row),
        buildFreeText(row).join(' '),
        row.id,
        row.runId,
        row.status,
        row.processingStatus,
        row.ruleApplied
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
  {
    accessorKey: 'bookingDate',
    header: 'Dato',
    size: 120,
    cell: ({ row }) => {
      return new Date(row.getValue('bookingDate')).toLocaleString('da-DK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
  },
  {
    id: 'account',
    header: 'Konto',
    size: 180,
    cell: ({ row }) => {
      return row.original.bankAccountName ?? row.original.accountId ?? '-'
    }
  },
  {
    id: 'amount',
    header: 'Beløb',
    size: 140,
    cell: ({ row }) => {
      return h('span', { class: 'font-medium' }, formatAmount(row.original))
    }
  },
  {
    id: 'runningBalance',
    header: 'Saldo',
    size: 160,
    cell: ({ row }) => {
      const value = row.original.runningBalance
      if (!value) return '-'

      return h('span', { class: 'font-medium' }, formatMoney(value, row.original.currency))
    }
  },
  {
    id: 'counterpart',
    header: 'Modpart',
    size: 220,
    cell: ({ row }) => {
      const counterpart = resolveCounterpart(row.original)
      if (!counterpart) return '-'

      return h('div', { class: classBadgeColumn }, [
        h(UBadge, { class: 'capitalize', variant: 'subtle', color: 'secondary' }, () => counterpart)
      ])
    }
  },
  {
    id: 'freeText',
    header: 'Fritekst',
    enableSorting: false,
    cell: ({ row }) => {
      const texts = buildFreeText(row.original)
      if (!texts.length) return '-'

      return h(
        'div',
        { class: classBadgeColumn },
        texts.map((text) =>
          h(UBadge, { class: 'capitalize', variant: 'subtle', color: 'primary' }, () => text)
        )
      )
    }
  },
  {
    id: 'type',
    header: 'Transaktionstype',
    size: 180,
    cell: ({ row }) => {
      const txType = resolveTransactionType(row.original)
      if (!txType) return '-'

      return h('div', { class: classBadgeColumn }, [
        h(UBadge, { class: 'capitalize', variant: 'subtle', color: 'warning' }, () => txType)
      ])
    }
  },
  {
    id: 'details',
    header: 'Detaljer',
    size: 80,
    enableSorting: false,
    cell: ({ row }) => {
      const entries = buildDetails(row.original)

      return h(
        UPopover,
        { popper: { placement: 'left-start' } },
        {
          default: () =>
            h(UButton, {
              icon: 'solar:document-bold-duotone',
              label: 'Vis',
              variant: 'soft',
              size: 'xs',
              color: 'neutral'
            }),
          content: () =>
            h(
              'div',
              { class: 'p-4 max-w-2xl max-h-96 overflow-y-auto space-y-2' },
              entries.map((entry) =>
                h('div', { class: 'flex gap-2 text-sm' }, [
                  h('span', { class: 'text-muted w-40 shrink-0' }, entry.label),
                  h('span', { class: 'break-all min-w-0' }, entry.value)
                ])
              )
            )
        }
      )
    }
  }
]

const columnVisibility = ref({
  search_flat: false
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

        <div v-if="dateRange?.start && dateRange?.end" class="text-sm text-muted">
          Viser {{ visibleRowCount }} af {{ totalRows }} transaktioner i valgt periode
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
          v-model:column-visibility="columnVisibility"
          :data="visibleRows"
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
