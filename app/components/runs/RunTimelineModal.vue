<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
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

  const responsePart = delivery.responseId
    ? rejectedByErp
      ? `Afvist af ERP: ${delivery.responseStatusText ?? ''}`
      : `Bilag: ${delivery.responseId}`
    : 'Afventer ERP-svar'

  const requestPart = delivery.requestId ? `Leverance: ${delivery.requestId}` : undefined

  return {
    color,
    label: statusLabelFromColor(color),
    description: [requestPart, parts.join(', '), responsePart].filter(Boolean).join(' • '),
  }
}

const errorsState = computed(() => {
  const errs = data.value?.errors ?? []
  if (!errs.length) return { color: 'success' as StatusColor, label: 'OK', description: 'Ingen registrerede fejl' }
  return { color: 'error' as StatusColor, label: 'Fejl', description: `${errs.length} fejl` }
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

const canTreatIssues = computed(() => {
  if (!props.run?.id) return false
  if (!data.value) return false
  return overallState.value.color !== 'success'
})

const treatLink = computed(() => {
  const id = props.run?.id
  if (!id || !data.value) return { path: '/fejlhaandtering/koe', query: {} as Record<string, any> }

  const rejected = erpDeliveries.value
    .filter((d) => Boolean(d.responseId && d.responseStatusText && !isOkErpStatusText(d.responseStatusText)))
    .filter((d) => Boolean(d.requestId))

  if (rejected.length === 1) {
    const requestId = rejected[0]?.requestId
    if (requestId) {
      return { path: '/fejlhaandtering/erp', query: { requestId } }
    }
  }

  return { path: '/fejlhaandtering/koe', query: { runId: id } }
})

type RunTimelineItem = TimelineItem & { slot: string }

const timelineItems = computed<RunTimelineItem[]>(() => {
  const base: RunTimelineItem[] = [
    {
      slot: 'banking',
      value: 'banking',
      title: 'Hentning af bankdata',
      date: bankingJob.value?.runAt ? formatMaybeIso(bankingJob.value.runAt) : undefined,
      description: bankingJobState.value.description,
      icon: 'solar:download-bold-duotone',
    },
    {
      slot: 'matching',
      value: 'matching',
      title: 'Matching',
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
      date: d.firstCreatedAt ? formatMaybeIso(d.firstCreatedAt) : undefined,
      description: state.description,
      icon: 'solar:upload-bold-duotone',
      _delivery: d,
      _state: state,
    } as any
  })

  const tail: RunTimelineItem[] = [
    {
      slot: 'events',
      value: 'events',
      title: 'Hændelser',
      description: errorsState.value.description,
      icon: 'solar:shield-warning-bold-duotone',
    },
  ]

  return [...base, ...deliveries, ...tail]
})

const docUrlMap = new Map<string, string>()
const isClient = import.meta.client

function attemptCreateBlobFromContent(doc: RunListItem['documents'][number]): Blob | null {
  const content: any = doc.content
  if (content instanceof Blob) return content as Blob

  if (typeof doc.content === 'string') {
    const fallbackMime = doc.mimeType ?? 'application/octet-stream'
    try {
      const normalizedContent = doc.content.includes(',') ? doc.content.split(',').at(-1) ?? '' : doc.content
      const binary = atob(normalizedContent)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      return new Blob([bytes], { type: fallbackMime })
    } catch {
      const likelyText = fallbackMime.startsWith('text/') || fallbackMime.includes('xml')
      return new Blob([doc.content], { type: likelyText ? fallbackMime : 'text/plain' })
    }
  }

  return null
}

function getDocUrl(doc: RunListItem['documents'][number]): string | null {
  if (!isClient || !doc.content) return null

  const existing = docUrlMap.get(doc.id)
  if (existing) return existing

  const blob = attemptCreateBlobFromContent(doc)
  if (!blob) return null

  const url = URL.createObjectURL(blob)
  docUrlMap.set(doc.id, url)
  return url
}

onBeforeUnmount(() => {
  if (!isClient) return
  for (const url of docUrlMap.values()) URL.revokeObjectURL(url)
  docUrlMap.clear()
})

const docsByType = computed(() => {
  const docs = props.run?.documents ?? []
  return docs.reduce((acc: Record<string, RunListItem['documents']>, d) => {
    const typeKey = d.type ?? 'ukendt'
    acc[typeKey] = acc[typeKey] ?? []
    acc[typeKey].push(d)
    return acc
  }, {})
})
</script>

<template>
  <UModal v-model:open="open">
    <template #header>
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="text-lg font-semibold">Kørsel</div>
          <div v-if="run" class="text-sm text-muted">
            <span class="font-mono">{{ run.id }}</span>
            <span class="mx-2">•</span>
            <span>{{ df.format(new Date(run.bookingDate)) }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UBadge :color="overallState.color" variant="subtle">{{ overallState.label }}</UBadge>

          <UButton
            v-if="canTreatIssues && run"
            icon="solar:shield-warning-bold-duotone"
            label="Behandl"
            color="warning"
            variant="soft"
            :to="treatLink"
          />

          <template v-if="run && runId">
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
            <RunsDataPopover
              v-if="run.documents?.length"
              type="docs"
              :run="run"
              :open="!!openPopovers[`${runId}-docs`]"
              @update:open="(v: boolean) => (openPopovers[`${runId}-docs`] = v)"
            />
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
        <UAlert color="neutral" variant="soft" icon="solar:info-circle-bold-duotone" class="text-sm">
          Timeline viser kørslens forløb ud fra persisted DB-state.
        </UAlert>

        <div v-if="!run" class="text-sm text-muted">Ingen kørsel valgt.</div>

        <div v-else>
          <UTimeline :items="timelineItems" size="sm">
            <template #banking-title>
              <div class="flex items-center gap-2">
                <span>Hentning af bankdata</span>
                <UBadge :color="bankingJobState.color" variant="subtle">{{ bankingJobState.label }}</UBadge>
              </div>
            </template>

            <template #matching-title>
              <div class="flex items-center gap-2">
                <span>Matching</span>
                <UBadge :color="matchingState.color" variant="subtle">{{ matchingState.label }}</UBadge>
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
                <div v-if="run" class="flex flex-wrap gap-2">
                  <UButton
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

            <template #events-title>
              <div class="flex items-center gap-2">
                <span>Hændelser</span>
                <UBadge :color="errorsState.color" variant="subtle">{{ errorsState.label }}</UBadge>
              </div>
            </template>

            <template #events-description>
              <div v-if="loading" class="text-sm text-muted">Henter…</div>
              <div v-else class="space-y-2">
                <div class="text-sm text-muted">{{ errorsState.description }}</div>

                <ul v-if="(data?.errors?.length ?? 0)" class="list-disc pl-5 space-y-1">
                  <li v-for="e in data?.errors" :key="e.id" class="text-sm">
                    <span class="font-medium">{{ e.source ?? 'ukendt' }}:</span>
                    <span class="ml-1">{{ e.errorString ?? 'Ukendt fejl' }}</span>
                    <span class="text-muted"> • {{ formatMaybeIso(e.createdAt) }}</span>
                  </li>
                </ul>

                <div class="pt-2" v-if="Object.keys(docsByType).length">
                  <div class="text-sm font-medium">Dokumenter</div>
                  <div class="space-y-3 mt-2">
                    <div v-for="(docs, t) in docsByType" :key="t">
                      <div class="text-sm font-medium capitalize">{{ t }}</div>
                      <ul class="list-disc pl-5 space-y-1 mt-1">
                        <li v-for="doc in docs" :key="doc.id" class="text-sm">
                          <template v-if="doc.content && isClient">
                            <a :href="getDocUrl(doc) ?? undefined" :download="doc.filename" class="underline">
                              {{ doc.filename }}
                            </a>
                          </template>
                          <template v-else>
                            <span class="text-muted">{{ doc.filename }}</span>
                          </template>
                          <span class="text-muted text-xs ml-1">({{ doc.mimeType ?? doc.fileExtension }})</span>
                        </li>
                      </ul>
                    </div>
                  </div>
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
