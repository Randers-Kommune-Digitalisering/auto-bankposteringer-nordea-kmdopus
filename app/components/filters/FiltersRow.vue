<script setup lang="ts">
import { today, type DateValue } from '@internationalized/date'
import { DEFAULT_TIME_ZONE } from '~/utils'

const appConfig = useAppConfig()

type DateRangeValue = {
  start: DateValue;
  end: DateValue;
}

type SelectOption = {
  label: string
  value: string | number
}

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

    transactionType?: string
    transactionTypeOptions?: SelectOption[]
    transactionTypePlaceholder?: string
    showTransactionType?: boolean

    pageSize?: number
    pageSizeOptions?: SelectOption[]
    showPageSize?: boolean
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
    transactionType: undefined,
    transactionTypeOptions: () => [],
    transactionTypePlaceholder: 'Alle transaktionstyper',
    showTransactionType: false,
    pageSize: undefined,
    pageSizeOptions: () => [],
    showPageSize: false,
  },
)

const emit = defineEmits<{
  (e: 'update:dateRange', value: DateRangeValue): void
  (e: 'update:accountIds', value: string[]): void
  (e: 'update:search', value: string): void
  (e: 'update:transactionType', value: string | undefined): void
  (e: 'update:pageSize', value: number): void
}>()

const dateRangeModel = computed<DateRangeValue>({
  get: () => {
    if (props.dateRange) return props.dateRange
    if (props.resetDateRange) return props.resetDateRange
    const defaultDate = today(props.timeZone ?? DEFAULT_TIME_ZONE)
    return { start: defaultDate, end: defaultDate }
  },
  set: (next: DateRangeValue) => emit('update:dateRange', next),
})

const accountIdsModel = computed<string[]>({
  get: () => props.accountIds,
  set: (next) => emit('update:accountIds', next),
})

const searchModel = computed<string>({
  get: () => props.search,
  set: (next) => emit('update:search', next),
})

const transactionTypeModel = computed<string | undefined>({
  get: () => props.transactionType,
  set: (next) => emit('update:transactionType', next),
})

const pageSizeModel = computed<number | undefined>({
  get: () => props.pageSize,
  set: (next) => {
    if (typeof next === 'number') emit('update:pageSize', next)
  },
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

      <UFormField v-if="props.showTransactionType" label="Transaktionstype" class="min-w-64 max-w-sm">
        <USelectMenu
          v-model="transactionTypeModel"
          :items="props.transactionTypeOptions"
          multiple
          labelKey="label"
          valueKey="value"
          :placeholder="props.transactionTypePlaceholder"
          color="primary"
          variant="subtle"
          class="w-full"
        />
      </UFormField>

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

      <UFormField v-if="props.showPageSize" label="Antal pr. side" class="w-40">
        <USelect
          v-model="pageSizeModel"
          :items="props.pageSizeOptions"
          label-key="label"
          value-key="value"
          class="w-full"
        />
      </UFormField>
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
