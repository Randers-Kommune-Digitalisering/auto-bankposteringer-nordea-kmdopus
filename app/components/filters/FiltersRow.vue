<script setup lang="ts">
import { DEFAULT_TIME_ZONE } from '~/lib/timeZone'

type DateRangeValue = any

const props = withDefaults(
  defineProps<{
    dateRange?: DateRangeValue
    resetDateRange?: DateRangeValue
    timeZone?: string

    accountIds?: string[]
    accountPlaceholder?: string

    search?: string
    searchPlaceholder?: string
    showSearch?: boolean
  }>(),
  {
    timeZone: DEFAULT_TIME_ZONE,
    accountIds: () => [],
    accountPlaceholder: 'Alle konti',
    search: '',
    searchPlaceholder: 'Søg...',
    showSearch: false,
  },
)

const emit = defineEmits<{
  (e: 'update:dateRange', value: DateRangeValue): void
  (e: 'update:accountIds', value: string[]): void
  (e: 'update:search', value: string): void
}>()

const dateRangeModel = computed<DateRangeValue>({
  get: () => props.dateRange,
  set: (next) => emit('update:dateRange', next),
})

const accountIdsModel = computed<string[]>({
  get: () => props.accountIds,
  set: (next) => emit('update:accountIds', next),
})

const searchModel = computed<string>({
  get: () => props.search,
  set: (next) => emit('update:search', next),
})

</script>

<template>
  <div class="flex flex-wrap items-center gap-2 justify-between">
    <div class="flex flex-wrap items-center gap-2">
      <div class="min-w-64">
        <FiltersBankAccountPicker
          v-model="accountIdsModel"
          :placeholder="accountPlaceholder"
          class="min-w-64"
        />
      </div>

      <UiFloatingLabelInput
        v-if="showSearch"
        v-model="searchModel"
        class="max-w-sm"
        color="primary"
        variant="outline"
        :ui="{ base: 'ring-primary/50 text-primary focus-visible:ring-primary' }"
        trailing-icon="solar:magnifer-bold-duotone"
        :label="searchPlaceholder"
      />
    </div>

    <div class="w-full sm:w-auto">
      <slot name="date">
        <FiltersDateRangePicker
          v-model="dateRangeModel"
          :reset-value="resetDateRange"
          :time-zone="timeZone"
        />
      </slot>
    </div>
  </div>
</template>
