<script setup lang="ts">
import { getGroupedRowModel } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'
import { today, type DateValue } from '@internationalized/date'
import FiltersRow from '~/components/filters/FiltersRow.vue'
import { useDebouncedString } from '~/composables/useDebouncedString'
import {
  activateClickableTableRowOnKeydown,
  clickableTableRowsBodyClass,
  createTableRowSelectHandler,
} from '~/composables/useClickableTableRows'
import { fuzzyRankRows } from '~/lib/search/fuzzyRanking'
import { redactSensitiveXml } from '~/lib/text/redactSensitiveXml'
import type { ErpOverviewStatus } from '~/lib/presenters/erpRequestOverview'
import type { ErpRequestOverviewItem, ErpRequestOverviewResponse } from '~/types/erpRequestOverview'
import BookingSummaryCard from '~/components/open-items/BookingSummaryCard.vue'
import type { ErpRequestReopenResponse, RunReopenResponse } from '~/types/erpReopen'
import type { TransactionSummary } from '~/types/transactions'
import { DEFAULT_TIME_ZONE, formatSignedDkk } from '~/utils'

const appConfig = useAppConfig()

type ErpRequestViewResponse = {
  requestId: string
  runId: string
  documentId: string | null
  documentOrigin: 'batch' | 'manual' | null
  response: null | {
    id: string
    statusText: string | null
  }
  header: {
    bookingDate: string | null
    transactionCount: number
    totalAmount: string
  }
  manualPostings: Array<{
    lineNo: number
    amount: string | null
    debetOrCredit: string | null
    dimensions: Record<string, string>
    postingText: string | null
  }>
  transactions: Array<{
    transactionId: string
    bankAccountName: string | null
    lineNos: number[]
    amount: string
    currency: string | null
    bookingDate: string
    creditDebitIndicator: string | null
    status: string | null
    ruleApplied: number | null
    ruleType: string | null
    provenance: 'regel' | 'manuel' | 'ingen_regel' | 'ukendt'
    postingText: string
    counterparty: string | null
    reference: string | null
    accountingLines: Array<{
      lineNo: number
      amount: string | null
      debetOrCredit: string | null
      dimensions: Record<string, string>
      postingText: string | null
      cpr: string | null
    }>
    summary: TransactionSummary
  }>
}

type ErpRawFilesResponse = {
  requestId: string
  requestPayload: string | null
  response: null | {
    id: string
    statusText: string | null
    payload: string | null
  }
}

type ErpTransaction = ErpRequestViewResponse['transactions'][number]

function provenanceLabel(transaction: ErpTransaction): string {
  if (transaction.provenance === 'manuel') return 'Manuel'
  if (transaction.provenance === 'ingen_regel') return 'Ingen regel'
  if (transaction.provenance === 'ukendt') return 'Ukendt'
  if (transaction.ruleApplied == null) return 'Regel'
  return transaction.ruleType
    ? `Regel #${transaction.ruleApplied} (${transaction.ruleType})`
    : `Regel #${transaction.ruleApplied}`
}

const toast = useToast()
const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UIcon = resolveComponent('UIcon')
const route = useRoute()
const endDefault = today(DEFAULT_TIME_ZONE)
const startDefault = endDefault.subtract({ days: 29 })
const dateRange = shallowRef<{ start: DateValue; end: DateValue }>({ start: startDefault, end: endDefault })
const page = ref(1)
const pageSize = ref(25)
const pageSizeOptions = [10, 25, 50, 100].map((value) => ({ label: `${value} ERP-forløb pr. side`, value }))
const start = computed(() => dateRange.value.start.toString())
const end = computed(() => dateRange.value.end.toString())

const { data: failedList, pending: failedPending, refresh: refreshFailed } = await useFetch<ErpRequestOverviewResponse>(
  '/api/fejlhaandtering/erp-requests/failed',
  {
    key: 'control-erp-requests',
    query: computed(() => ({ start: start.value, end: end.value, page: page.value, pageSize: pageSize.value })),
    watch: [start, end, page, pageSize],
    dedupe: 'cancel',
    deep: true,
    default: () => ({ items: [], total: 0, page: 1, pageSize: pageSize.value }),
  },
)

watch([start, end], () => { page.value = 1 })

const failedTableKey = computed(() => (failedList.value?.items ?? [])
  .map(item => `${item.runId}:${item.documentId ?? item.requestId}`)
  .join('|'))

const erpRequestId = ref('')
const erpLoading = ref(false)
const erpView = ref<ErpRequestViewResponse | null>(null)
const rawFilesLoading = ref(false)
const rawFilesOpen = ref(false)
const rawFiles = ref<ErpRawFilesResponse | null>(null)
const canEditRequestXml = computed(() => Boolean(
  rawFiles.value?.requestPayload
  && rawFiles.value.response?.statusText?.trim().toUpperCase().startsWith('FEJL'),
))
const isEditingRequestXml = ref(false)
const editedRequestXml = ref('')
const confirmEditedResend = ref(false)
const transactionSearchInput = ref('')
const debouncedTransactionSearch = useDebouncedString(transactionSearchInput, { delayMs: 300 })
const selectedTransactionIds = ref<Record<string, boolean>>({})
const selectedTransaction = ref<ErpTransaction | null>(null)
const selectedTransactionSummary = computed(() => selectedTransaction.value?.summary ?? null)
const isTransactionSummaryOpen = ref(false)

function openTransactionSummary(transaction: ErpTransaction) {
  selectedTransaction.value = transaction
  isTransactionSummaryOpen.value = true
}

async function openRawFiles() {
  if (!erpView.value) return
  rawFilesLoading.value = true
  try {
    rawFiles.value = await $fetch<ErpRawFilesResponse>(
      `/api/fejlhaandtering/erp-requests/${encodeURIComponent(erpView.value.requestId)}`,
      { method: 'GET' },
    )
    editedRequestXml.value = rawFiles.value.requestPayload ?? ''
    isEditingRequestXml.value = false
    confirmEditedResend.value = false
    rawFilesOpen.value = true
  } catch (error) {
    console.error('Kunne ikke hente rå ERP-filer', error)
    toast.add({ title: 'Kunne ikke hente rå ERP-filer', color: 'error' })
  } finally {
    rawFilesLoading.value = false
  }
}

const filteredTransactions = computed(() => fuzzyRankRows({
  rows: erpView.value?.transactions ?? [],
  query: debouncedTransactionSearch.value,
  getValues: (row) => [row.postingText],
}))

const selectedTransactionIdList = computed(() =>
  Object.entries(selectedTransactionIds.value)
    .filter(([, checked]) => checked)
    .map(([transactionId]) => transactionId)
    .filter((transactionId) => transactionId.trim().length > 0),
)

const hasTransactionDetails = computed(() => erpView.value?.documentOrigin === 'batch')

const transactionTableKey = computed(() =>
  (erpView.value?.transactions ?? [])
    .map((row) => `${row.transactionId}:${row.lineNos.join(',')}`)
    .join('|'),
)

async function refreshAll() {
  await refreshFailed()
  if (erpView.value?.requestId) {
    await loadErpRequest()
  }
}

async function loadErpRequest() {
  const id = erpRequestId.value.trim()
  if (!id) {
    erpView.value = null
    selectedTransactionIds.value = {}
    return
  }

  erpLoading.value = true
  try {
    const data = await $fetch<ErpRequestViewResponse>(
      `/api/fejlhaandtering/erp-requests/${encodeURIComponent(id)}/view`,
      { method: 'GET' },
    )
    erpView.value = data
    transactionSearchInput.value = ''
    selectedTransaction.value = null
    isTransactionSummaryOpen.value = false
    selectedTransactionIds.value = {}
  } catch (error) {
    console.error('Kunne ikke hente ERP request view', error)
    toast.add({ title: 'ERP-postering ikke fundet', color: 'error' })
    erpView.value = null
    selectedTransactionIds.value = {}
  } finally {
    erpLoading.value = false
  }
}

watch(
  () => route.query.requestId,
  async (requestId) => {
    if (!requestId) return
    const id = Array.isArray(requestId) ? String(requestId[0] ?? '') : String(requestId)
    if (!id.trim()) return
    if (erpRequestId.value.trim() === id.trim()) return
    erpRequestId.value = id.trim()
    await loadErpRequest()
  },
  { immediate: true },
)

async function resendErpRequest(payload?: string) {
  if (!erpView.value) return

  erpLoading.value = true
  try {
    const url = `/api/fejlhaandtering/erp-requests/${encodeURIComponent(erpView.value.requestId)}/resend`
    const res = await $fetch<{ success: boolean; requestId: string; sourceRequestId: string; filename: string }>(url, {
      method: 'POST',
      ...(payload !== undefined ? { body: { payload } } : {}),
    })
    toast.add({ title: 'ERP-postering genfremsendt' })
    rawFilesOpen.value = false
    isEditingRequestXml.value = false
    confirmEditedResend.value = false
    erpRequestId.value = res.requestId
    await loadErpRequest()
    await refreshFailed()
  } catch (error) {
    const responseError = error as { data?: { statusMessage?: unknown }; statusMessage?: unknown }
    const message = responseError.data?.statusMessage ?? responseError.statusMessage
    toast.add({
      title: typeof message === 'string' ? message : 'Kunne ikke genafsende',
      color: 'error',
    })
  } finally {
    erpLoading.value = false
  }
}

function cancelRequestXmlEdit() {
  isEditingRequestXml.value = false
  confirmEditedResend.value = false
  editedRequestXml.value = rawFiles.value?.requestPayload ?? ''
}

const groupingOptions = {
  groupedColumnMode: 'remove' as const,
  getGroupedRowModel: getGroupedRowModel(),
}

function getOverviewRowStatus(row: {
  getIsGrouped: () => boolean
  original: ErpRequestOverviewItem
}): ErpOverviewStatus {
  const status = row.getIsGrouped() ? row.original.group : row.original
  return {
    label: status.statusLabel,
    color: status.statusColor,
    detail: status.statusDetail,
  }
}

async function openOverviewRequest(requestId: string) {
  erpRequestId.value = requestId
  await loadErpRequest()
}

const onFailedRowSelect = createTableRowSelectHandler<ErpRequestOverviewItem>((item, row) => {
  void openOverviewRequest(row.getIsGrouped() ? item.group.requestId : item.requestId)
})

const failedColumns: TableColumn<ErpRequestOverviewItem>[] = [
  {
    accessorKey: 'groupingKey',
    header: 'Gruppering',
  },
  {
    id: 'label',
    header: 'Bilag',
  },
  {
    accessorKey: 'bookingDate',
    header: 'Bogføringsdato',
    cell: ({ row }) => row.getIsGrouped()
      ? row.original.group.bookingDate ?? '—'
      : row.original.bookingDate ?? '—',
  },
  {
    accessorKey: 'transactionCount',
    header: 'Transaktioner',
    cell: ({ row }) => row.getIsGrouped()
      ? `${row.original.group.transactionCount} transaktioner`
      : `${row.original.transactionCount} transaktioner`,
  },
  {
    id: 'status',
    header: 'Aktuel status',
    cell: ({ row }) => {
      const status = getOverviewRowStatus(row)
      return h(UBadge, {
        color: status.color,
        variant: 'subtle',
        title: status.detail ?? undefined,
      }, () => status.label)
    },
  },
  {
    id: 'open',
    header: '',
    enableSorting: false,
    size: 110,
    cell: ({ row }) => {
      const requestId = row.getIsGrouped()
        ? row.original.group.requestId
        : row.original.requestId
      return h(
        UButton,
        {
          size: 'sm',
          color: 'primary',
          variant: 'soft',
          disabled: failedPending.value || erpLoading.value,
          onClick: async (event: MouseEvent) => {
            event.stopPropagation()
            await openOverviewRequest(requestId)
          },
        },
        () => 'Åbn bogføring',
      )
    },
  },
]

const manualPostingColumns: TableColumn<ErpRequestViewResponse['manualPostings'][number]>[] = [
  {
    accessorKey: 'lineNo',
    header: 'Linje',
  },
  {
    accessorKey: 'amount',
    header: 'Beløb',
    cell: ({ row }) => formatAccountingAmount(row.original),
  },
  {
    accessorKey: 'debetOrCredit',
    header: 'D/K',
    cell: ({ row }) => formatAccountingDebitCredit(row.original.debetOrCredit),
  },
  {
    id: 'dimensions',
    header: 'Dimensioner',
    cell: ({ row }) => {
      const dimensions = Object.entries(row.original.dimensions)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
      return dimensions || '—'
    },
  },
  {
    accessorKey: 'postingText',
    header: 'Posteringstekst',
    cell: ({ row }) => row.original.postingText || '—',
  },
]

const reopeningTransactions = ref(false)
async function reopenSelectedTransactions() {
  if (!erpView.value) return

  const transactionIds = selectedTransactionIdList.value
  if (!transactionIds.length) {
    toast.add({ title: 'Vælg mindst én transaktion', color: 'error' })
    return
  }

  const ok = window.confirm(
    `Vil du genåbne ${transactionIds.length} valgte transaktion(er) i denne bogføring?\n\nGenåbning sker på transaktionsniveau og omfatter alle relaterede posteringer.`,
  )
  if (!ok) return

  reopeningTransactions.value = true
  try {
    const fetchReopen = $fetch as unknown as (
      request: string,
      options: { method: 'POST'; body: { transactionIds: string[] } },
    ) => Promise<ErpRequestReopenResponse>
    const res = await fetchReopen(
      `/api/fejlhaandtering/erp-requests/${encodeURIComponent(erpView.value.requestId)}/reopen`,
      {
        method: 'POST',
        body: { transactionIds },
      },
    )
    toast.add({
      title: 'Genåbning udført',
      description: `Genåbnede ${res.reopened}/${res.eligibleTransactions} transaktion(er).`,
    })
    await loadErpRequest()
  } catch (error) {
    console.error('Genåbning fejlede', error)
    toast.add({ title: 'Kunne ikke genåbne valgte', color: 'error' })
  } finally {
    reopeningTransactions.value = false
  }
}

const transactionColumns: TableColumn<ErpRequestViewResponse['transactions'][number]>[] = [
  {
    id: 'select',
    header: '',
    enableSorting: false,
    size: 40,
    cell: ({ row }) => {
      const transactionId = row.original.transactionId
      return h(UCheckbox, {
        modelValue: Boolean(selectedTransactionIds.value[transactionId]),
        disabled: erpLoading.value || reopeningTransactions.value,
        'onUpdate:modelValue': (value: boolean) => {
          selectedTransactionIds.value = { ...selectedTransactionIds.value, [transactionId]: value }
        },
      })
    },
  },
  {
    id: 'status',
    header: 'Status',
    size: 110,
    cell: ({ row }) => {
      const label = formatStatusLabel(row.original.status)
      if (!label) return '—'

      return h(
        UBadge,
        {
          variant: 'soft',
          color: resolveStatusColor(row.original.status),
        },
        () => label,
      )
    },
  },
  {
    id: 'rule',
    header: 'Kilde',
    cell: ({ row }) => provenanceLabel(row.original),
  },
  {
    id: 'bankAccountName',
    header: 'Konto',
    cell: ({ row }) => row.original.bankAccountName ?? '—',
  },
  {
    id: 'direction',
    header: 'Retning',
    cell: ({ row }) => {
      const tx = row.original
      const label = resolveDirectionLabel(tx.creditDebitIndicator, parseAmount(tx.amount))
      const icon = label === 'Indbetaling' ? appConfig.ui.icons.arrowAngleUp : appConfig.ui.icons.arrowAngleDown

      return h('div', { class: 'inline-flex items-center gap-1.5' }, [
        h(UIcon, { name: icon, class: 'h-4 w-4' }),
        h('span', label),
      ])
    },
  },
  {
    id: 'amount',
    header: 'Beløb',
    cell: ({ row }) => {
      const tx = row.original
      const amount = toSignedAmount(tx.amount, tx.creditDebitIndicator)
      return formatSignedDkk(amount)
    },
  },
  {
    id: 'postingText',
    header: 'Posteringstekst',
    cell: ({ row }) => row.original.postingText || '—',
  },
  {
    id: 'openTransaction',
    header: '',
    enableSorting: false,
    size: 150,
    cell: ({ row }) => h(
      UButton,
      {
        size: 'sm',
        color: 'primary',
        variant: 'soft',
        icon: appConfig.ui.icons.doc,
        onClick: () => openTransactionSummary(row.original),
      },
      () => 'Se detaljer',
    ),
  },
]

function parseAmount(value: string | number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function resolveDirectionLabel(indicator: string | null, amount: number): 'Indbetaling' | 'Udbetaling' {
  if (indicator === 'CRDT') return 'Indbetaling'
  if (indicator === 'DBIT') return 'Udbetaling'
  return amount < 0 ? 'Udbetaling' : 'Indbetaling'
}

function toSignedAmount(amount: string | number, indicator: string | null): number {
  const parsed = parseAmount(amount)
  if (indicator === 'DBIT') return -Math.abs(parsed)
  if (indicator === 'CRDT') return Math.abs(parsed)
  return parsed
}

function formatAccountingAmount(line: { amount: string | null; debetOrCredit: string | null }): string {
  return formatSignedDkk(Math.abs(parseAmount(line.amount ?? '0')))
}

function formatAccountingDebitCredit(value: string | null): string {
  if (value === 'Debet') return 'D'
  if (value === 'Kredit') return 'K'
  return '—'
}

function formatStatusLabel(status: string | null): string {
  const normalized = String(status ?? '').trim()
  if (!normalized) return ''
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function resolveStatusColor(status: string | null): 'warning' | 'success' {
  return String(status ?? '').trim().toLowerCase() === 'åben' ? 'warning' : 'success'
}

const reopenRunId = ref('')
const reopening = ref(false)
async function reopenBookedTransactions() {
  const runId = reopenRunId.value.trim()
  if (!runId) return
  const ok = window.confirm(
    'Vil du sætte alle bogførte transaktioner i denne run tilbage til åbne poster?\n\nBemærk: dette er et groft greb (alt i run). Brug transaktionsværktøjet ovenfor for en mere granulær genåbning.',
  )
  if (!ok) return

  reopening.value = true
  try {
    const fetchReopen = $fetch as unknown as (
      request: string,
      options: { method: 'POST' },
    ) => Promise<RunReopenResponse>
    const res = await fetchReopen(
      `/api/fejlhaandtering/runs/${encodeURIComponent(runId)}/reopen`,
      { method: 'POST' },
    )
    toast.add({ title: 'Genåbnet', description: `${res.reopened} transaktion(er)` })
  } catch (error) {
    console.error('Reopen fejlede', error)
    toast.add({ title: 'Kunne ikke genåbne', color: 'error' })
  } finally {
    reopening.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="recovery-erp">
    <template #header>
      <UDashboardNavbar title="ERP-integration">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            :icon="appConfig.ui.icons.reload"
            variant="ghost"
            color="primary"
            label="Opdater"
            :loading="failedPending || erpLoading"
            @click="refreshAll"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard>
          <template #header>
            <div class="flex flex-col gap-1">
              <div class="font-medium">ERP-forløb</div>
              <div class="text-sm text-muted">
                Bogføringer vises pr. batch med eventuelle manuelle bogføringer samlet under batchen. Tabellen viser den aktuelle status; genfremsendelser opretter ikke ekstra synlige rækker.
                Hvis en afsendelse mangler svar, så brug <NuxtLink to="/fejlhaandtering/koe" class="underline">Kørsler</NuxtLink>.
              </div>
            </div>
          </template>

          <FiltersRow
            v-model:date-range="dateRange"
            v-model:page-size="pageSize"
            :show-accounts="false"
            :show-page-size="true"
            :page-size-options="pageSizeOptions"
            date-label="Bogføringsdato"
          />

          <UEmpty
            v-if="!failedList?.items?.length"
            :icon="appConfig.ui.icons.check"
            title="Ingen ERP-forløb fundet"
            description="Der er ingen batcher eller manuelle bogføringer, som matcher de valgte filtre."
            class="mt-4 border border-dashed border-default rounded-lg"
          />

          <UTable
            v-else
            :key="failedTableKey"
            :data="failedList.items"
            :columns="failedColumns"
            :grouping="['groupingKey']"
            :grouping-options="groupingOptions"
            :loading="failedPending"
            class="mt-4"
            @select="onFailedRowSelect"
            @keydown="activateClickableTableRowOnKeydown"
            :ui="{
              root: 'min-w-full',
              base: 'border-separate border-spacing-0',
              thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
              tbody: `${clickableTableRowsBodyClass} [&>tr]:last:[&>td]:border-b-0`,
              th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
              td: 'border-b border-default empty:p-0',
              separator: 'h-0'
            }"
          >
            <template #label-cell="{ row }">
              <div v-if="row.getIsGrouped()" class="flex items-center gap-2">
                <UButton
                  v-if="row.original.group.childCount > 0"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  :icon="row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                  :aria-label="row.getIsExpanded() ? 'Skjul manuelle bogføringer' : 'Vis manuelle bogføringer'"
                  @click.stop="row.toggleExpanded()"
                />
                <div class="min-w-0">
                  <div class="font-medium">{{ row.original.group.documentLabel }}</div>
                  <div v-if="row.original.group.documentId" class="text-xs text-muted truncate">
                    {{ row.original.group.documentId }}
                  </div>
                </div>
              </div>
              <div v-else class="min-w-0">
                <div class="font-medium">{{ row.original.documentLabel }}</div>
                <div v-if="row.original.documentId" class="text-xs text-muted truncate">
                  {{ row.original.documentId }}
                </div>
              </div>
            </template>
          </UTable>

          <div v-if="failedList?.items?.length" class="flex items-center justify-center border-t border-default pt-4 mt-4">
            <UPagination
              v-model:page="page"
              :items-per-page="pageSize"
              :total="failedList?.total ?? 0"
            />
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex flex-col gap-1">
              <div class="font-medium">
                {{ !erpView
                  ? 'ERP-postering'
                  : erpView.documentOrigin === 'manual'
                    ? 'Manuel bogføring'
                    : erpView.documentOrigin === 'batch'
                      ? 'Batchpostering'
                      : 'ERP-postering' }}
              </div>
              <div class="text-sm text-muted">
                {{ !erpView
                  ? 'Vælg en bogføring ovenfor for at se transaktioner og handlinger.'
                  : erpView.documentOrigin === 'manual'
                    ? 'Samleposteringerne nedenfor er de linjer, der faktisk blev sendt til ERP.'
                    : erpView.documentOrigin === 'batch'
                      ? 'Transaktionerne nedenfor indgår i batchposteringen.'
                      : 'Transaktionslisten skjules, fordi bilagets oprindelse ikke er kendt.' }}
              </div>
            </div>
          </template>

          <UEmpty
            v-if="!erpView"
            :icon="appConfig.ui.icons.doc"
            title="Vælg en bogføring"
            description="Vælg en batch eller manuel bogføring fra listen ovenfor."
            class="border border-dashed border-default rounded-lg"
          />

          <div v-else class="space-y-4">
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div v-if="erpView.documentId" class="text-sm">
                <span class="text-muted">Bilagsnummer: </span>
                <span class="font-mono">{{ erpView.documentId }}</span>
              </div>
              <div v-if="hasTransactionDetails" class="text-sm">
                <span class="text-muted">Bogføringsdato: </span>
                <span class="font-mono">{{ erpView.header.bookingDate ?? 'Flere datoer' }}</span>
              </div>
              <div v-if="hasTransactionDetails" class="text-sm">
                <span class="text-muted">Transaktioner: </span>
                <span class="font-mono">{{ erpView.header.transactionCount }}</span>
              </div>
              <div v-if="hasTransactionDetails" class="text-sm">
                <span class="text-muted">Netto-beløb: </span>
                <span class="font-mono">{{ formatSignedDkk(toSignedAmount(erpView.header.totalAmount, null)) }}</span>
              </div>
              <div v-if="erpView.documentOrigin === 'manual'" class="text-sm">
                <span class="text-muted">Posteringer sendt til ERP: </span>
                <span class="font-mono">{{ erpView.manualPostings.length }}</span>
              </div>
              <div v-if="erpView.response?.statusText" class="text-sm">
                <span class="text-muted">Status: </span>
                <span>{{ erpView.response.statusText }}</span>
              </div>
            </div>

            <div v-if="hasTransactionDetails" class="flex flex-wrap items-end justify-between gap-3">
              <UFormField label="Posteringstekst" class="min-w-64 max-w-sm">
                <UInput
                  v-model="transactionSearchInput"
                  :trailing-icon="appConfig.ui.icons.search"
                  placeholder="Søg i posteringstekst..."
                  class="w-full"
                />
              </UFormField>
              <div class="text-sm text-muted">
                Viser {{ filteredTransactions.length }} af {{ erpView.transactions.length }} transaktioner
              </div>
            </div>

            <UEmpty
              v-if="hasTransactionDetails && !filteredTransactions.length"
              :icon="appConfig.ui.icons.search"
              title="Ingen transaktioner fundet"
              description="Ingen af de indlæste transaktioner matcher posteringsteksten."
              class="border border-dashed border-default rounded-lg"
            />

            <UTable
              v-if="hasTransactionDetails && filteredTransactions.length"
              :key="transactionTableKey"
              :data="filteredTransactions"
              :columns="transactionColumns"
              :loading="erpLoading"
              :ui="{
                base: 'border-separate border-spacing-0',
                thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                tbody: '[&>tr]:last:[&>td]:border-b-0',
                th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                td: 'border-b border-default',
                separator: 'h-0'
              }"
            />

            <UEmpty
              v-if="erpView.documentOrigin === 'manual' && !erpView.manualPostings.length"
              :icon="appConfig.ui.icons.doc"
              title="Ingen posteringer fundet"
              description="Der er ingen gemte ERP-posteringer på denne manuelle bogføring."
              class="border border-dashed border-default rounded-lg"
            />

            <UTable
              v-if="erpView.documentOrigin === 'manual' && erpView.manualPostings.length"
              :key="`manual-postings:${erpView.requestId}`"
              :data="erpView.manualPostings"
              :columns="manualPostingColumns"
              :loading="erpLoading"
              :ui="{
                base: 'border-separate border-spacing-0',
                thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                tbody: '[&>tr]:last:[&>td]:border-b-0',
                th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                td: 'border-b border-default empty:p-0',
                separator: 'h-0'
              }"
            />

            <div class="flex flex-wrap gap-2">
              <UButton
                :icon="appConfig.ui.icons.doc"
                label="Vis rå fil"
                color="neutral"
                variant="soft"
                :loading="rawFilesLoading"
                @click="openRawFiles"
              />
              <UButton
                v-if="hasTransactionDetails"
                :icon="appConfig.ui.icons.undo"
                label="Genåbn valgte transaktioner"
                color="warning"
                variant="soft"
                :disabled="!selectedTransactionIdList.length"
                :loading="reopeningTransactions"
                @click="reopenSelectedTransactions"
              />
              <UButton
                :icon="appConfig.ui.icons.send"
                label="Genfremsend ERP-postering"
                color="primary"
                variant="soft"
                :loading="erpLoading"
                @click="() => resendErpRequest()"
              />
              <div v-if="selectedTransactionIdList.length" class="text-sm text-muted">
                Valgt: {{ selectedTransactionIdList.length }} transaktion(er)
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex flex-col gap-1">
              <div class="font-medium">Genåbn bogførte transaktioner</div>
              <div class="text-sm text-muted">Groft værktøj: sætter alle bogførte transaktioner i en run tilbage til åbne poster.</div>
            </div>
          </template>

          <div class="flex flex-wrap items-end gap-2">
            <UFormField class="min-w-80">
              <UiFloatingLabelInput v-model="reopenRunId" label="runId (uuid)" color="neutral" />
            </UFormField>
            <UButton
              :icon="appConfig.ui.icons.undo"
              label="Sæt bogførte tilbage til åbne poster"
              color="warning"
              variant="soft"
              :loading="reopening"
              :disabled="!reopenRunId.trim().length"
              @click="reopenBookedTransactions"
            />
          </div>
        </UCard>
      </div>

      <UModal v-model:open="isTransactionSummaryOpen" title="Transaktion fra banken">
        <template #body>
          <div v-if="selectedTransaction" class="mb-5 rounded-md border border-default bg-elevated/30 px-3 py-2 text-sm">
            <span class="text-muted">Kilde: </span>
            <span class="font-medium">{{ provenanceLabel(selectedTransaction) }}</span>
          </div>
          <BookingSummaryCard
            v-if="selectedTransactionSummary"
            :summary="selectedTransactionSummary"
            :hide-section-keys="['teknisk']"
          />
          <section v-if="selectedTransaction?.accountingLines.length" class="mt-5 space-y-3">
            <h3 class="text-sm font-semibold">Sendt kontering</h3>
            <div class="overflow-x-auto rounded-lg border border-default">
              <table class="min-w-full text-sm">
                <thead class="bg-elevated/50 text-left">
                  <tr>
                    <th class="px-3 py-2 font-medium">Linje</th>
                    <th class="px-3 py-2 font-medium">Beløb</th>
                    <th class="px-3 py-2 font-medium">D/K</th>
                    <th class="px-3 py-2 font-medium">Dimensioner</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in selectedTransaction.accountingLines" :key="line.lineNo" class="border-t border-default align-top">
                    <td class="px-3 py-2 font-mono">{{ line.lineNo }}</td>
                    <td class="px-3 py-2 whitespace-nowrap">{{ formatAccountingAmount(line) }}</td>
                    <td class="px-3 py-2">{{ formatAccountingDebitCredit(line.debetOrCredit) }}</td>
                    <td class="px-3 py-2">
                      <div v-if="Object.keys(line.dimensions).length" class="space-y-1">
                        <div v-for="([key, value]) in Object.entries(line.dimensions)" :key="key" class="break-all">
                          <span class="text-muted">{{ key }}:</span> {{ value }}
                        </div>
                      </div>
                      <span v-else class="text-muted">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>
      </UModal>

      <UModal v-model:open="rawFilesOpen" title="Rå ERP-filer" :ui="{ content: 'max-w-5xl' }">
        <template #body>
          <div v-if="rawFiles" class="space-y-5">
            <section class="space-y-2">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="font-medium">Udgående ERP-fil</h3>
                <UButton
                  v-if="canEditRequestXml && !isEditingRequestXml"
                  :icon="appConfig.ui.icons.edit"
                  label="Rediger XML"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  @click="isEditingRequestXml = true"
                />
                <span v-else-if="!isEditingRequestXml" class="text-xs text-muted">
                  CPR/personfelter maskeret{{ canEditRequestXml ? '' : ' • XML-redigering kræver en ERP-afvisning' }}
                </span>
              </div>
              <div v-if="isEditingRequestXml" class="space-y-3">
                <UAlert
                  color="warning"
                  variant="subtle"
                  title="XML’en kan indeholde CPR- og personoplysninger"
                  description="Rettelsen gælder genfremsendelsen. Meld fejl i applikationens generering tilbage, så grundårsagen kan blive rettet."
                />
                <UTextarea
                  v-model="editedRequestXml"
                  :rows="24"
                  class="w-full font-mono text-xs"
                  spellcheck="false"
                  aria-label="Redigér udgående ERP XML"
                />
                <div v-if="confirmEditedResend" class="space-y-3 rounded-md border border-warning bg-warning/5 p-3">
                  <p class="text-sm">
                    Genfremsendelsen vises som samme bogføring med opdateret status. Kontrollér, at bilaget ikke allerede er bogført i ERP.
                  </p>
                  <div class="flex flex-wrap justify-end gap-2">
                    <UButton label="Tilbage" color="neutral" variant="soft" @click="confirmEditedResend = false" />
                    <UButton
                      :icon="appConfig.ui.icons.send"
                      label="Send korrigeret XML"
                      color="warning"
                      :loading="erpLoading"
                      :disabled="!editedRequestXml.trim()"
                      @click="resendErpRequest(editedRequestXml)"
                    />
                  </div>
                </div>
                <div v-else class="flex flex-wrap justify-end gap-2">
                  <UButton label="Annullér" color="neutral" variant="soft" @click="cancelRequestXmlEdit" />
                  <UButton
                    :icon="appConfig.ui.icons.send"
                    label="Kontrollér og genfremsend"
                    color="primary"
                    variant="soft"
                    :disabled="!editedRequestXml.trim()"
                    @click="confirmEditedResend = true"
                  />
                </div>
              </div>
              <pre v-else-if="rawFiles.requestPayload" class="max-h-[32rem] overflow-auto rounded-md border border-default bg-elevated/30 p-3 text-xs whitespace-pre-wrap break-all">{{ redactSensitiveXml(rawFiles.requestPayload) }}</pre>
              <p v-else class="text-sm text-muted">Ingen udgående ERP-fil er gemt.</p>
            </section>

            <section class="space-y-2">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="font-medium">Svar fra ERP</h3>
                <UBadge v-if="rawFiles.response?.statusText" color="neutral" variant="subtle">
                  {{ rawFiles.response.statusText }}
                </UBadge>
              </div>
              <pre v-if="rawFiles.response?.payload" class="max-h-[32rem] overflow-auto rounded-md border border-default bg-elevated/30 p-3 text-xs whitespace-pre-wrap break-all">{{ redactSensitiveXml(rawFiles.response.payload) }}</pre>
              <p v-else class="text-sm text-muted">Der er endnu ikke modtaget et svar fra ERP.</p>
            </section>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
