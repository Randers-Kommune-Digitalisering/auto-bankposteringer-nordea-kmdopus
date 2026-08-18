<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { DashboardLatestRun } from '~/types/dashboard'
import type { RunStatus } from '~/lib/db/schema/enums'

const appConfig = useAppConfig()

const props = defineProps<{
  runs: DashboardLatestRun[]
}>()

type StatusColor = 'success' | 'error' | 'warning' | 'neutral'

const getColorByStatus = (status: RunStatus | string | null): StatusColor => {
  switch (status) {
    case 'udført':
      return 'success'
    case 'fejl':
      return 'error'
    case 'indlæser':
      return 'warning'
    case 'afventer':
      return 'warning'
    default:
      return 'neutral'
  }
}

const columns: TableColumn<DashboardLatestRun>[] = [
  {
    accessorKey: 'bookingDate',
    header: 'Dato',
    size: 140,
    cell: ({ row }) => {
      return new Date(row.getValue('bookingDate')).toLocaleString('da-DK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 140,
    cell: ({ row }) => {
      const status = (row.getValue('status') ?? 'afventer') as RunStatus
      return h(resolveComponent('UBadge'), {
        color: getColorByStatus(status),
        class: 'capitalize w-fit',
        variant: 'subtle',
      }, () => status)
    },
  },
  {
    accessorKey: 'transactionsCount',
    header: 'Behandling',
    size: 150,
    cell: ({ row }) => {
      const run = row.original
      return h('span', {
        title: `Åbne: ${run.openTransactionsCount}, undtagne: ${run.exceptionTransactionsCount}`,
      }, `${run.processedTransactionsCount}/${run.transactionsCount}`)
    },
  },
  {
    accessorKey: 'activeErrorsCount',
    header: 'Aktive fejl',
    size: 110,
    cell: ({ row }) => {
      return String(row.getValue('activeErrorsCount') as number)
    },
  },
  {
    accessorKey: 'eventCount',
    header: 'Hændelser',
    size: 110,
    cell: ({ row }) => {
      return String(row.getValue('eventCount') as number)
    },
  },
  {
    accessorKey: 'lastActivityAt',
    header: 'Senest aktivitet',
    size: 160,
    cell: ({ row }) => {
      const value = row.getValue('lastActivityAt') as string | null
      if (!value) return '—'
      return new Date(value).toLocaleString('da-DK', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
  },
]

const latestRunsTableKey = computed(() => props.runs.map((r) => `${r.id}:${r.bookingDate}:${r.status}:${r.activeErrorsCount}`).join('|'))
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="font-medium">Seneste kørsler</div>
        <UButton to="/koersler" variant="ghost" :icon="appConfig.ui.icons.arrowRight" label="Se alle" />
      </div>
    </template>

    <UEmpty
      v-if="!runs.length"
      :icon="appConfig.ui.icons.archive"
      title="Ingen kørsler"
      description="Der er ingen kørsler endnu."
      class="border border-dashed border-default rounded-lg"
    />

    <UTable
      v-else
      :key="latestRunsTableKey"
      :data="runs"
      :columns="columns"
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
  </UCard>
</template>
