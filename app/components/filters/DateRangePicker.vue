<script setup lang="ts">
import { DateFormatter, parseDate } from '@internationalized/date'
import { DEFAULT_TIME_ZONE } from '~/utils'

const appConfig = useAppConfig()

const props = defineProps<{
  modelValue: any
  resetValue?: any
  timeZone?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

const timeZone = computed(() => props.timeZone ?? DEFAULT_TIME_ZONE)

const df = computed(() => new DateFormatter('da-DK', {
  dateStyle: 'medium',
  timeZone: timeZone.value,
}))

function toIsoDate(input: Date): string {
  return `${input.getUTCFullYear()}-${String(input.getUTCMonth() + 1).padStart(2, '0')}-${String(input.getUTCDate()).padStart(2, '0')}`
}

function toCalendarDateValue(input: any): any {
  if (!input) return null
  if (typeof input?.toDate === 'function') return input
  if (input instanceof Date && !Number.isNaN(input.getTime())) return parseDate(toIsoDate(input))

  const asString = String(input).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) return parseDate(asString)

  const asDate = new Date(asString)
  if (!Number.isNaN(asDate.getTime())) return parseDate(toIsoDate(asDate))
  return null
}

function toDisplayDate(input: any): Date | null {
  if (!input) return null
  if (typeof input?.toDate === 'function') return input.toDate(timeZone.value)
  if (input instanceof Date && !Number.isNaN(input.getTime())) return input

  const parsed = new Date(String(input))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function normalizeRange(input: any): any {
  if (!input) return null
  const start = toCalendarDateValue(input.start)
  const end = toCalendarDateValue(input.end)
  if (!start && !end) return null
  return {
    start,
    end: end ?? start,
  }
}

const value = computed<any>({
  get: () => normalizeRange(props.modelValue),
  set: (next) => emit('update:modelValue', next),
})

const calendarEvents = computed(() => ({}))

const label = computed(() => {
  const start = toDisplayDate(value.value?.start)
  const end = toDisplayDate(value.value?.end)

  if (!start) return 'Vælg periode'
  if (!end) return df.value.format(start)
  return `${df.value.format(start)} - ${df.value.format(end)}`
})
</script>

<template>
  <UPopover :popper="{ placement: 'bottom-start' }">
    <UButton variant="outline" :icon="appConfig.ui.icons.calendar">
      {{ label }}
    </UButton>

    <template #content>
      <div class="p-4">
        <UCalendar
          v-model="value"
          :events="calendarEvents"
          class="p-2"
          :number-of-months="2"
          range
        />
        <div v-if="value?.start && value?.end" class="mt-4 flex gap-2">
          <UButton
            variant="ghost"
            size="sm"
            label="Nulstil"
            @click="value = (normalizeRange(props.resetValue) ?? null)"
            class="flex-1"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
