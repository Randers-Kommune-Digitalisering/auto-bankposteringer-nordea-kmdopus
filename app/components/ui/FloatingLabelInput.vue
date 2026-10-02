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
    <fieldset
      v-if="hasNotchedOutline"
      aria-hidden="true"
      class="floating-label-input-frame pointer-events-none absolute inset-x-0 bottom-0 m-0 min-w-0 rounded-md border border-accented p-0 pe-2 text-start transition-colors peer-disabled:opacity-75 peer-focus-visible:border-2 ps-[9px] peer-focus-visible:ps-2"
      :class="[
        labelStartClass === 'start-9' ? 'ps-[35px] peer-focus-visible:ps-[34px]' : '',
        outlineFocusClasses,
        isHighlighted ? outlineColorClasses.rest : '',
      ]"
    >
      <legend class="floating-label-input-notch float-none m-0 w-auto max-w-[0.01px] overflow-hidden p-0 text-xs leading-[11px] invisible whitespace-nowrap transition-[max-width] duration-200">
        <span class="px-1">
          {{ props.label }}<span v-if="props.required" class="ms-0.5">*</span>
        </span>
      </legend>
    </fieldset>
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
      <span class="inline-flex px-1">
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
const hasNotchedOutline = computed(() => props.variant === 'outline' || props.variant === 'subtle')
const isHighlighted = computed(() => Boolean((attrs as any).highlight))
const labelStartClass = computed(() => (hasLeading.value ? 'start-9' : 'start-2.5'))

const outlineColorClasses = {
  primary: { rest: 'border-primary', focus: 'peer-focus-visible:border-primary' },
  secondary: { rest: 'border-secondary', focus: 'peer-focus-visible:border-secondary' },
  success: { rest: 'border-success', focus: 'peer-focus-visible:border-success' },
  info: { rest: 'border-info', focus: 'peer-focus-visible:border-info' },
  warning: { rest: 'border-warning', focus: 'peer-focus-visible:border-warning' },
  error: { rest: 'border-error', focus: 'peer-focus-visible:border-error' },
  neutral: { rest: 'border-inverted', focus: 'peer-focus-visible:border-inverted' },
} as const

const outlineFocusClasses = computed(() => outlineColorClasses[props.color].focus)

function mergeClass(a: unknown, b: unknown): string {
  return [typeof a === 'string' ? a : '', typeof b === 'string' ? b : ''].filter(Boolean).join(' ')
}

const mergedUi = computed(() => {
  const incoming = (attrs as any).ui ?? {}
  return {
    ...incoming,
    root: mergeClass(
      incoming.root,
      hasNotchedOutline.value
        ? 'relative floating-label-input-root has-notched-outline'
        : 'relative floating-label-input-root',
    ),
    base: mergeClass(incoming.base, 'peer'),
  }
})
</script>

<style scoped>
.floating-label-input-frame {
  top: -5.5px;
}

.floating-label-input-root.has-notched-outline > :deep(input) {
  box-shadow: none !important;
}

.floating-label-input-root:focus-within .floating-label-input-notch,
.floating-label-input-root:has(> input:not(:placeholder-shown)) .floating-label-input-notch {
  max-width: 100vw;
}
</style>
