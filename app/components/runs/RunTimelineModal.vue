<script setup lang="ts">
import { DateFormatter } from '@internationalized/date'
import type { TimelineItem } from '@nuxt/ui'
import type { RunListItem } from '~/types/runs'
import type { RunTimelineResponse } from '~/types/runTimeline'

const props = defineProps<{
  open: boolean
  run: RunListItem | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const open = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const df = new DateFormatter('da-DK', { dateStyle: 'medium' })
const dtf = new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium', timeStyle: 'short' })

const toast = useToast()

const loading = ref(false)
const data = ref<RunTimelineResponse | null>(null)

const openPopovers = ref<Record<string, boolean>>({})

const runId = computed(() => props.run?.id ?? '')

function formatDateOnly(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return df.format(d)
}

async function load() {
  if (!props.run?.id) return
  loading.value = true
  try {
    data.value = await $fetch<RunTimelineResponse>(`/api/runs/${encodeURIComponent(props.run.id)}/timeline`, {
      method: 'GET',
    })
  } catch (error) {
    console.error('Kunne ikke hente run timeline', error)
    toast.add({ title: 'Kunne ikke hente run-detaljer', color: 'error' })
    data.value = null
  } finally {
    loading.value = false
  }
}

watch(
  () => [open.value, props.run?.id] as const,
  async ([isOpen]) => {
    if (!isOpen) {
      data.value = null
      return
    }
    await load()
  },
)

type StatusColor = 'success' | 'error' | 'warning' | 'neutral'

function isOkErpStatusText(statusText: string | null | undefined): boolean {
  if (!statusText) return true
  return statusText.trim().toUpperCase().startsWith('OK')
}

function formatMaybeIso(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return dtf.format(d)
}

function isoDateToLocalMidnight(value: string): Date | null {
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

function formatRunBookingDateWithTime(value: string | null | undefined): string {
  if (!value) return '—'
  const midnight = isoDateToLocalMidnight(value)
  if (!midnight) return formatMaybeIso(value)
  return dtf.format(midnight)
}

function jobStatusLabel(status: string): string {
  if (status === 'pending') return 'Afventer'
  if (status === 'in_progress') return 'Kører'
  if (status === 'succeeded') return 'OK'
  if (status === 'failed') return 'Fejl'
  return status || '—'
}

function deliveryStatusLabel(status: string): string {
  if (status === 'pending') return 'Afventer'
  if (status === 'processing') return 'Sender'
  if (status === 'sent') return 'Afsendt'
  if (status === 'failed') return 'Fejlet'
  return status || '—'
}

function statusColorFromJobStatus(status: string): StatusColor {
  if (status === 'failed') return 'error'
  if (status === 'in_progress' || status === 'pending') return 'warning'
  if (status === 'succeeded') return 'success'
  return 'neutral'
}

function statusLabelFromColor(color: StatusColor): string {
  if (color === 'success') return 'OK'
  if (color === 'warning') return 'Afventer'
  if (color === 'error') return 'Fejl'
  return '—'
}

const bankingJob = computed(() => (data.value?.jobs ?? []).find((j) => j.type === 'banking.ingest'))

const bankingJobState = computed(() => {
  const j = bankingJob.value
  if (!j) {
    return { color: 'neutral' as StatusColor, label: '—', description: 'Ikke registreret' }
  }

  const color = statusColorFromJobStatus(j.status)
  const meta = `${jobStatusLabel(j.status)}${j.attempts ? ` (forsøg ${j.attempts})` : ''}`
  const description = j.lastError ? `${meta}: ${j.lastError}` : meta
  return { color, label: statusLabelFromColor(color), description }
})

const matchingState = computed(() => {
  const m = data.value?.matching
  if (!m) return { color: 'neutral' as StatusColor, label: '—', description: 'Ingen matching-data' }

  if (m.totalTransactions === 0) {
    return { color: 'neutral' as StatusColor, label: '—', description: 'Ingen transaktioner' }
  }

  if (m.processedTransactions === 0) {
    return { color: 'warning' as StatusColor, label: 'Afventer', description: 'Matching er ikke kørt endnu' }
  }

  if (m.processedTransactions < m.totalTransactions) {
    return {
      color: 'warning' as StatusColor,
      label: 'Kører',
      description: `Behandlet ${m.processedTransactions}/${m.totalTransactions}`,
    }
  }

  if (m.open > 0) {
    return {
      color: 'warning' as StatusColor,
      label: 'Åbne poster',
      description: `${m.matched} match, ${m.exception} undtaget, ${m.open} åben`,
    }
  }

  return {
    color: 'success' as StatusColor,
    label: 'OK',
    description: `${m.matched} match, ${m.exception} undtaget, ${m.open} åben`,
  }
})

const erpDeliveryRows = computed(() => (data.value?.outbox ?? []).filter((o) => String(o.topic ?? '').startsWith('erp.')))

type ErpDelivery = {
  requestId: string | null
  firstCreatedAt: string | null
  rows: RunTimelineResponse['outbox']
  responseId: string | null
  responseStatusText: string | null
}

const erpDeliveries = computed<ErpDelivery[]>(() => {
  const byRequest = new Map<string, ErpDelivery>()
  const noRequest: ErpDelivery = { requestId: null, firstCreatedAt: null, rows: [], responseId: null, responseStatusText: null }

  for (const row of erpDeliveryRows.value) {
    const requestId = row.requestId
    const target = requestId
      ? (byRequest.get(requestId) ?? {
          requestId,
          firstCreatedAt: null,
          rows: [],
          responseId: null,
          responseStatusText: null,
        })
      : noRequest

    target.rows.push(row)

    if (row.createdAt && (!target.firstCreatedAt || new Date(row.createdAt) < new Date(target.firstCreatedAt))) {
      target.firstCreatedAt = row.createdAt
    }

    if (row.responseId) {
      target.responseId = row.responseId
      target.responseStatusText = row.responseStatusText
    }

    if (requestId) {
      byRequest.set(requestId, target)
    }
  }

  const list = Array.from(byRequest.values())
  if (noRequest.rows.length) list.push(noRequest)

  return list.sort((a, b) => {
    if (!a.firstCreatedAt && !b.firstCreatedAt) return 0
    if (!a.firstCreatedAt) return 1
    if (!b.firstCreatedAt) return -1
    return new Date(a.firstCreatedAt).getTime() - new Date(b.firstCreatedAt).getTime()
  })
})

function erpDeliveryState(delivery: ErpDelivery): { color: StatusColor; label: string; description: string } {
  const rows = delivery.rows
  if (!rows.length) return { color: 'neutral', label: '—', description: 'Ingen afleveringer' }

  const hasFailed = rows.some((r) => r.status === 'failed')
  const hasInFlight = rows.some((r) => r.status === 'pending' || r.status === 'processing')
  const rejectedByErp = Boolean(delivery.responseStatusText && !isOkErpStatusText(delivery.responseStatusText))

  const lastOutboxError =
    rows
      .filter((r) => r.status === 'failed' && r.lastError)
      .map((r) => String(r.lastError))
      .find(Boolean) ?? null

  const color: StatusColor = hasFailed || rejectedByErp ? 'error' : hasInFlight ? 'warning' : 'success'

  const statusCounts = rows.reduce(
    (acc, r) => {
      const key = String(r.status ?? '')
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const parts = Object.entries(statusCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${deliveryStatusLabel(k)}: ${v}`)

  const responsePart = rejectedByErp
    ? `Afvist af ERP: ${delivery.responseStatusText ?? ''}`
    : hasInFlight
      ? 'Afventer ERP-svar'
      : undefined
  const errorPart = lastOutboxError ? `Sidste fejl: ${lastOutboxError}` : undefined

  return {
    color,
    label: statusLabelFromColor(color),
    description: [parts.join(', '), responsePart, errorPart].filter(Boolean).join(' • '),
  }
}

const errorsState = computed(() => {
  const errs = data.value?.errors ?? []
  if (!errs.length) return { color: 'success' as StatusColor, label: 'OK', description: 'Ingen registrerede fejl' }
  return { color: 'error' as StatusColor, label: 'Fejl', description: `${errs.length} fejl` }
})

const bankingEvents = computed(() => {
  const rows = (data.value?.errors ?? []).filter((e) => e.source === 'banking')
  return [...rows].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
})

const applicationEvents = computed(() => {
  const rows = (data.value?.errors ?? []).filter((e) => !e.source || e.source === 'application')
  return [...rows].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
})

const erpEvents = computed(() => {
  const rows = (data.value?.errors ?? []).filter((e) => e.source === 'erp')
  return [...rows].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
})

const overallState = computed(() => {
  const anyError =
    (data.value?.errors?.length ?? 0) > 0 ||
    erpDeliveries.value.some((d) => Boolean(d.responseStatusText && !isOkErpStatusText(d.responseStatusText))) ||
    erpDeliveries.value.some((d) => d.rows.some((r) => r.status === 'failed')) ||
    (data.value?.jobs ?? []).some((j) => j.status === 'failed')

  if (anyError) return { color: 'error' as StatusColor, label: 'Fejl' }

  const anyInFlight =
    (data.value?.jobs ?? []).some((j) => j.status === 'pending' || j.status === 'in_progress') ||
    erpDeliveries.value.some((d) => d.rows.some((r) => r.status === 'pending' || r.status === 'processing'))

  if (anyInFlight) return { color: 'warning' as StatusColor, label: 'Afventer' }

  if (!data.value) return { color: 'neutral' as StatusColor, label: '—' }
  return { color: 'success' as StatusColor, label: 'OK' }
})

type RunTimelineItem = TimelineItem & { slot: string }

const timelineItems = computed<RunTimelineItem[]>(() => {
  const bookingDate = props.run?.bookingDate ? formatRunBookingDateWithTime(props.run.bookingDate) : undefined

  const base: RunTimelineItem[] = [
    {
      slot: 'banking',
      value: 'banking',
      title: 'Hentning af bankdata',
      date: bankingJob.value?.runAt ? formatMaybeIso(bankingJob.value.runAt) : bookingDate,
      description: bankingJobState.value.description,
      icon: 'solar:download-bold-duotone',
    },
    {
      slot: 'matching',
      value: 'matching',
      title: 'Matching',
      date: bankingJob.value?.updatedAt
        ? formatMaybeIso(bankingJob.value.updatedAt)
        : bankingJob.value?.runAt
          ? formatMaybeIso(bankingJob.value.runAt)
          : bookingDate,
      description: matchingState.value.description,
      icon: 'solar:magic-stick-3-bold-duotone',
    },
  ]

  const deliveries: RunTimelineItem[] = erpDeliveries.value.map((d) => {
    const state = erpDeliveryState(d)
    return {
      slot: 'erpDelivery',
      value: d.requestId ? `erp-${d.requestId}` : `erp-unknown-${d.firstCreatedAt ?? ''}`,
      title: 'Aflevering til ERP',
      date: d.firstCreatedAt ? formatMaybeIso(d.firstCreatedAt) : bookingDate,
      description: state.description,
      icon: 'solar:upload-bold-duotone',
      _delivery: d,
      _state: state,
    } as any
  })

  return [...base, ...deliveries]
})

</script>

<template>
  <UModal v-model:open="open" :ui="{ content: 'max-w-md' }">
    <template #header>
      <div class="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
        <div class="min-w-0">
          <div class="text-lg font-semibold">Kørsel</div>
          <div v-if="run" class="text-sm text-muted whitespace-nowrap">
            Bogføringsdato: {{ df.format(new Date(run.bookingDate)) }}
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 justify-self-end">
          <UBadge :color="overallState.color" variant="subtle">{{ overallState.label }}</UBadge>

          <template v-if="run && runId">
            <div class="flex items-center gap-2">
              <RunsDataPopover
                v-if="run.errors?.length"
                type="error"
                :run="run"
                :open="!!openPopovers[`${runId}-error`]"
                @update:open="(v: boolean) => (openPopovers[`${runId}-error`] = v)"
              />
              <RunsDataPopover
                v-if="run.erpResponses?.length"
                type="erpResponses"
                :run="run"
                :open="!!openPopovers[`${runId}-erpResponses`]"
                @update:open="(v: boolean) => (openPopovers[`${runId}-erpResponses`] = v)"
              />
            </div>
          </template>

          <UButton
            icon="solar:refresh-bold-duotone"
            variant="ghost"
            color="primary"
            :loading="loading"
            @click="load"
          />
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <div v-if="!run" class="text-sm text-muted">Ingen kørsel valgt.</div>

        <div v-else>
          <UTimeline :items="timelineItems" size="sm">
            <template #banking-title>
              <div class="flex items-center gap-2">
                <span>Hentning af bankdata</span>
                <UBadge :color="bankingJobState.color" variant="subtle">{{ bankingJobState.label }}</UBadge>
              </div>
            </template>

            <template #banking-description>
              <div class="space-y-2">
                <div class="text-sm text-muted">{{ bankingJobState.description }}</div>

                <ul v-if="bankingEvents.length" class="list-disc pl-5 space-y-1">
                  <li v-for="e in bankingEvents" :key="e.id" class="text-sm">
                    <span class="text-muted">{{ formatMaybeIso(e.createdAt) }}:</span>
                    <span class="ml-1">{{ e.errorString ?? 'Ukendt hændelse' }}</span>
                  </li>
                </ul>
              </div>
            </template>

            <template #matching-title>
              <div class="flex items-center gap-2">
                <span>Matching</span>
                <UBadge :color="matchingState.color" variant="subtle">{{ matchingState.label }}</UBadge>
              </div>
            </template>

            <template #matching-description>
              <div class="space-y-2">
                <div class="text-sm text-muted">{{ matchingState.description }}</div>
                <div v-if="data?.matching" class="text-xs text-muted">
                  Total transaktioner: {{ data.matching.totalTransactions }} • Behandlet: {{ data.matching.processedTransactions }}
                </div>

                <ul v-if="applicationEvents.length" class="list-disc pl-5 space-y-1">
                  <li v-for="e in applicationEvents" :key="e.id" class="text-sm">
                    <span class="text-muted">{{ formatMaybeIso(e.createdAt) }}:</span>
                    <span class="ml-1">{{ e.errorString ?? 'Ukendt hændelse' }}</span>
                  </li>
                </ul>

                <div v-if="data?.matching?.open" class="pt-1">
                  <UButton
                    icon="solar:pen-new-round-bold-duotone"
                    label="Behandl åbne poster"
                    color="primary"
                    variant="soft"
                    size="xs"
                    to="/aabne-poster"
                  />
                </div>
              </div>
            </template>

            <template #erpDelivery-title="{ item: slotItem }">
              <div class="flex items-center gap-2">
                <span>{{ slotItem.title }}</span>
                <UBadge :color="(slotItem as any)._state?.color ?? 'neutral'" variant="subtle">
                  {{ (slotItem as any)._state?.label ?? '—' }}
                </UBadge>
              </div>
            </template>

            <template #erpDelivery-description="{ item: slotItem }">
              <div class="space-y-2">
                <div class="text-sm text-muted">{{ (slotItem as any)._state?.description ?? slotItem.description }}</div>

                <ul v-if="erpEvents.length" class="list-disc pl-5 space-y-1">
                  <li v-for="e in erpEvents" :key="e.id" class="text-sm">
                    <span class="text-muted">{{ formatMaybeIso(e.createdAt) }}:</span>
                    <span class="ml-1">{{ e.errorString ?? 'Ukendt hændelse' }}</span>
                  </li>
                </ul>

                <div v-if="run" class="flex flex-wrap gap-2">
                  <UButton
                    v-if="(slotItem as any)._state?.label === 'Fejl'"
                    icon="solar:shield-warning-bold-duotone"
                    label="Behandl aflevering"
                    color="warning"
                    variant="soft"
                    size="xs"
                    :to="{ path: '/fejlhaandtering/koe', query: { runId: run.id } }"
                  />
                  <UButton
                    v-if="(slotItem as any)._delivery?.requestId"
                    icon="solar:document-text-bold-duotone"
                    label="Åbn ERP-aflevering"
                    color="neutral"
                    variant="soft"
                    size="xs"
                    :to="{ path: '/fejlhaandtering/erp', query: { requestId: (slotItem as any)._delivery.requestId } }"
                  />
                </div>
              </div>
            </template>
          </UTimeline>
        </div>

        <div class="flex justify-end gap-2 pt-4 mt-4 border-t border-default">
          <UButton label="Luk" color="neutral" variant="soft" @click="open = false" />
        </div>
      </div>
    </template>
  </UModal>
</template>
