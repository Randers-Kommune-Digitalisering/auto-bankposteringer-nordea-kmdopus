<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { prettyPrintXml } from '~/lib/prettyPrintXml'

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

type ErpRequestDetails = {
  requestId: string
  runId: string
  requestPayload: string | null
  response: null | {
    id: string
    statusText: string | null
    payload: string | null
  }
}

type ErpRequestLinesResponse = {
  requestId: string
  lines: Array<{
    lineNo: number
    transactionId: string | null
    transaction: null | {
      amount: string
      currency: string | null
      bookingDate: string
      accountId: string | null
      creditorName: string | null
      debtorName: string | null
      remittanceUstrd: string[] | null
      processing: {
        status: string | null
        ruleApplied: number | null
      }
    }
  }>
}

const toast = useToast()
const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')
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

const erpLinesTableKey = computed(() => (erpLines.value?.lines ?? []).map((l) => `${l.lineNo}:${l.transactionId ?? ''}`).join('|'))

async function refreshAll() {
  await refreshFailed()
  if (erpDetails.value?.requestId) {
    await loadErpRequest()
  }
}

const erpRequestId = ref('')
const erpLoading = ref(false)
const erpDetails = ref<ErpRequestDetails | null>(null)
const erpPayloadDraft = ref('')

const erpLinesLoading = ref(false)
const erpLines = ref<ErpRequestLinesResponse | null>(null)
const selectedLineNos = ref<Record<number, boolean>>({})

function formatErpPayloadXml() {
  const raw = erpPayloadDraft.value
  if (!raw.trim()) return

  if (!raw.trimStart().startsWith('<')) {
    toast.add({
      title: 'Payload ligner ikke XML',
      description: 'Formatér XML virker kun når payload starter med "<".',
      color: 'neutral',
    })
    return
  }

  try {
    erpPayloadDraft.value = prettyPrintXml(raw)
  } catch (error) {
    console.error('Kunne ikke formatere XML', error)
    toast.add({
      title: 'Kunne ikke formatere XML',
      description: 'Kontrollér at payload er gyldig XML.',
      color: 'error',
    })
  }
}

const selectedLineNoList = computed(() =>
  Object.entries(selectedLineNos.value)
    .filter(([, checked]) => checked)
    .map(([lineNo]) => Number(lineNo))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b),
)

async function loadErpLines(requestId: string) {
  erpLinesLoading.value = true
  try {
    const data = await $fetch<ErpRequestLinesResponse>(
      `/api/fejlhaandtering/erp-requests/${encodeURIComponent(requestId)}/lines`,
      { method: 'GET' },
    )
    erpLines.value = data
    selectedLineNos.value = {}
  } catch (error) {
    console.error('Kunne ikke hente ERP request linjer', error)
    erpLines.value = null
    selectedLineNos.value = {}
  } finally {
    erpLinesLoading.value = false
  }
}

async function loadErpRequest() {
  const id = erpRequestId.value.trim()
  if (!id) {
    erpDetails.value = null
    erpPayloadDraft.value = ''
    erpLines.value = null
    selectedLineNos.value = {}
    return
  }

  erpLoading.value = true
  try {
    const data = await $fetch<ErpRequestDetails>(`/api/fejlhaandtering/erp-requests/${encodeURIComponent(id)}`, {
      method: 'GET',
    })
    erpDetails.value = data
    erpPayloadDraft.value = data.requestPayload ?? ''
    await loadErpLines(data.requestId)
  } catch (error) {
    console.error('Kunne ikke hente ERP request', error)
    toast.add({ title: 'ERP request ikke fundet', color: 'error' })
    erpDetails.value = null
    erpPayloadDraft.value = ''
    erpLines.value = null
    selectedLineNos.value = {}
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
  if (!erpDetails.value) return
  const payload = erpPayloadDraft.value
  if (!payload.trim().length) {
    toast.add({ title: 'Payload kan ikke være tom', color: 'error' })
    return
  }
  erpLoading.value = true
  try {
    const url = `/api/fejlhaandtering/erp-requests/${encodeURIComponent(erpDetails.value.requestId)}/resend` as any
    const res = await $fetch<{ success: boolean; requestId: string; sourceRequestId: string }>(url, {
      method: 'POST',
      body: { payload },
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

const reopeningLines = ref(false)
async function reopenSelectedLines() {
  if (!erpDetails.value) return
  const lineNos = selectedLineNoList.value
  if (!lineNos.length) {
    toast.add({ title: 'Vælg mindst én linje', color: 'error' })
    return
  }

  const ok = window.confirm(
    `Vil du genåbne bogførte transaktioner for ${lineNos.length} valgte linje(r) i dette ERP-request?\n\nSystemet bruger den persisted kobling (requestId → lineNo → transactionId).`,
  )
  if (!ok) return

  reopeningLines.value = true
  try {
    const res = (await $fetch(
      `/api/fejlhaandtering/erp-requests/${encodeURIComponent(erpDetails.value.requestId)}/reopen`,
      {
        method: 'POST',
        body: { lineNos },
      },
    )) as {
      success: boolean
      reopened: number
      eligibleTransactions: number
      missingLineNos: number[]
      unmappedLineNos: number[]
      skippedNotBooked: number
    }
    toast.add({
      title: 'Genåbning udført',
      description: `Genåbnede ${res.reopened}/${res.eligibleTransactions} transaktion(er).`,
    })
    await loadErpLines(erpDetails.value.requestId)
  } catch (error) {
    console.error('Genåbning fejlede', error)
    toast.add({ title: 'Kunne ikke genåbne valgte', color: 'error' })
  } finally {
    reopeningLines.value = false
  }
}

const linesColumns: TableColumn<ErpRequestLinesResponse['lines'][number]>[] = [
  {
    id: 'select',
    header: '',
    enableSorting: false,
    size: 40,
    cell: ({ row }) => {
      const lineNo = row.original.lineNo
      const hasTx = Boolean(row.original.transactionId)
      return h(UCheckbox as any, {
        modelValue: Boolean(selectedLineNos.value[lineNo]),
        disabled: !hasTx || erpLinesLoading.value || reopeningLines.value,
        'onUpdate:modelValue': (value: boolean) => {
          selectedLineNos.value = { ...selectedLineNos.value, [lineNo]: value }
        },
      })
    },
  },
  { accessorKey: 'lineNo', header: 'Linje', size: 80, cell: ({ row }) => String(row.original.lineNo) },
  {
    accessorKey: 'transactionId',
    header: 'Transaktion',
    cell: ({ row }) => row.original.transactionId ?? '—',
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => row.original.transaction?.processing.status ?? '—',
    size: 110,
  },
  {
    id: 'amount',
    header: 'Beløb',
    cell: ({ row }) => {
      const t = row.original.transaction
      if (!t) return '—'
      return `${t.amount}${t.currency ? ` ${t.currency}` : ''}`
    },
    size: 140,
  },
  {
    id: 'bookingDate',
    header: 'Bogføringsdato',
    cell: ({ row }) => row.original.transaction?.bookingDate ?? '—',
    size: 140,
  },
  {
    id: 'text',
    header: 'Tekst',
    cell: ({ row }) => {
      const t = row.original.transaction
      const ustrd = t?.remittanceUstrd?.filter(Boolean)?.join(' ') ?? ''
      const name = t?.creditorName ?? t?.debtorName ?? ''
      return [name, ustrd].filter(Boolean).join(' — ')
    },
  },
]

const reopenRunId = ref('')
const reopening = ref(false)
async function reopenBookedTransactions() {
  const runId = reopenRunId.value.trim()
  if (!runId) return
  const ok = window.confirm(
    'Vil du sætte alle bogførte transaktioner i denne run tilbage til åbne poster?\n\nBemærk: dette er et groft greb (alt i run). Brug linje-værktøjet ovenfor for en mere granulær genåbning.',
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
      <UDashboardNavbar title="ERP-afvisninger">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            :icon="appConfig.ui.icons.refresh"
            variant="ghost"
            color="primary"
            label="Opdater"
            :loading="failedPending || erpLoading || erpLinesLoading"
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
                Her vises ERP-requests hvor vi har modtaget et negativt udfald. Åbn en request for at se/redigere payload og genfremsende som en ny request.
                Hvis et svar mangler helt (outbox/request uden kvittering), så brug <NuxtLink to="/fejlhaandtering/koe" class="underline">Kø og genkørsel</NuxtLink>.
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
              <div class="font-medium">Redigér og genfremsend ERP-request</div>
              <div class="text-sm text-muted">
                Redigering her opretter en ny ERP-request ved genfremsendelse (originalen ændres ikke).
              </div>
            </div>
          </template>

          <UEmpty
            v-if="!erpDetails"
            :icon="appConfig.ui.icons.doc"
            title="Vælg en ERP request"
            description="Åbn en request fra listen ovenfor for at se payload, linjer og genfremsende."
            class="border border-dashed border-default rounded-lg"
          />

          <div v-else class="grid gap-4 lg:grid-cols-2 lg:items-stretch">
            <div class="flex h-full min-h-0 flex-col gap-4">
              <div class="space-y-2">
                <div class="text-sm">
                  <span class="text-muted">Request: </span>
                  <span class="font-mono">{{ erpDetails.requestId }}</span>
                </div>
                <div class="text-sm">
                  <span class="text-muted">Run: </span>
                  <span class="font-mono">{{ erpDetails.runId }}</span>
                </div>
                <div class="text-sm" v-if="erpDetails.response">
                  <span class="text-muted">Bilag: </span>
                  <span class="font-mono">{{ erpDetails.response.id }}</span>
                </div>
                <div class="text-sm" v-if="erpDetails.response?.statusText">
                  <span class="text-muted">Status: </span>
                  <span>{{ erpDetails.response.statusText }}</span>
                </div>
              </div>

              <UFormField label="Request payload (rå tekst/XML)" class="flex min-h-0 flex-1 flex-col">
                <div class="flex min-h-0 flex-1 flex-col gap-2">
                  <div class="flex justify-end">
                    <UButton
                      :icon="appConfig.ui.icons.wand"
                      label="Formatér XML"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      :disabled="erpLoading || !erpPayloadDraft.trim().length"
                      @click="formatErpPayloadXml"
                    />
                  </div>

                  <UTextarea
                    v-model="erpPayloadDraft"
                    :rows="16"
                    placeholder="Indsæt/redigér request payload..."
                    :disabled="erpLoading"
                    class="h-full min-h-80 font-mono"
                  />
                </div>
              </UFormField>

              <div class="flex flex-wrap gap-2">
                <UButton
                  :icon="appConfig.ui.icons.send"
                  label="Genfremsend til ERP (ny request)"
                  color="primary"
                  variant="soft"
                  :disabled="!erpDetails"
                  :loading="erpLoading"
                  @click="resendErpRequest"
                />
              </div>
            </div>

            <div class="flex h-full min-h-0 flex-col gap-4">
              <UAlert
                color="neutral"
                variant="soft"
                :icon="appConfig.ui.icons.info"
                class="text-sm"
              >
                Du kan nu se den persisted kobling mellem ERP requestId → postering(lineNo) → transactionId og genåbne udvalgte bogførte transaktioner.
              </UAlert>

              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="font-medium">Posteringslinjer i request</div>
                </div>

                <UTable
                  v-if="erpLines"
                  :key="erpLinesTableKey"
                  :data="erpLines.lines"
                  :columns="linesColumns"
                  :loading="erpLinesLoading"
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
                  v-else
                  :icon="appConfig.ui.icons.list"
                  title="Ingen linjer"
                  description="Der blev ikke fundet linjer for dette request."
                  class="border border-dashed border-default rounded-lg"
                />

                <div class="flex flex-wrap gap-2">
                  <UButton
                    :icon="appConfig.ui.icons.undo"
                    label="Genåbn valgte transaktioner"
                    color="warning"
                    variant="soft"
                    :disabled="!selectedLineNoList.length"
                    :loading="reopeningLines"
                    @click="reopenSelectedLines"
                  />
                  <div class="text-sm text-muted" v-if="selectedLineNoList.length">
                    Valgt: {{ selectedLineNoList.length }} linje(r)
                  </div>
                </div>
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
