<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

export type StackedTransactionsTableRow = {
  stackId: string
  lineCount: number
  category: 'Samlepost' | 'Enkeltpost'
  [key: string]: unknown
}

const props = defineProps<{
  rows: StackedTransactionsTableRow[]
  columns: TableColumn<StackedTransactionsTableRow>[]
  loading?: boolean
  tableKey?: string
  totalSamleposter?: number
  ui?: Record<string, string>
}>()
</script>

<template>
  <div class="space-y-3">
    <slot name="toolbar" :total-samleposter="props.totalSamleposter" />

    <UTable
      :key="props.tableKey"
      :data="props.rows"
      :columns="props.columns"
      :loading="props.loading"
      :ui="props.ui"
    />

    <slot name="after-table" :rows="props.rows" />
  </div>
</template>
