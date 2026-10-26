<script setup lang="ts">
import { DateFormatter } from '@internationalized/date'
import type { TimelineItem } from '@nuxt/ui'
import type { RunListItem } from '~/types/runs'
import type { RunTimelineResponse } from '~/types/runTimeline'
import { canAccessPath } from '~/lib/authz/policy'
import { resolveRunContinuation } from '~/lib/presenters/runContinuation'
import { getRunStatusPresentation } from '~/lib/presenters/runStatus'
import {
  compareTimelineEvents,
  getErpDocumentIdsByOrigin,
  getErpTimelineDeliveryState,
  getErpTimelineStageState,
  groupErpTimelineDeliveries,
  latestTimelineStageEvent,
  RUN_TIMELINE_STAGE_ORDER,
  type ErpTimelineDelivery,
  type RunTimelineStageKey,
} from '~/lib/presenters/runTimeline'

const appConfig = useAppConfig()

const props = defineProps<{
  open: boolean
  run: RunListItem | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'refresh-runs'): void
}>()

const open = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const df = new DateFormatter('da-DK', { dateStyle: 'medium' })
const dtf = new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium', timeStyle: 'short' })

const toast = useToast()
const { roles } = useAuthz()

const loading = ref(false)
const continuing = ref(false)
const data = ref<RunTimelineResponse | null>(null)
const continuation = computed(() => data.value ? resolveRunContinuation(data.value) : null)
const canContinueRun = computed(() => canAccessPath('/fejlhaandtering', roles.value))

const openPopovers = ref<Record<string, boolean>>({})
const openEventLogs = ref({ banking: false, matching: false, manual: false })
const showManualBilagsnumre = ref(false)
const showErpDeliveries = ref(false)

function resetEventLogs() {
  openEventLogs.value = { banking: false, matching: false, manual: false }
  showManualBilagsnumre.value = false
  showErpDeliveries.value = false
}

type EventLogKey = keyof typeof openEventLogs.value

function toggleEventLog(stage: EventLogKey) {
  openEventLogs.value[stage] = !openEventLogs.value[stage]
}

function toggleManualBilagsnumre() {
  showManualBilagsnumre.value = !showManualBilagsnumre.value
}

function toggleErpDeliveries() {
  showErpDeliveries.value = !showErpDeliveries.value
}

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

async function continueRun() {
  if (!runId.value || !continuation.value || !canContinueRun.value || continuing.value) return

  continuing.value = true
  try {
    await $fetch(`/api/runs/${encodeURIComponent(runId.value)}/continue`, { method: 'POST' })
    toast.add({ title: continuation.value.label === 'Fortsæt kørsel' ? 'Kørslen sat til fortsættelse' : 'ERP-aflevering sat til genforsøg' })
    emit('refresh-runs')
    await load()
  } catch (error) {
    console.error('Kunne ikke fortsætte kørsel', error)
    const message = (error as { data?: { statusMessage?: unknown } }).data?.statusMessage
    toast.add({
      title: typeof message === 'string' ? message : 'Kunne ikke fortsætte kørslen',
      color: 'error',
    })
    await load()
  } finally {
    continuing.value = false
  }
}

watch(
  () => [open.value, props.run?.id] as const,
  async ([isOpen]) => {
    if (!isOpen) {
      data.value = null
      resetEventLogs()
      return
    }
    resetEventLogs()
    await load()
  },
)

type StatusColor = 'success' | 'error' | 'warning' | 'neutral'

function formatMaybeIso(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return dtf.format(d)
}

function compareEventRows(
  left: { createdAt: string; sequence?: number },
  right: { createdAt: string; sequence?: number },
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt)
    || (left.sequence ?? 0) - (right.sequence ?? 0)
}

type RunEventLogEntry = {
  id: string
  createdAt: string
  sequence?: number
  outboxId?: string | null
  detail?: string | null
  errorString?: string | null
  eventType?: string
}

function jobStatusLabel(status: string): string {
  if (status === 'pending') return 'Afventer'
  if (status === 'in_progress') return 'Kører'
  if (status === 'succeeded') return 'OK'
  if (status === 'failed') return 'Fejl'
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

function statusFromStageEvent(event: RunTimelineResponse['events'][number] | undefined) {
  if (!event?.status) return null
  const color: StatusColor = event.status === 'failed' || event.status === 'rejected'
    ? 'error'
    : event.status === 'succeeded' || event.status === 'accepted'
      ? 'success'
      : event.status === 'skipped' || event.status === 'unknown'
        ? 'neutral'
        : 'warning'
  const label = event.status === 'in_progress'
    ? 'Kører'
    : event.status === 'blocked'
      ? 'Afventer'
      : event.status === 'unknown'
        ? 'Ukendt'
        : event.status === 'needs_attention'
          ? 'Åbne poster'
      : statusLabelFromColor(color)
  return { color, label, description: event.detail ?? label }
}

function latestStageEvent(stage: RunTimelineResponse['events'][number]['stage']) {
  return latestTimelineStageEvent(data.value?.events ?? [], stage)
}

const bankingJob = computed(() => (data.value?.jobs ?? []).find((j) => j.type === 'banking.ingest'))

const bankingJobState = computed(() => {
  const eventState = statusFromStageEvent(latestStageEvent('banking'))
  if (eventState) return eventState
  const j = bankingJob.value
  if (!j) {
    return { color: 'neutral' as StatusColor, label: 'Afventer', description: 'Bankhentning er ikke startet' }
  }

  const color = statusColorFromJobStatus(j.status)
  const meta = `${jobStatusLabel(j.status)}${j.attempts ? ` (forsøg ${j.attempts})` : ''}`
  const description = j.lastError ? `${meta}: ${j.lastError}` : meta
  return { color, label: statusLabelFromColor(color), description }
})

const matchingState = computed(() => {
  const eventState = statusFromStageEvent(latestStageEvent('matching'))
  if (eventState) return eventState
  const m = data.value?.matching
  if (!m) return { color: 'neutral' as StatusColor, label: 'Afventer', description: 'Matching er ikke startet' }

  if (m.totalSamleposter === 0) {
    return { color: 'neutral' as StatusColor, label: 'Ikke relevant', description: 'Ingen samleposter at matche' }
  }

  if (m.processedSamleposter === 0) {
    return { color: 'warning' as StatusColor, label: 'Afventer', description: 'Matching er ikke kørt endnu' }
  }

  if (m.processedSamleposter < m.totalSamleposter) {
    return {
      color: 'warning' as StatusColor,
      label: 'Kører',
      description: `Behandlet ${m.processedSamleposter}/${m.totalSamleposter} samleposter`,
    }
  }

  if (m.openSamleposter > 0 || m.mixedSamleposter > 0) {
    return {
      color: 'warning' as StatusColor,
      label: m.openSamleposter > 0 ? 'Åbne poster' : 'Blandede statusser',
      description: `${m.bookedSamleposter} bogførte, ${m.exceptedSamleposter} undtagne, ${m.openSamleposter} åbne, ${m.mixedSamleposter} blandede samleposter`,
    }
  }

  return {
    color: 'success' as StatusColor,
    label: 'OK',
    description: `${m.bookedSamleposter} bogførte, ${m.exceptedSamleposter} undtagne samleposter`,
  }
})

const manualEvents = computed(() => (data.value?.events ?? []).filter(event => event.stage === 'manual'))
const manualBilagsnumre = computed(() => getErpDocumentIdsByOrigin(data.value?.erpRequests ?? [], 'manual'))
const manualState = computed(() => {
  const eventState = statusFromStageEvent(latestStageEvent('manual'))
  if (eventState) return eventState
  const historicalCount = data.value?.matching.manualBookedSamleposter ?? 0
  return historicalCount
    ? {
        color: 'neutral' as StatusColor,
        label: 'Historik',
        description: 'Der findes historiske manuelle bogføringer fra før hændelsesloggen blev indført.',
      }
    : {
        color: 'neutral' as StatusColor,
        label: 'Ingen aktivitet',
        description: 'Ingen manuelle bogføringer på dette run',
      }
})

const erpDeliveryRows = computed(() => (data.value?.outbox ?? []).filter((o) => String(o.topic ?? '').startsWith('erp.')))
const erpDeliveries = computed<ErpTimelineDelivery[]>(() => groupErpTimelineDeliveries(
  data.value?.erpRequests ?? [],
  erpDeliveryRows.value,
  data.value?.events ?? [],
))
const erpDeliveryState = getErpTimelineDeliveryState

const bankingEvents = computed<RunEventLogEntry[]>(() => {
  const timelineEvents = (data.value?.events ?? []).filter(e => e.stage === 'banking')
  const errorEvents = (data.value?.errors ?? []).filter(e => e.source === 'banking')
  return [...timelineEvents, ...errorEvents].sort(compareEventRows)
})

const applicationEvents = computed<RunEventLogEntry[]>(() => {
  const timelineEvents = (data.value?.events ?? []).filter(e => e.stage === 'matching')
  const errorEvents = (data.value?.errors ?? []).filter(e => !e.source || e.source === 'application')
  return [...timelineEvents, ...errorEvents].sort(compareEventRows)
})

const erpStageEvents = computed<RunEventLogEntry[]>(() => {
  const outboxById = new Map(erpDeliveryRows.value.map(row => [row.id, row]))
  const events = erpDeliveries.value
    .flatMap(delivery => delivery.events)
    .map((event) => {
      const failedOutbox = event.outboxId ? outboxById.get(event.outboxId) : undefined
      return failedOutbox?.status === 'failed' && failedOutbox.lastError
        ? { ...event, detail: failedOutbox.lastError }
        : event
    })
  const correlatedOutboxIds = new Set(events.map(event => event.outboxId).filter((id): id is string => Boolean(id)))
  const missingFailureEvents = erpDeliveryRows.value
    .filter(row => row.status === 'failed' && !correlatedOutboxIds.has(row.id))
    .map(row => ({
      id: `outbox-error:${row.id}`,
      outboxId: row.id,
      eventType: 'upload_failed',
      detail: row.lastError ?? 'Afsendelse til ERP fejlede.',
      createdAt: row.createdAt,
      sequence: 0,
    }))
  const errorEvents = (data.value?.errors ?? []).filter(e => e.source === 'erp')
  return [...events, ...errorEvents, ...missingFailureEvents].sort(compareEventRows)
})

const erpStageState = computed(() => {
  return getErpTimelineStageState(erpDeliveries.value)
})

const overallState = computed(() => getRunStatusPresentation(props.run?.status))

type RunTimelineItem = TimelineItem & { slot: string }

const timelineItems = computed<RunTimelineItem[]>(() => {
  const bankingDate = latestStageEvent('banking')?.createdAt ?? bankingJob.value?.runAt
  const matchingDate = latestStageEvent('matching')?.createdAt ?? bankingJob.value?.updatedAt ?? bankingJob.value?.runAt
  const manualDate = latestStageEvent('manual')?.createdAt
  const stageItems: Record<Exclude<RunTimelineStageKey, 'erp'>, RunTimelineItem> = {
    banking: {
      slot: 'banking',
      value: 'banking',
      title: 'Hentning af bankdata',
      date: bankingDate ? formatMaybeIso(bankingDate) : undefined,
      description: bankingJobState.value.description,
      icon: appConfig.ui.icons.download,
    },
    matching: {
      slot: 'matching',
      value: 'matching',
      title: 'Matching',
      date: matchingDate ? formatMaybeIso(matchingDate) : undefined,
      description: matchingState.value.description,
      icon: appConfig.ui.icons.wand,
    },
    manual: {
      slot: 'manualBooking',
      value: 'manualBooking',
      title: 'Manuel bogføring',
      date: manualDate ? formatMaybeIso(manualDate) : undefined,
      description: manualState.value.description,
      icon: appConfig.ui.icons.edit,
    },
  }

  const latestErpEvent = erpStageEvents.value.at(-1)
  const latestErpDate = [...erpDeliveries.value]
    .map(delivery => delivery.latestCreatedAt)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]

  const erpItem: RunTimelineItem = {
      slot: 'erpDelivery',
      value: 'erp',
      title: 'ERP-fremsendelse',
      date: latestErpEvent?.createdAt || latestErpDate ? formatMaybeIso(latestErpEvent?.createdAt ?? latestErpDate) : undefined,
      description: erpStageState.value.description,
      icon: appConfig.ui.icons.upload,
      _deliveries: erpDeliveries.value,
      _state: erpStageState.value,
  } as any

  return RUN_TIMELINE_STAGE_ORDER.map(stage => stage === 'erp' ? erpItem : stageItems[stage])
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
            <RunsDataPopover
              v-if="run.erpDocuments?.length"
              type="erpDocuments"
              :run="run"
              :open="!!openPopovers[`${runId}-erpDocuments`]"
              @update:open="(value: boolean) => (openPopovers[`${runId}-erpDocuments`] = value)"
            />
          </template>

          <UButton
            v-if="continuation && canContinueRun"
            :icon="appConfig.ui.icons.reload"
            :label="continuation.label"
            variant="soft"
            color="primary"
            :loading="continuing"
            :disabled="loading || continuing"
            @click="continueRun"
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

                <UButton
                  v-if="bankingEvents.length"
                  size="xs"
                  color="neutral"
                  variant="subtle"
                  :label="openEventLogs.banking ? 'Skjul hændelseslog' : 'Vis hændelseslog'"
                  :aria-expanded="openEventLogs.banking"
                  aria-controls="run-event-log-banking"
                  @click="toggleEventLog('banking')"
                />
                <ul v-if="openEventLogs.banking && bankingEvents.length" id="run-event-log-banking" class="list-disc pl-5 space-y-1">
                  <li v-for="e in bankingEvents" :key="e.id" class="text-sm">
                    <span class="text-muted">{{ formatMaybeIso(e.createdAt) }}:</span>
                    <span class="ml-1">{{ e.detail ?? e.errorString ?? e.eventType ?? 'Ukendt hændelse' }}</span>
                  </li>
                </ul>
              </div>
            </template>

            <template #matching-title>
              <div class="flex flex-wrap items-center gap-2">
                <span>Matching</span>
                <UBadge :color="matchingState.color" variant="subtle">{{ matchingState.label }}</UBadge>
                <UButton
                  v-if="data?.matching?.openSamleposter"
                  :icon="appConfig.ui.icons.edit"
                  label="Behandl"
                  color="primary"
                  variant="soft"
                  size="xs"
                  to="/aabne-poster"
                />
              </div>
            </template>

            <template #matching-description>
              <div class="space-y-2">
                <div class="text-sm text-muted">{{ matchingState.description }}</div>
                <div v-if="data?.matching" class="text-xs text-muted">
                  Samleposter i alt: {{ data.matching.totalSamleposter }} • Behandlet: {{ data.matching.processedSamleposter }}
                </div>

                <UButton
                  v-if="applicationEvents.length"
                  size="xs"
                  color="neutral"
                  variant="subtle"
                  :label="openEventLogs.matching ? 'Skjul hændelseslog' : 'Vis hændelseslog'"
                  :aria-expanded="openEventLogs.matching"
                  aria-controls="run-event-log-matching"
                  @click="toggleEventLog('matching')"
                />
                <ul v-if="openEventLogs.matching && applicationEvents.length" id="run-event-log-matching" class="list-disc pl-5 space-y-1">
                  <li v-for="e in applicationEvents" :key="e.id" class="text-sm">
                    <span class="text-muted">{{ formatMaybeIso(e.createdAt) }}:</span>
                    <span class="ml-1">{{ e.detail ?? e.errorString ?? e.eventType ?? 'Ukendt hændelse' }}</span>
                  </li>
                </ul>

              </div>
            </template>

            <template #manualBooking-title>
              <div class="flex items-center gap-2">
                <span>Manuel bogføring</span>
                <UBadge :color="manualState.color" variant="subtle">{{ manualState.label }}</UBadge>
              </div>
            </template>

            <template #manualBooking-description>
              <div class="space-y-2">
                <div class="text-sm text-muted">{{ manualState.description }}</div>
                <div class="flex flex-wrap items-center gap-2">
                  <UButton
                    v-if="manualBilagsnumre.length"
                    class="justify-center"
                    size="xs"
                    color="neutral"
                    variant="subtle"
                    :label="showManualBilagsnumre ? 'Skjul bilagsnumre' : 'Vis bilagsnumre'"
                    :aria-expanded="showManualBilagsnumre"
                    aria-controls="run-manual-bilagsnumre"
                    @click="toggleManualBilagsnumre"
                  />
                  <UButton
                    v-if="manualEvents.length"
                    size="xs"
                    color="neutral"
                    variant="subtle"
                    :label="openEventLogs.manual ? 'Skjul hændelseslog' : 'Vis hændelseslog'"
                    :aria-expanded="openEventLogs.manual"
                    aria-controls="run-event-log-manual"
                    @click="toggleEventLog('manual')"
                  />
                </div>
                <ul v-if="showManualBilagsnumre && manualBilagsnumre.length" id="run-manual-bilagsnumre" class="list-disc pl-5 space-y-1">
                  <li v-for="documentId in manualBilagsnumre" :key="documentId" class="text-sm font-mono">
                    {{ documentId }}
                  </li>
                </ul>
                <ul v-if="openEventLogs.manual && manualEvents.length" id="run-event-log-manual" class="list-disc pl-5 space-y-1">
                  <li v-for="event in manualEvents" :key="event.id" class="text-sm">
                    <span class="text-muted">{{ formatMaybeIso(event.createdAt) }}:</span>
                    <span class="ml-1">{{ event.detail ?? event.eventType }}</span>
                  </li>
                </ul>
              </div>
            </template>

            <template #erpDelivery-title="{ item: slotItem }">
              <div class="flex items-center gap-2">
                <span>{{ slotItem.title }}</span>
                <UBadge :color="(slotItem as any)._state?.color ?? 'neutral'" variant="subtle">
                  {{ (slotItem as any)._state?.label ?? '—' }}
                </UBadge>
                <UBadge v-if="(slotItem as any)._deliveries?.length > 1" color="neutral" variant="outline">
                  {{ (slotItem as any)._deliveries.length }} bilag
                </UBadge>
              </div>
            </template>

            <template #erpDelivery-description="{ item: slotItem }">
              <div class="space-y-2">
                <div class="text-sm text-muted">{{ (slotItem as any)._state?.description ?? slotItem.description }}</div>

                <UButton
                  v-if="erpDeliveries.length"
                  size="xs"
                  color="neutral"
                  variant="subtle"
                  :label="showErpDeliveries ? 'Skjul fremsendelser' : 'Vis fremsendelser'"
                  :aria-expanded="showErpDeliveries"
                  aria-controls="run-erp-deliveries"
                  @click="toggleErpDeliveries"
                />
                <div v-if="showErpDeliveries" id="run-erp-deliveries" class="space-y-2">
                  <div v-for="delivery in erpDeliveries" :key="delivery.key" class="flex flex-wrap items-center gap-2">
                    <UBadge :color="erpDeliveryState(delivery).color" variant="subtle">
                      {{ erpDeliveryState(delivery).label }}
                    </UBadge>
                    <UBadge v-if="delivery.documentId" color="neutral" variant="outline" class="font-mono">
                      {{ delivery.documentId }}
                    </UBadge>
                    <span v-if="delivery.rows.find(row => row.status === 'failed')?.lastError" class="text-sm text-error">
                      {{ delivery.rows.find(row => row.status === 'failed')?.lastError }}
                    </span>
                    <UButton
                      v-if="delivery.requestId"
                      :icon="appConfig.ui.icons.send"
                      label="Åbn ERP-request"
                      color="neutral"
                      variant="soft"
                      size="xs"
                      :to="{ path: '/fejlhaandtering/erp', query: { requestId: delivery.requestId } }"
                    />
                  </div>
                </div>
              </div>
            </template>
          </UTimeline>
        </div>

        <div class="flex justify-end gap-2 pt-4 mt-4 border-t border-default">
          <UButton label="Luk" color="neutral" variant="soft" @click="() => { open = false }" />
        </div>
      </div>
    </template>
  </UModal>
</template>
