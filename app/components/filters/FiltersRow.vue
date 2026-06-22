<script setup lang="ts">
import { DEFAULT_TIME_ZONE } from '~/lib/timeZone'

const appConfig = useAppConfig()

type DateRangeValue = any

const props = withDefaults(
  defineProps<{
    dateRange?: DateRangeValue
    resetDateRange?: DateRangeValue
    timeZone?: string

    showDate?: boolean
    showDateLabel?: boolean
    dateLabel?: string

    accountIds?: string[]
    accountPlaceholder?: string
    showAccountLabel?: boolean
    accountLabel?: string
    showAccounts?: boolean

    search?: string
    showSearchLabel?: boolean
    searchLabel?: string
    searchPlaceholder?: string
    showSearch?: boolean
  }>(),
  {
    timeZone: DEFAULT_TIME_ZONE,
    showDate: true,
    showDateLabel: true,
    dateLabel: 'Periode',
    accountIds: () => [],
    accountPlaceholder: 'Alle konti',
    showAccountLabel: true,
    accountLabel: 'Konti',
    showAccounts: true,
    search: '',
    showSearchLabel: true,
    searchLabel: 'Søg',
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
  <div class="flex flex-wrap gap-2 justify-between" :class="(props.showAccountLabel || props.showSearch) ? 'items-start' : 'items-center'">
    <div class="flex flex-wrap gap-2" :class="(props.showAccountLabel || props.showSearch) ? 'items-start' : 'items-center'">
      <div v-if="props.showAccounts" class="min-w-64">
        <UFormField v-if="props.showAccountLabel" :label="props.accountLabel">
          <FiltersBankAccountPicker
            v-model="accountIdsModel"
            :placeholder="accountPlaceholder"
            class="min-w-64"
          />
        </UFormField>

        <FiltersBankAccountPicker
          v-else
          v-model="accountIdsModel"
          :placeholder="accountPlaceholder"
          class="min-w-64"
        />
      </div>

      <UFormField v-if="showSearch && props.showSearchLabel" :label="props.searchLabel" class="min-w-64 max-w-sm">
        <UInput
          v-model="searchModel"
          class="w-full"
          color="primary"
          variant="outline"
          :ui="{ base: 'ring-primary/50 text-primary focus-visible:ring-primary' }"
          :trailing-icon="appConfig.ui.icons.search"
          :placeholder="searchPlaceholder"
        />
      </UFormField>

      <UInput
        v-else-if="showSearch"
        v-model="searchModel"
        class="min-w-64 max-w-sm"
        color="primary"
        variant="outline"
        :ui="{ base: 'ring-primary/50 text-primary focus-visible:ring-primary' }"
        :trailing-icon="appConfig.ui.icons.search"
        :placeholder="searchPlaceholder"
      />
    </div>

    <div v-if="$slots.date || props.showDate" class="w-full sm:w-auto">
      <slot name="date">
        <UFormField v-if="props.showDate && props.showDateLabel" :label="props.dateLabel">
          <FiltersDateRangePicker
            v-model="dateRangeModel"
            :reset-value="resetDateRange"
            :time-zone="timeZone"
          />
        </UFormField>

        <FiltersDateRangePicker
          v-else-if="props.showDate"
          v-model="dateRangeModel"
          :reset-value="resetDateRange"
          :time-zone="timeZone"
        />
      </slot>
    </div>
  </div>
</template>
