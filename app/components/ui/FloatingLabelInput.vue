<template>
  <UInput
    :id="inputId"
    v-bind="$attrs"
    v-model="model"
    placeholder=" "
    :type="props.type"
    :disabled="props.disabled"
    :required="props.required"
    :size="props.size"
    :color="props.color"
    :variant="props.variant"
    :ui="mergedUi"
  >
    <label
      :for="inputId"
      :class="[
        'absolute top-1/2 -translate-y-1/2 pointer-events-none select-none z-10 text-sm',
        labelStartClass,
        'transition-all duration-200 origin-top-left',
        // Float onto the input border (not inside the field)
        'peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs',
        'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs',
        props.color === 'error'
          ? 'text-[var(--ui-error)] peer-focus:text-[var(--ui-error)]'
          : 'text-dimmed peer-focus:text-[var(--ui-primary)]',
        props.disabled ? 'opacity-75 cursor-not-allowed' : '',
      ]"
    >
      <span :class="['inline-flex px-1 rounded', labelBgClass]">
        {{ props.label }}<span v-if="props.required" class="text-[var(--ui-error)] ms-0.5">*</span>
      </span>
    </label>
  </UInput>
</template>

<script setup lang="ts">
import { useId } from '#imports'
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label: string
    type?: string
    disabled?: boolean
    required?: boolean
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
    variant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none'
  }>(),
  {
    type: 'text',
    size: 'md',
    color: 'primary',
    variant: 'outline',
  },
)

const model = defineModel<any>()

const attrs = useAttrs()
const fallbackId = useId()
const inputId = computed(() => (typeof attrs.id === 'string' && attrs.id.length ? attrs.id : fallbackId))

const hasLeading = computed(
  () => Boolean((attrs as any).icon || (attrs as any).leadingIcon || (attrs as any).leading || (attrs as any).avatar),
)
const labelStartClass = computed(() => (hasLeading.value ? 'start-9' : 'start-2.5'))

const labelBgClass = computed(() => {
  // Match the input background so the label can sit on the border
  // without looking like a white patch on subtle/soft variants.
  if (props.variant === 'subtle' || props.variant === 'soft') return 'bg-(--ui-bg-elevated)'
  return 'bg-(--ui-bg)'
})

function mergeClass(a: unknown, b: unknown): string {
  return [typeof a === 'string' ? a : '', typeof b === 'string' ? b : ''].filter(Boolean).join(' ')
}

const mergedUi = computed(() => {
  const incoming = (attrs as any).ui ?? {}
  return {
    ...incoming,
    root: mergeClass(incoming.root, 'relative'),
    base: mergeClass(incoming.base, 'peer'),
  }
})
</script>
