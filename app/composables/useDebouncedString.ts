import { computed, onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

type DebouncedStringOptions = {
  delayMs?: number
}

export function useDebouncedString(
  source: MaybeRefOrGetter<string>,
  options: DebouncedStringOptions = {},
) {
  const delayMs = Math.max(0, options.delayMs ?? 400)
  const debounced = ref(String(toValue(source) ?? ''))
  let timeout: ReturnType<typeof setTimeout> | undefined

  watch(
    () => String(toValue(source) ?? ''),
    (next) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        debounced.value = next
      }, delayMs)
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    if (timeout) clearTimeout(timeout)
  })

  return computed(() => debounced.value)
}
