<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { formatSignedDkk } from '~/utils'

const appConfig = useAppConfig()

type FailedErpRequestListItem = {
  requestId: string
  runId: string
  responseId: string
  statusText: string
}

type FailedErpRequestsResponse = {
  items: FailedErpRequestListItem[]
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
  }>
}

const toast = useToast()
const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UIcon = resolveComponent('UIcon')
const route = useRoute()

const { data: failedList, pending: failedPending, refresh: refreshFailed } = await useFetch<FailedErpRequestsResponse>(
  '/api/fejlhaandtering/erp-requests/failed',
  {
    key: 'failed-erp-requests',
    deep: true,
    default: () => ({ items: [] }),
  },
)

const failedTableKey = computed(() => (failedList.value?.items ?? []).map((i) => String(i.requestId)).join('|'))

const erpRequestId = ref('')
const erpLoading = ref(false)
const erpView = ref<ErpRequestViewResponse | null>(null)
const selectedTransactionIds = ref<Record<string, boolean>>({})

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
  { accessorKey: 'statusText', header: 'Status', cell: ({ row }) => row.original.statusText },
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
    id: 'direction',
    header: 'Retning',
    size: 120,
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
    size: 160,
    cell: ({ row }) => {
      const tx = row.original
      const amount = toSignedAmount(tx.amount, tx.creditDebitIndicator)
      return formatSignedDkk(amount)
    },
  },
  {
    id: 'counterparty',
    header: 'Modpart',
    size: 180,
    cell: ({ row }) => row.original.counterparty ?? '—',
  },
  {
    id: 'reference',
    header: 'Reference',
    size: 220,
    cell: ({ row }) => row.original.reference ?? '—',
  },
  {
    id: 'postingText',
    header: 'Posteringstekst',
    cell: ({ row }) => row.original.postingText || '—',
  },
  {
    id: 'lineNos',
    header: 'Linjenumre',
    size: 120,
    cell: ({ row }) => row.original.lineNos.join(', '),
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
              <div class="font-medium">Afviste ERP-svar</div>
              <div class="text-sm text-muted">
                Her vises ERP-requests hvor vi har modtaget et negativt udfald. Åbn en request for at arbejde transaktionsbaseret med genåbning og genfremsendelse.
                Hvis et svar mangler helt (outbox/request uden kvittering), så brug <NuxtLink to="/fejlhaandtering/koe" class="underline">Kørsler</NuxtLink>.
              </div>
            </div>
          </template>

          <div class="flex items-center justify-between mb-2">
            <div class="text-sm text-muted">Seneste 50</div>
            <UBadge color="neutral" variant="subtle">{{ (failedList?.items?.length ?? 0) }}</UBadge>
          </div>

          <UEmpty
            v-if="!failedList?.items?.length"
            :icon="appConfig.ui.icons.check"
            title="Ingen afviste ERP-svar"
            description="Der er ingen ERP responses med negativ status i databasen."
            class="border border-dashed border-default rounded-lg"
          />

          <UTable
            v-else
            :key="failedTableKey"
            :data="failedList.items"
            :columns="failedColumns"
            :loading="failedPending"
            :ui="{
              base: 'border-separate border-spacing-0',
              thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
              tbody: '[&>tr]:last:[&>td]:border-b-0',
              th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
              td: 'border-b border-default',
              separator: 'h-0'
            }"
          />
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
                <span class="text-muted">Bilag: </span>
                <span class="font-mono">{{ erpView.response.id }}</span>
              </div>
              <div v-if="erpView.response?.statusText" class="text-sm">
                <span class="text-muted">Status: </span>
                <span>{{ erpView.response.statusText }}</span>
              </div>
            </div>

            <UTable
              :key="transactionTableKey"
              :data="erpView.transactions"
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
    </template>
  </UDashboardPanel>
</template>
