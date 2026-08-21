<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { today, type DateValue } from '@internationalized/date'
import FiltersRow from '~/components/filters/FiltersRow.vue'
import { useDebouncedString } from '~/composables/useDebouncedString'
import { fuzzyRankRows } from '~/lib/search/fuzzyRanking'
import BookingSummaryCard from '~/components/open-items/BookingSummaryCard.vue'
import type { TransactionSummary } from '~/types/transactions'
import { DEFAULT_TIME_ZONE, formatSignedDkk } from '~/utils'

const appConfig = useAppConfig()

type FailedErpRequestListItem = {
  requestId: string
  runId: string
  responseId: string | null
  statusText: string | null
  bookingDate: string | null
}

type FailedErpRequestsResponse = {
  items: FailedErpRequestListItem[]
  total: number
  page: number
  pageSize: number
}

type ErpRequestViewResponse = {
  requestId: string
  runId: string
  response: null | {
    id: string
    statusText: string | null
  }
  header: {
    bookingDate: string | null
    currencies: string[]
    lineCount: number
    transactionCount: number
    unmappedLineCount: number
    totalAmount: string
  }
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

type ErpTransaction = ErpRequestViewResponse['transactions'][number]

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
const pageSizeOptions = [10, 25, 50, 100].map((value) => ({ label: `${value} pr. side`, value }))
const start = computed(() => dateRange.value.start.toString())
const end = computed(() => dateRange.value.end.toString())

const { data: failedList, pending: failedPending, refresh: refreshFailed } = await useFetch<FailedErpRequestsResponse>(
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

const failedTableKey = computed(() => (failedList.value?.items ?? []).map((i) => String(i.requestId)).join('|'))

const erpRequestId = ref('')
const erpLoading = ref(false)
const erpView = ref<ErpRequestViewResponse | null>(null)
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
    toast.add({ title: 'ERP request ikke fundet', color: 'error' })
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

async function resendErpRequest() {
  if (!erpView.value) return

  erpLoading.value = true
  try {
    const url = `/api/fejlhaandtering/erp-requests/${encodeURIComponent(erpView.value.requestId)}/resend`
    const res = await $fetch<{ success: boolean; requestId: string; sourceRequestId: string; filename: string }>(url, {
      method: 'POST',
    })
    toast.add({ title: 'Ny ERP-request oprettet', description: res.requestId })
    erpRequestId.value = res.requestId
    await loadErpRequest()
    await refreshFailed()
  } catch (error) {
    console.error('Resend fejlede', error)
    toast.add({ title: 'Kunne ikke genafsende', color: 'error' })
  } finally {
    erpLoading.value = false
  }
}

const failedColumns: TableColumn<FailedErpRequestListItem>[] = [
  { accessorKey: 'requestId', header: 'Request', cell: ({ row }) => row.original.requestId },
  { accessorKey: 'runId', header: 'Run', size: 240, cell: ({ row }) => row.original.runId },
  { accessorKey: 'bookingDate', header: 'Bogføringsdato', cell: ({ row }) => row.original.bookingDate ?? '—' },
  { accessorKey: 'statusText', header: 'Status', cell: ({ row }) => row.original.statusText ?? 'Intet svar' },
  {
    id: 'open',
    header: '',
    enableSorting: false,
    size: 110,
    cell: ({ row }) => {
      const requestId = row.original.requestId
      return h(
        UButton,
        {
          size: 'sm',
          color: 'primary',
          variant: 'soft',
          disabled: failedPending.value || erpLoading.value,
          onClick: async () => {
            erpRequestId.value = requestId
            await loadErpRequest()
          },
        },
        () => 'Åbn',
      )
    },
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
    `Vil du genåbne ${transactionIds.length} valgte transaktion(er) i dette ERP-request?\n\nGenåbning sker på transaktionsniveau og omfatter alle relaterede posteringer.`,
  )
  if (!ok) return

  reopeningTransactions.value = true
  try {
    const res = (await $fetch(
      `/api/fejlhaandtering/erp-requests/${encodeURIComponent(erpView.value.requestId)}/reopen`,
      {
        method: 'POST',
        body: { transactionIds },
      },
    )) as {
      success: boolean
      reopened: number
      eligibleTransactions: number
      skippedNotBooked: number
    }
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
      () => 'Se transaktion',
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
  const indicator = line.debetOrCredit === 'Debet' ? 'DBIT' : line.debetOrCredit === 'Kredit' ? 'CRDT' : null
  return formatSignedDkk(toSignedAmount(line.amount ?? '0', indicator))
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
    const res = (await $fetch(`/api/fejlhaandtering/runs/${encodeURIComponent(runId)}/reopen`, {
      method: 'POST',
    })) as { success: boolean; reopened: number }
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
            :icon="appConfig.ui.icons.refresh"
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
                Her vises ERP-requests og responses. Brug bogføringsdato og posteringstekst til at finde et forløb, og åbn en request for at arbejde transaktionsbaseret med genåbning og genfremsendelse.
                Hvis et svar mangler helt (outbox/request uden kvittering), så brug <NuxtLink to="/fejlhaandtering/koe" class="underline">Kørsler</NuxtLink>.
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
            description="Der er ingen ERP-forløb, som matcher de valgte filtre."
            class="mt-4 border border-dashed border-default rounded-lg"
          />

          <UTable
            v-else
            :key="failedTableKey"
            :data="failedList.items"
            :columns="failedColumns"
            :loading="failedPending"
            class="mt-4"
            :ui="{
              base: 'border-separate border-spacing-0',
              thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
              tbody: '[&>tr]:last:[&>td]:border-b-0',
              th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
              td: 'border-b border-default',
              separator: 'h-0'
            }"
          />

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
              <div class="font-medium">Transaktioner i ERP-request</div>
              <div class="text-sm text-muted">
                Visningen er transaktionsbaseret og bruger samme persisted kobling som integrationen (request → linjer → transaktioner).
              </div>
            </div>
          </template>

          <UEmpty
            v-if="!erpView"
            :icon="appConfig.ui.icons.doc"
            title="Vælg en ERP request"
            description="Åbn en request fra listen ovenfor for at se transaktioner og handlinger."
            class="border border-dashed border-default rounded-lg"
          />

          <div v-else class="space-y-4">
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div class="text-sm">
                <span class="text-muted">Run: </span>
                <span class="font-mono">{{ erpView.runId }}</span>
              </div>
              <div class="text-sm">
                <span class="text-muted">Bogføringsdato: </span>
                <span class="font-mono">{{ erpView.header.bookingDate ?? 'Flere datoer' }}</span>
              </div>
              <div class="text-sm">
                <span class="text-muted">Transaktioner: </span>
                <span class="font-mono">{{ erpView.header.transactionCount }}</span>
              </div>
              <div class="text-sm">
                <span class="text-muted">Netto-beløb: </span>
                <span class="font-mono">{{ formatSignedDkk(toSignedAmount(erpView.header.totalAmount, null)) }}</span>
              </div>
              <div v-if="erpView.response" class="text-sm">
                <span class="text-muted">Response-ID: </span>
                <span class="font-mono">{{ erpView.response.id }}</span>
              </div>
              <div v-if="erpView.response?.statusText" class="text-sm">
                <span class="text-muted">Status: </span>
                <span>{{ erpView.response.statusText }}</span>
              </div>
            </div>

            <div class="flex flex-wrap items-end justify-between gap-3">
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
              v-if="!filteredTransactions.length"
              :icon="appConfig.ui.icons.search"
              title="Ingen transaktioner fundet"
              description="Ingen af de indlæste transaktioner matcher posteringsteksten."
              class="border border-dashed border-default rounded-lg"
            />

            <UTable
              v-else
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

            <div class="flex flex-wrap gap-2">
              <UButton
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
                label="Genfremsend ERP-request"
                color="primary"
                variant="soft"
                :loading="erpLoading"
                @click="resendErpRequest"
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
                    <th class="px-3 py-2 font-medium">Dimensioner</th>
                    <th class="px-3 py-2 font-medium">Tekst</th>
                    <th class="px-3 py-2 font-medium">CPR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in selectedTransaction.accountingLines" :key="line.lineNo" class="border-t border-default align-top">
                    <td class="px-3 py-2 font-mono">{{ line.lineNo }}</td>
                    <td class="px-3 py-2 whitespace-nowrap">{{ formatAccountingAmount(line) }}</td>
                    <td class="px-3 py-2">
                      <div v-if="Object.keys(line.dimensions).length" class="space-y-1">
                        <div v-for="([key, value]) in Object.entries(line.dimensions)" :key="key" class="break-all">
                          <span class="text-muted">{{ key }}:</span> {{ value }}
                        </div>
                      </div>
                      <span v-else class="text-muted">—</span>
                    </td>
                    <td class="px-3 py-2 break-all">{{ line.postingText || '—' }}</td>
                    <td class="px-3 py-2 font-mono">{{ line.cpr || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
