<script setup lang="ts">
import { DateFormatter } from '@internationalized/date'
import { DEFAULT_TIME_ZONE } from '~/lib/timeZone'

const props = defineProps<{
  modelValue: any
  resetValue?: any
  timeZone?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

const df = new DateFormatter('da-DK', { dateStyle: 'medium' })

const timeZone = computed(() => props.timeZone ?? DEFAULT_TIME_ZONE)

const value = computed<any>({
  get: () => props.modelValue,
  set: (next) => emit('update:modelValue', next),
})

const calendarEvents = computed(() => ({}))

const label = computed(() => {
  if (!value.value?.start) return 'Vælg periode'
  if (!value.value?.end) return df.format(value.value.start.toDate(timeZone.value))
  return `${df.format(value.value.start.toDate(timeZone.value))} - ${df.format(value.value.end.toDate(timeZone.value))}`
})
</script>

<template>
  <UPopover :popper="{ placement: 'bottom-start' }">
    <UButton variant="outline" icon="solar:calendar-bold-duotone">
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
            @click="value = (props.resetValue ?? null)"
            class="flex-1"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
