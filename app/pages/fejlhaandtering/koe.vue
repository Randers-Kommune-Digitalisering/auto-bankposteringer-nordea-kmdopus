<script setup lang="ts">
import { DateFormatter, getLocalTimeZone, today } from '@internationalized/date'
import type { TableColumn } from '@nuxt/ui'
import type { RunListItem, RunListResponse } from '~/types/runs'
import useFlattenArray from '~/composables/useFlattenArray'

type RunOutboxContextResponse = {
  runIds: string[]
  outbox: Array<{
    id: string
    runId: string
    topic: string
    status: string
    attempts: number
    nextAttemptAt: string
    lastError: string | null
    payload: unknown
    requestId: string | null
    responseId: string | null
    responseStatusText: string | null
    createdAt: string
    processedAt: string | null
  }>
}

type RunJobsContextResponse = {
  runIds: string[]
  jobs: Array<{
    id: string
    type: string
    status: string
    runId: string
    attempts: number
    runAt: string
    lastError: string | null
    updatedAt: string
  }>
}

const toast = useToast()
const UButton = resolveComponent('UButton')
const route = useRoute()

const { data: runsData, pending: runsPending, refresh: refreshRuns } = await useFetch<RunListResponse>('/api/runs', {
  key: 'runs-for-recovery-queue',
  default: () => ([]),
})

const allRuns = computed<RunListItem[]>(() => useFlattenArray<RunListItem>(runsData))

// Date range picker state (same default as /koersler)
const df = new DateFormatter('da-DK', { dateStyle: 'medium' })
const endDefault = today(getLocalTimeZone())
const startDefault = endDefault.subtract({ days: 29 })
const defaultRange = { start: startDefault, end: endDefault }
const dateRange = ref<any>(defaultRange)

const filteredRuns = computed<RunListItem[]>(() => {
  if (!dateRange.value?.start || !dateRange.value?.end) return allRuns.value

  const start = dateRange.value.start.toDate(getLocalTimeZone())
  const end = dateRange.value.end.toDate(getLocalTimeZone())
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  return allRuns.value.filter((run) => {
    const runDate = new Date(run.bookingDate)
    return runDate >= start && runDate <= end
  })
})

const runOptions = computed(() =>
  [...filteredRuns.value]
    .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
    .map((run) => ({
      value: run.id,
      label: `${new Date(run.bookingDate).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })} • ${run.status ?? 'afventer'}`,
    })),
)

const selectedRunIds = ref<string[]>([])
const selectedSingleRunId = computed(() => (selectedRunIds.value.length === 1 ? selectedRunIds.value[0] : undefined))

function parseQueryRunIds(): string[] {
  const q: any = route.query
  const raw = q.runIds ?? q.runId
  if (Array.isArray(raw)) return raw.flatMap((v) => String(v).split(',').map((s) => s.trim()).filter(Boolean))
  if (typeof raw === 'string') return raw.split(',').map((s) => s.trim()).filter(Boolean)
  return []
}

const runErpLoading = ref(false)
const runErp = ref<RunOutboxContextResponse | null>(null)

const runJobsLoading = ref(false)
const runJobs = ref<RunJobsContextResponse | null>(null)

async function loadRunErp() {
  const runIds = selectedRunIds.value
  if (!runIds.length) {
    runErp.value = null
    runJobs.value = null
    return
  }

  runErpLoading.value = true
  runJobsLoading.value = true
  try {
    const [outboxRes, jobsRes] = await Promise.all([
      $fetch<RunOutboxContextResponse>('/api/fejlhaandtering/runs/outbox', {
        method: 'GET',
        query: { runIds: runIds.join(',') },
      } as any),
      $fetch<RunJobsContextResponse>('/api/fejlhaandtering/runs/jobs', {
        method: 'GET',
        query: { runIds: runIds.join(',') },
      } as any),
    ])

    runErp.value = outboxRes
    runJobs.value = jobsRes
  } catch (error) {
    console.error('Kunne ikke hente run ERP/outbox kontekst', error)
    runErp.value = null
    runJobs.value = null
    toast.add({ title: 'Kunne ikke hente run-kontekst', color: 'error' })
  } finally {
    runErpLoading.value = false
    runJobsLoading.value = false
  }
}

async function refreshPageData() {
  await refreshRuns()
  if (selectedRunIds.value.length) {
    await loadRunErp()
  }
}

watch(selectedRunIds, async () => {
  await loadRunErp()
}, { deep: true })

watch(
  () => [allRuns.value.length, route.query.runId, route.query.runIds] as const,
  async () => {
    const fromQuery = parseQueryRunIds()
    if (!fromQuery.length) return
    if (!allRuns.value.length) return

    const available = new Set(allRuns.value.map((r) => r.id))
    const next = fromQuery.filter((id) => available.has(id))
    if (!next.length) return
    if (next.join(',') === selectedRunIds.value.join(',')) return

    selectedRunIds.value = next
  },
  { immediate: true },
)

// Calendar events (chip events) based on runs in selected period
type StatusColor = 'success' | 'error' | 'warning' | 'neutral'
const getColorByStatus = (status: string | null | undefined): StatusColor => {
  switch (status) {
    case 'udført':
      return 'success'
    case 'fejl':
      return 'error'
    case 'indlæser':
      return 'warning'
    case 'afventer':
    default:
      return 'neutral'
  }
}

function getChipColorByDate(date: Date): StatusColor | undefined {
  const dateKey = date.toISOString().slice(0, 10)
  const events = calendarEvents.value[dateKey] ?? []
  if (!events.length) return undefined

  const colors = new Set(events.map((e) => e.color))
  if (colors.has('error')) return 'error'
  if (colors.has('warning')) return 'warning'
  if (colors.has('success')) return 'success'
  return 'neutral'
}

const calendarEvents = computed(() => {
  const events: Record<string, Array<{ color: StatusColor; label: string }>> = {}
  allRuns.value.forEach((run) => {
    const dateKey = new Date(run.bookingDate).toISOString().slice(0, 10)
    const status = String(run.status ?? 'afventer')
    events[dateKey] = events[dateKey] ?? []
    events[dateKey].push({ color: getColorByStatus(run.status as any), label: status })
  })
  return events
})

const outboxStatusCounts = computed(() => {
  const rows = runErp.value?.outbox ?? []
  const counts: Record<'pending' | 'processing' | 'sent' | 'failed', number> = {
    pending: 0,
    processing: 0,
    sent: 0,
    failed: 0,
  }
  for (const row of rows) {
    const key = String(row.status ?? '').trim() as keyof typeof counts
    if (Object.prototype.hasOwnProperty.call(counts, key)) {
      counts[key] = (counts[key] ?? 0) + 1
    }
  }
  return counts
})

function outboxStatusColor(status: string): 'success' | 'error' | 'warning' | 'neutral' {
  switch (status) {
    case 'sent':
      return 'success'
    case 'failed':
      return 'error'
    case 'processing':
      return 'warning'
    case 'pending':
    default:
      return 'neutral'
  }
}

function outboxStatusLabel(status: string): string {
  switch (status) {
    case 'sent':
      return 'Afsendt'
    case 'failed':
      return 'Fejlet'
    case 'processing':
      return 'Sender'
    case 'pending':
      return 'Afventer'
    default:
      return status || '—'
  }
}

function jobStatusLabel(status: string): string {
  switch (status) {
    case 'succeeded':
      return 'OK'
    case 'failed':
      return 'Fejl'
    case 'in_progress':
      return 'Kører'
    case 'pending':
      return 'Afventer'
    default:
      return status || '—'
  }
}

function directionLabelFromJobType(type: string): 'Ind' | 'Ud' {
  if (type === 'banking.ingest') return 'Ind'
  if (type === 'erp.ingestResponses') return 'Ind'
  return 'Ind'
}

function directionLabelFromOutboxTopic(topic: string): 'Ind' | 'Ud' {
  return 'Ud'
}

function responseBadgeColor(row: RunOutboxContextResponse['outbox'][number]): 'success' | 'neutral' | 'error' {
  if (!row.requestId) return 'neutral'
  if (row.responseId) return 'success'
  // If we have an ERP request but no response yet, it's not an error by itself.
  return 'neutral'
}

const runningWorker = ref(false)
async function runWorkerNow() {
  runningWorker.value = true
  try {
    const res = await $fetch<{ success: boolean; jobs: number; outbox: number }>(
      '/api/fejlhaandtering/worker',
      { method: 'POST', body: { maxJobs: 25, maxOutbox: 50 } },
    )
    toast.add({
      title: 'Behandling kørt',
      description: `Behandling: ${res.jobs}, afleveringer: ${res.outbox}`,
    })
    await refreshPageData()
  } catch (error) {
    console.error('Worker fejlede', error)
    toast.add({ title: 'Behandling fejlede', color: 'error' })
  } finally {
    runningWorker.value = false
  }
}

const enqueuing = ref<'banking.ingest' | 'erp.ingestResponses' | null>(null)
async function enqueue(type: 'banking.ingest' | 'erp.ingestResponses') {
  enqueuing.value = type
  try {
    if (selectedRunIds.value.length !== 1) {
      toast.add({
        title: 'Vælg præcis én kørsel',
        description: 'Denne handling kræver at du vælger præcis én run.',
        color: 'warning',
      })
      return
    }

    await $fetch('/api/fejlhaandtering/jobs/enqueue', {
      method: 'POST',
      body: {
        type,
        ...(selectedSingleRunId.value ? { runId: selectedSingleRunId.value } : {}),
      },
    })
    toast.add({ title: 'Opgave oprettet', description: type })
    await refreshPageData()
  } catch (error) {
    console.error('Enqueue fejlede', error)
    toast.add({ title: 'Kunne ikke oprette opgave', color: 'error' })
  } finally {
    enqueuing.value = null
  }
}

const runOutboxColumns: TableColumn<RunOutboxContextResponse['outbox'][number]>[] = [
  {
    id: 'direction',
    header: 'Retning',
    size: 90,
    cell: ({ row }) => directionLabelFromOutboxTopic(String(row.original.topic ?? '')),
  },
  {
    accessorKey: 'runId',
    header: 'Run',
    size: 210,
    cell: ({ row }) => String(row.original.runId ?? '—'),
  },
  { accessorKey: 'topic', header: 'Afleveringstype', size: 220 },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    cell: ({ row }) => {
      const status = String(row.getValue('status') ?? '')
      return h(
        resolveComponent('UBadge'),
        { color: outboxStatusColor(status), variant: 'subtle', class: 'w-fit' },
        () => outboxStatusLabel(status),
      )
    },
  },
  {
    accessorKey: 'attempts',
    header: 'Forsøg',
    size: 90,
    cell: ({ row }) => String(row.getValue('attempts') ?? ''),
  },
  {
    accessorKey: 'requestId',
    header: 'Request',
    size: 240,
    cell: ({ row }) => String(row.original.requestId ?? '—'),
  },
  {
    id: 'response',
    header: 'Svar',
    size: 160,
    cell: ({ row }) => {
      const label = row.original.responseId ? 'Modtaget' : '—'
      return h(
        resolveComponent('UBadge'),
        { color: responseBadgeColor(row.original), variant: 'subtle', class: 'w-fit' },
        () => label,
      )
    },
  },
  {
    accessorKey: 'lastError',
    header: 'Seneste fejl',
    cell: ({ row }) => {
      const value = row.getValue('lastError') as string | null
      return value ? value : ''
    },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => {
      const status = String(row.original.status ?? '')
      const id = row.original.id
      const requestId = row.original.requestId
      const isErpTopic = String(row.original.topic ?? '').startsWith('erp.')
      const canResendErp = Boolean(isErpTopic && requestId && !row.original.responseId)

      if (status === 'failed') {
        return h(
          UButton,
          {
            size: 'sm',
            color: 'primary',
            variant: 'soft',
            disabled: runErpLoading.value,
            onClick: async () => {
              try {
                await $fetch(`/api/fejlhaandtering/outbox/${id}/retry`, { method: 'POST' })
                await Promise.all([loadRunErp(), refreshPageData()])
                toast.add({ title: 'Outbox sat til genkørsel' })
              } catch (error) {
                console.error('Outbox retry fejlede', error)
                toast.add({ title: 'Outbox retry fejlede', color: 'error' })
              }
            },
          },
          () => 'Genkør',
        )
      }

      if (canResendErp) {
        return h(
          UButton,
          {
            size: 'sm',
            color: 'neutral',
            variant: 'soft',
            disabled: runErpLoading.value,
            onClick: async () => {
              try {
                const res = await $fetch<{ success: boolean; requestId: string; sourceRequestId: string }>(
                  `/api/fejlhaandtering/erp-requests/${encodeURIComponent(requestId!)}/resend`,
                  { method: 'POST' },
                )
                toast.add({ title: 'ERP request genfremsendt', description: `Ny request: ${res.requestId}` })
                await Promise.all([loadRunErp(), refreshPageData()])
              } catch (error) {
                console.error('ERP resend fejlede', error)
                toast.add({ title: 'ERP resend fejlede', color: 'error' })
              }
            },
          },
          () => 'Genfremsend',
        )
      }

      return h(
        UButton,
        {
          size: 'sm',
          color: 'info',
          variant: 'outline',
          disabled: true,
        },
        () => 'Genkør',
      )
    },
  },
]

const runJobColumns: TableColumn<RunJobsContextResponse['jobs'][number]>[] = [
  {
    id: 'direction',
    header: 'Retning',
    size: 90,
    cell: ({ row }) => directionLabelFromJobType(String(row.original.type ?? '')),
  },
  {
    accessorKey: 'runId',
    header: 'Run',
    size: 210,
    cell: ({ row }) => String(row.original.runId ?? '—'),
  },
  { accessorKey: 'type', header: 'Type', size: 220 },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    cell: ({ row }) => {
      const status = String(row.getValue('status') ?? '')
      const color =
        status === 'succeeded'
          ? 'success'
          : status === 'failed'
            ? 'error'
            : status === 'in_progress'
              ? 'warning'
              : 'neutral'
      return h(resolveComponent('UBadge'), { color, variant: 'subtle', class: 'w-fit' }, () => jobStatusLabel(status))
    },
  },
  {
    accessorKey: 'attempts',
    header: 'Forsøg',
    size: 90,
    cell: ({ row }) => String(row.getValue('attempts') ?? ''),
  },
  {
    accessorKey: 'lastError',
    header: 'Seneste fejl',
    cell: ({ row }) => String(row.getValue('lastError') ?? ''),
  },
  {
    id: 'retry',
    header: '',
    enableSorting: false,
    cell: ({ row }) => {
      const status = String(row.original.status ?? '')
      const id = row.original.id
      return h(
        UButton,
        {
          size: 'sm',
          color: status === 'failed' ? 'primary' : 'info',
          variant: status === 'failed' ? 'soft' : 'outline',
          disabled: runJobsLoading.value || status !== 'failed',
          onClick: async () => {
            if (status !== 'failed') return
            try {
              await $fetch(`/api/fejlhaandtering/jobs/${id}/retry`, { method: 'POST' })
              await Promise.all([loadRunErp(), refreshPageData()])
              toast.add({ title: 'Job sat til genkørsel' })
            } catch (error) {
              console.error('Job retry fejlede', error)
              toast.add({ title: 'Job retry fejlede', color: 'error' })
            }
          },
        },
        () => 'Genkør',
      )
    },
  },
]
</script>

<template>
  <UDashboardPanel id="recovery-queue">
    <template #header>
      <UDashboardNavbar title="Kø og genkørsel">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="solar:refresh-bold-duotone"
            variant="ghost"
            color="primary"
            label="Opdater"
            :loading="runsPending || runErpLoading || runJobsLoading"
            @click="refreshPageData"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <div class="flex flex-col gap-4 md:flex-row md:items-end">
          <div class="min-w-0">
            <UFormField label="Periode">
              <UPopover :popper="{ placement: 'bottom-start' }">
                <UButton variant="outline" icon="solar:calendar-bold-duotone" :loading="runsPending" class="w-full md:w-auto">
                  <template v-if="dateRange?.start">
                    <template v-if="dateRange?.end">
                      {{ df.format(dateRange.start.toDate(getLocalTimeZone())) }} - {{ df.format(dateRange.end.toDate(getLocalTimeZone())) }}
                    </template>
                    <template v-else>
                      {{ df.format(dateRange.start.toDate(getLocalTimeZone())) }}
                    </template>
                  </template>
                  <template v-else>
                    Vælg periode
                  </template>
                </UButton>

                <template #content>
                  <div class="p-4">
                    <UCalendar
                      v-model="dateRange"
                      variant="subtle"
                      class="p-2"
                      :number-of-months="2"
                      range
                    >
                      <template #day="{ day }">
                        <UChip
                          :show="!!getChipColorByDate(day.toDate('UTC'))"
                          :color="getChipColorByDate(day.toDate('UTC'))"
                          size="lg"
                        >
                          {{ day.day }}
                        </UChip>
                      </template>
                    </UCalendar>
                    <div v-if="dateRange?.start && dateRange?.end" class="mt-4 flex gap-2">
                      <UButton
                        variant="ghost"
                        size="sm"
                        label="Nulstil"
                        @click="dateRange = defaultRange"
                        class="flex-1"
                      />
                    </div>
                  </div>
                </template>
              </UPopover>
            </UFormField>
          </div>

          <div class="md:ml-auto md:w-[28rem]">
            <UFormField label="Kørsel (run)">
              <USelectMenu
                v-model="selectedRunIds"
                :items="runOptions"
                multiple
                valueKey="value"
                labelKey="label"
                placeholder="Vælg en kørsel"
                :loading="runsPending"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <UCard>
          <template #header>
            <div class="flex flex-col gap-1">
              <div class="font-medium">Fejlhåndtering og genkørsel</div>
              <div class="text-sm text-muted">
                Genkørsel sker ved at sætte behandling/afleveringer tilbage til “Afventer” og lade systemet håndtere genforsøg.
              </div>
              <div class="text-sm text-muted">
                I normal drift kører behandlingen automatisk (se deployment-roller via <span class="font-mono">APP_ROLE</span>).
                Knapperne herunder er derfor manuelle recovery/debug-handtag.
              </div>

              <div class="mt-2 text-sm text-muted">
                <div class="font-medium text-default">Hvornår giver det mening?</div>
                <ul class="list-disc pl-5 space-y-1 mt-1">
                  <li>
                    <span class="font-medium text-default">Fejlede ERP-afleveringer</span>: tryk “Genkør” på den konkrete aflevering.
                  </li>
                  <li>
                    <span class="font-medium text-default">Fejlede behandlingsopgaver</span>: tryk “Genkør” på den konkrete række.
                  </li>
                  <li>
                    <span class="font-medium text-default">Dagens behandling er ikke startet</span>: brug nød-knapperne til at få arbejdet i gang igen.
                  </li>
                  <li>
                    <span class="font-medium text-default">Behandling er stoppet / hænger</span>: “Kør behandling nu” kan dræne noget af køen, men i drift bør den køre kontinuerligt.
                  </li>
                </ul>
                <div class="mt-2">
                  Se også <NuxtLink to="/koersler" class="underline">Kørsler</NuxtLink> for run-overblik,
                  og <NuxtLink to="/fejlhaandtering/erp" class="underline">ERP-fejl</NuxtLink> for request/resend.
                </div>
              </div>
            </div>
          </template>

          <div v-if="selectedRunIds.length" class="mt-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge color="neutral" variant="subtle">Valgte kørsler: {{ selectedRunIds.length }}</UBadge>
              <UBadge :color="outboxStatusColor('failed')" variant="subtle">Fejlede afleveringer: {{ outboxStatusCounts.failed }}</UBadge>
              <UBadge :color="outboxStatusColor('pending')" variant="subtle">Afventer: {{ outboxStatusCounts.pending }}</UBadge>
              <UBadge :color="outboxStatusColor('processing')" variant="subtle">Sender: {{ outboxStatusCounts.processing }}</UBadge>
              <UBadge :color="outboxStatusColor('sent')" variant="subtle">Afsendt: {{ outboxStatusCounts.sent }}</UBadge>
            </div>
            <div class="flex items-center gap-2">
              <UButton
                icon="solar:download-bold-duotone"
                label="Poll ERP-svar nu"
                color="neutral"
                variant="soft"
                :disabled="selectedRunIds.length !== 1"
                :loading="enqueuing === 'erp.ingestResponses'"
                @click="enqueue('erp.ingestResponses')"
              />
            </div>
          </div>

          <div class="grid gap-6 mt-4 lg:grid-cols-2">
            <div>
              <div class="flex items-center justify-between mb-2">
                    <div class="font-medium">Behandling (kørsel)</div>
                <UBadge color="neutral" variant="subtle">{{ runJobs?.jobs?.length ?? 0 }}</UBadge>
              </div>

              <UEmpty
                v-if="!runJobsLoading && !(runJobs?.jobs?.length)"
                icon="solar:archive-bold-duotone"
                title="Ingen jobs"
                description="Der er ingen jobs knyttet til den valgte kørsel."
                class="border border-dashed border-default rounded-lg"
              />

              <UTable
                v-else-if="runJobs"
                :data="runJobs?.jobs ?? []"
                :columns="runJobColumns"
                :loading="runJobsLoading"
                :ui="{
                  base: 'border-separate border-spacing-0',
                  thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                  tbody: '[&>tr]:last:[&>td]:border-b-0',
                  th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                  td: 'border-b border-default',
                  separator: 'h-0'
                }"
              />
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                    <div class="font-medium">ERP-afleveringer (kørsel)</div>
                <UBadge color="neutral" variant="subtle">{{ runErp?.outbox?.length ?? 0 }}</UBadge>
              </div>

              <UEmpty
                v-if="!runErpLoading && !(runErp?.outbox?.length)"
                icon="solar:inbox-bold-duotone"
                    title="Ingen ERP-afleveringer"
                    description="Der er ingen ERP-afleveringer for den valgte kørsel."
                class="border border-dashed border-default rounded-lg"
              />

              <UTable
                v-else-if="runErp"
                :data="runErp?.outbox ?? []"
                :columns="runOutboxColumns"
                :loading="runErpLoading"
                :ui="{
                  base: 'border-separate border-spacing-0',
                  thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                  tbody: '[&>tr]:last:[&>td]:border-b-0',
                  th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                  td: 'border-b border-default',
                  separator: 'h-0'
                }"
              />
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 mt-4">
          <UButton
            icon="solar:play-bold-duotone"
            label="Kør behandling nu"
            color="primary"
            variant="soft"
            :loading="runningWorker"
            @click="runWorkerNow"
          />
          <UButton
            icon="solar:download-bold-duotone"
            label='Hent bankdata'
            color="neutral"
            variant="soft"
            :disabled="selectedRunIds.length !== 1"
            :loading="enqueuing === 'banking.ingest'"
            @click="enqueue('banking.ingest')"
          />
        </div>
      </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
