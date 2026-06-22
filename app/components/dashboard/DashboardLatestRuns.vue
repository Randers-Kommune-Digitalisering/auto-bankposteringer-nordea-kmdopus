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
    header: 'Transaktioner',
    size: 130,
  },
  {
    accessorKey: 'errorsCount',
    header: 'Fejl',
    size: 100,
    cell: ({ row }) => {
      const val = row.getValue('errorsCount') as number
      if (!val) return ''
      return String(val)
    },
  },
]

const latestRunsTableKey = computed(() => props.runs.map((r) => `${String((r as any).bookingDate ?? '')}:${String((r as any).status ?? '')}`).join('|'))
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
