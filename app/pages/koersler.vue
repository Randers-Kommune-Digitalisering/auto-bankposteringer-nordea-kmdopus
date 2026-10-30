<script setup lang="ts">
import { DateFormatter, today } from '@internationalized/date'
import type { TableColumn } from '@nuxt/ui'
import type { RunStatus } from '~/lib/db/schema/enums'
import type { RunListItem, RunListResponse } from '~/types/runs'
import useFlattenArray from '~/composables/useFlattenArray'
import { getRunStatusPresentation } from '~/lib/presenters/runStatus'
import { isWeekendBookingDate } from '~/lib/scheduler/scheduledBookingDate'
import { DEFAULT_TIME_ZONE } from '~/utils'

const appConfig = useAppConfig()
const toast = useToast()

const refreshNonce = ref(0)

const { data, status, refresh } = await useFetch<RunListResponse>('/api/runs', {
  key: computed(() => `runs:${refreshNonce.value}`),
  query: computed(() => ({ t: refreshNonce.value })),
  dedupe: 'cancel',
  deep: true,
})

const allRows = computed<RunListItem[]>(() => useFlattenArray<RunListItem>(data))

const timeZone = DEFAULT_TIME_ZONE
const startRunDate = ref<any>(today(timeZone))
const startRunDateIso = computed(() => String(startRunDate.value))
const runExistsForStartDate = computed(() => {
  const iso = startRunDateIso.value
  return allRows.value.some((r) => String(r.bookingDate).slice(0, 10) === iso)
})
const isWeekendStartRunDate = computed(() => isWeekendBookingDate(startRunDateIso.value))

const startingRun = ref(false)

async function handleRefresh() {
  refreshNonce.value += 1
  await refresh()
  if (selectedRun.value) {
    selectedRun.value = allRows.value.find(run => run.id === selectedRun.value?.id) ?? selectedRun.value
  }
}

async function startRunForDate() {
  if (!startRunDate.value) return

  if (runExistsForStartDate.value) {
    toast.add({
      title: 'Kørsel findes allerede',
      description: `Der findes allerede en kørsel for ${startRunDateIso.value}`,
      color: 'warning',
    })
    return
  }

  startingRun.value = true

  try {
    const res = await $fetch<{ success: boolean; runId: string; jobId: string; status: 'pending' }>(
      '/api/runs/start',
      { method: 'POST', body: { bookingDate: String(startRunDate.value) } },
    )
    toast.add({
      title: 'Kørsel lagt i kø',
      description: `Run: ${res.runId}. Worker behandler jobbet, når den har hentet det fra køen.`,
    })
    await handleRefresh()
  } catch (error) {
    console.error('Start kørsel fejlede', error)
    const msg = String((error as any)?.data?.statusMessage ?? (error as any)?.statusMessage ?? (error as any)?.message ?? error)
    toast.add({
      title: 'Kunne ikke starte kørsel',
      description: msg,
      color: 'error'
    })
  } finally {
    startingRun.value = false
  }
}

// Date formatter
const df = new DateFormatter('da-DK', {
  dateStyle: 'medium'
})

// Date range picker state
const endDefault = today(timeZone)
const startDefault = endDefault.subtract({ days: 29 })
const defaultRange = {
  start: startDefault,
  end: endDefault
}

const dateRange = ref<any>(defaultRange)

// Popover state
const openPopovers = ref<Record<string, string | null>>({})

const runModalOpen = ref(false)
const selectedRun = ref<RunListItem | null>(null)

function openRun(run: RunListItem) {
  selectedRun.value = run
  runModalOpen.value = true
}

type StatusColor = 'success' | 'error' | 'warning' | 'neutral'

const getColorByStatus = (status: RunStatus): StatusColor => {
  return getRunStatusPresentation(status).color
}

const getChipColorByDate = (date: Date): StatusColor | undefined => {
  const dateKey = date.toISOString().slice(0, 10)
  const events = calendarEvents.value[dateKey] ?? []
  if (!events.length) return undefined

  const colors = new Set(events.map((e) => e.color))
  if (colors.has('error')) return 'error'
  if (colors.has('warning')) return 'warning'
  if (colors.has('success')) return 'success'
  return 'neutral'
}

// Get calendar events grouped by date with status colors
const calendarEvents = computed(() => {
  const events: Record<string, Array<{ color: StatusColor; label: RunStatus }>> = {}

  allRows.value.forEach(run => {
    const dateKey = new Date(run.bookingDate).toISOString().slice(0, 10)
    const status = (run.status ?? 'afventer') as RunStatus

    events[dateKey] = events[dateKey] ?? []
    events[dateKey].push({
      color: getColorByStatus(status),
      label: status
    })
  })

  return events
})

// Filter rows based on date range
const filteredRows = computed<RunListItem[]>(() => {
  if (!dateRange.value?.start || !dateRange.value?.end) {
    return allRows.value
  }

  const start = dateRange.value.start.toDate(timeZone)
  const end = dateRange.value.end.toDate(timeZone)
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  return allRows.value.filter(run => {
    const runDate = new Date(run.bookingDate)
    return runDate >= start && runDate <= end
  })
})

const rows = computed<RunListItem[]>(() => {
  return [...filteredRows.value].sort((a, b) => {
    return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
  })
})

const runsTableKey = computed(() => rows.value.map((r) => String((r as any).id ?? r.bookingDate ?? '')).join('|'))

const togglePopover = (runId: string, type: string) => {
  const key = `${runId}-${type}`
  openPopovers.value[key] = openPopovers.value[key] ? null : type
}

const columns: TableColumn<RunListItem>[] = [
  {
    id: 'openRun',
    header: '',
    size: 86,
    enableSorting: false,
    cell: ({ row }) => {
      return h(resolveComponent('UButton'), {
        size: 'xs',
        color: 'primary',
        variant: 'soft',
        onClick: () => openRun(row.original)
      }, () => 'Åbn')
    }
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
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    cell: ({ row }) => {
      const status = (row.getValue('status') ?? 'afventer') as RunStatus
      const presentation = getRunStatusPresentation(status)
      return h(resolveComponent('UBadge'), {
        color: getColorByStatus(status),
        class: 'w-fit',
        variant: 'subtle'
      }, () => presentation.label)
    }
  },
  {
    id: 'erpDocuments',
    header: 'Bilagsnumre',
    size: 120,
    enableSorting: false,
    cell: ({ row }) => {
      const erpDocuments = row.original.erpDocuments
      if (!erpDocuments?.length) return null

      const key = `${row.original.id}-erpDocuments`
      return h(resolveComponent('RunsDataPopover'), {
        type: 'erpDocuments',
        run: row.original,
        open: !!openPopovers.value[key],
        'onUpdate:open': (val: boolean) => {
          openPopovers.value[key] = val ? 'erpDocuments' : null
        }
      })
    }
  },
]
</script>

<template>
  <UDashboardPanel id="runs">
    <template #header>
      <UDashboardNavbar title="Kørsler">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton :icon="appConfig.ui.icons.reload" label="Opdater" variant="ghost" color="primary"
            :loading="status === 'pending'" @click="handleRefresh" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <FiltersRow :show-accounts="false">
          <template #filters>
            <UFormField label="Kørselsdato">
              <div class="flex items-center gap-2">
                <UPopover :popper="{ placement: 'bottom-start' }">
                  <UButton variant="outline" :icon="appConfig.ui.icons.calendar">
                    {{ df.format(startRunDate.toDate(timeZone)) }}
                  </UButton>

                  <template #content>
                    <div class="p-4">
                      <UCalendar v-model="startRunDate" variant="subtle" class="p-2" />
                    </div>
                  </template>
                </UPopover>

                <UButton label="Start kørsel" color="primary" variant="soft" size="sm"
                  :disabled="runExistsForStartDate || isWeekendStartRunDate" :loading="startingRun"
                  @click="startRunForDate" />
              </div>
              <p v-if="isWeekendStartRunDate" class="mt-1 text-sm text-muted">
                Kørsler kan kun startes for hverdage.
              </p>
            </UFormField>
          </template>
          <template #date>
            <div class="flex justify-end">
              <div class="w-full sm:w-[16rem]">
                <UFormField label="Periode">
                  <UPopover :popper="{ placement: 'bottom-start' }">
                    <UButton variant="outline" :icon="appConfig.ui.icons.calendar" class="w-full">
                      <template v-if="dateRange?.start">
                        <template v-if="dateRange?.end">
                          {{ df.format(dateRange.start.toDate(timeZone)) }} - {{
                            df.format(dateRange.end.toDate(timeZone)) }}
                        </template>
                        <template v-else>
                          {{ df.format(dateRange.start.toDate(timeZone)) }}
                        </template>
                      </template>
                      <template v-else>
                        Vælg periode
                      </template>
                    </UButton>

                    <template #content>
                      <div class="p-4">
                        <UCalendar v-model="dateRange" variant="subtle" class="p-2" :number-of-months="2" range>
                          <template #day="{ day }">
                            <UChip :show="!!getChipColorByDate(day.toDate('UTC'))"
                              :color="getChipColorByDate(day.toDate('UTC'))" size="lg">
                              {{ day.day }}
                            </UChip>
                          </template>
                        </UCalendar>
                        <div v-if="dateRange?.start && dateRange?.end" class="mt-4 flex gap-2">
                          <UButton variant="ghost" size="sm" label="Nulstil" @click="() => { dateRange = defaultRange }"
                            class="flex-1" />
                        </div>
                      </div>
                    </template>
                  </UPopover>
                </UFormField>
              </div>
            </div>
          </template>
        </FiltersRow>

        <!-- Table -->
        <div>
          <div v-if="dateRange?.start && dateRange?.end" class="text-sm text-muted mb-3">
            {{ rows.length }} kørsler i valgt periode
          </div>
          <UEmpty v-if="!rows.length && status !== 'pending'" :icon="appConfig.ui.icons.archive" title="Ingen kørsler"
            description="Der er ingen kørsler i den valgte periode endnu."
            class="border border-dashed border-default rounded-lg">
            <template #actions>
              <UButton size="sm" variant="solid" @click="refresh()">
                Opdater
              </UButton>
            </template>
          </UEmpty>
          <UTable v-else ref="table" :key="runsTableKey" :data="rows" :columns="columns" :loading="status === 'pending'"
            :ui="{
              base: 'border-separate border-spacing-0',
              thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
              tbody: '[&>tr]:last:[&>td]:border-b-0',
              tr: 'group',
              th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
              td: 'empty:p-0 group-has-[td:not(:empty)]:border-b border-default',
              separator: 'h-0'
            }" />
        </div>
      </div>

      <RunsRunTimelineModal v-model:open="runModalOpen" :run="selectedRun" @refresh-runs="handleRefresh" />
    </template>
  </UDashboardPanel>
</template>
