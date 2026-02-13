<script setup lang="ts">
    import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'
    import type { TableColumn } from '@nuxt/ui'
    import type { RunStatus } from '~/lib/db/schema'
    import type { RunListItem, RunListResponse } from '~/types/runs'
    import useFlattenArray from '~/composables/useFlattenArray'

    const { data, status, refresh } = await useFetch<RunListResponse>('/api/runs', {
        key: 'runs'
    })

    const allRows = computed<RunListItem[]>(() => useFlattenArray<RunListItem>(data))

    // Date formatter
    const df = new DateFormatter('da-DK', {
        dateStyle: 'medium'
    })

    // Date range picker state - using CalendarDate
    const dateRange = ref<{ start?: CalendarDate; end?: CalendarDate }>({})

    // Popover state
    const openPopovers = ref<Record<string, string | null>>({})

    const getColorByStatus = (status: RunStatus) => {
        return {
            udført: 'success',
            fejl: 'error',
            indlæser: 'warning',
            afventer: 'neutral'
        }[status]
    }

    // Get calendar events grouped by date with status colors
    const calendarEvents = computed(() => {
        const events: Record<string, Array<{ color: string; label: string }>> = {}
        
        allRows.value.forEach(run => {
            const dateKey = new Date(run.bookingDate).toISOString().split('T')[0]
            if (!events[dateKey]) {
                events[dateKey] = []
            }
            events[dateKey].push({
                color: getColorByStatus(run.status),
                label: run.status
            })
        })

        return events
    })

    // Filter rows based on date range
    const filteredRows = computed<RunListItem[]>(() => {
        if (!dateRange.value.start || !dateRange.value.end) {
            return allRows.value
        }

        const start = dateRange.value.start.toDate(getLocalTimeZone())
        const end = dateRange.value.end.toDate(getLocalTimeZone())
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

    const togglePopover = (runId: string, type: string) => {
        const key = `${runId}-${type}`
        openPopovers.value[key] = openPopovers.value[key] ? null : type
    }

    const columns: TableColumn<RunListItem>[] = [
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
                const status = row.getValue('status') as RunStatus
                return h(resolveComponent('UBadge'), {
                    color: getColorByStatus(status),
                    class: 'capitalize w-fit',
                    variant: 'subtle'
                }, () => status)
            }
        },
        {
            id: 'error',
            header: 'Fejl',
            size: 100,
            enableSorting: false,
            cell: ({ row }) => {
                const errors = row.original.errors
                if (!errors?.length) return null

                const key = `${row.original.id}-error`
                return h(RunsDataPopover, {
                    type: 'error',
                    run: row.original,
                    open: !!openPopovers.value[key],
                    'onUpdate:open': (val: boolean) => {
                        openPopovers.value[key] = val ? 'error' : null
                    }
                })
            }
        },
        {
            id: 'transactions',
            header: 'Transaktioner',
            size: 120,
            enableSorting: false,
            cell: ({ row }) => {
                const txs = row.original.transactions
                if (!txs?.length) return null

                const key = `${row.original.id}-transactions`
                return h(RunsDataPopover, {
                    type: 'transactions',
                    run: row.original,
                    open: !!openPopovers.value[key],
                    'onUpdate:open': (val: boolean) => {
                        openPopovers.value[key] = val ? 'transactions' : null
                    }
                })
            }
        },
        {
            id: 'docs',
            header: 'Dokumenter',
            size: 120,
            enableSorting: false,
            cell: ({ row }) => {
                const docs = row.original.documents
                if (!docs?.length) return null

                const key = `${row.original.id}-docs`
                return h(RunsDataPopover, {
                    type: 'docs',
                    run: row.original,
                    open: !!openPopovers.value[key],
                    'onUpdate:open': (val: boolean) => {
                        openPopovers.value[key] = val ? 'docs' : null
                    }
                })
            }
        }
    ]
</script>

<template>
    <UDashboardPanel id="runs">
        <template #header>
            <UDashboardNavbar title="Kørsler">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #trailing>
                    <UButton
                        icon="i-lucide-refresh-cw"
                        label="Opdater"
                        variant="ghost"
                        :loading="status === 'pending'"
                        @click="refresh()"
                    />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="space-y-4">
                <!-- Date Range Picker -->
                <UPopover :popper="{ placement: 'bottom-start' }">
                    <UButton
                        variant="outline"
                        icon="i-lucide-calendar"
                    >
                        <template v-if="dateRange.start">
                            <template v-if="dateRange.end">
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
                                :events="calendarEvents"
                                class="p-2"
                                :number-of-months="2"
                                range
                            />
                            <div v-if="dateRange.start && dateRange.end" class="mt-4 flex gap-2">
                                <UButton
                                    variant="ghost"
                                    size="sm"
                                    label="Nulstil"
                                    @click="dateRange = {}"
                                    class="flex-1"
                                />
                            </div>
                        </div>
                    </template>
                </UPopover>

                <!-- Table -->
                <div>
                    <div v-if="dateRange.start && dateRange.end" class="text-sm text-muted mb-3">
                        {{ rows.length }} kørsler i valgt periode
                    </div>
                    <UEmpty
                        v-if="!rows.length && status !== 'pending'"
                        icon="i-lucide-archive"
                        title="Ingen kørsler"
                        description="Der er ingen kørsler i den valgte periode endnu."
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
                        ref="table"
                        :data="rows"
                        :columns="columns"
                        :loading="status === 'pending'"
                        :ui="{
                            base: 'border-separate border-spacing-0',
                            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                            tbody: '[&>tr]:last:[&>td]:border-b-0',
                            tr: 'group',
                            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                            td: 'empty:p-0 group-has-[td:not(:empty)]:border-b border-default',
                            separator: 'h-0'
                        }"
                    />
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>
