import { ref, watchEffect } from 'vue'
import type { RuleTagSelectSchema } from '~/lib/db/schema/ruleTag'

export function useRuleTags() {
  const ruleTags = ref<RuleTagSelectSchema[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // Keep a single Nuxt data cache entry so `refresh()` / `refreshNuxtData('rule-tags')`
  // updates every consumer consistently.
  const {
    data,
    pending,
    error: fetchError,
    refresh,
  } = useFetch<RuleTagSelectSchema[]>('/api/rule-tags', {
    key: 'rule-tags',
    default: () => [],
  })

  watchEffect(() => {
    ruleTags.value = data.value ?? []
    loading.value = Boolean(pending.value)
    error.value = (fetchError.value as any) ?? null
  })

  async function fetchRuleTags() {
    try {
      await refresh()
    } catch {
      // Errors are surfaced via `error` from useFetch
    }
  }

  return { ruleTags, loading, error, fetchRuleTags }
}
