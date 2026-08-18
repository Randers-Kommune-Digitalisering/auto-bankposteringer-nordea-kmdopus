<script setup lang="ts" generic="T extends StackedTransactionsTableRow">
import type { TableColumn } from '@nuxt/ui'
import type { StackedTransactionsTableRow } from '~/types/transactions'

const props = defineProps<{
  rows: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  tableKey?: string
  totalSamleposter?: number
  columnVisibility?: Record<string, boolean>
  emptyLabel?: string
  ui?: Record<string, string>
}>()

const emit = defineEmits<{
  (e: 'update:columnVisibility', value: Record<string, boolean>): void
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
      :column-visibility="props.columnVisibility"
      :ui="props.ui"
      @update:column-visibility="(value) => emit('update:columnVisibility', value)"
    >
      <template #empty>
        <div class="py-10 text-center text-gray-500">
          {{ props.emptyLabel ?? 'Der er ingen transaktioner at vise.' }}
        </div>
      </template>
    </UTable>

    <slot name="after-table" :rows="props.rows" />
  </div>
</template>
