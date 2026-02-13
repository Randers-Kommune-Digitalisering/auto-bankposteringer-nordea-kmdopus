import { ref } from 'vue'
import type { RuleTagSelectSchema } from '~/lib/db/schema'

export function useRuleTags() {
  const ruleTags = ref<RuleTagSelectSchema[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function fetchRuleTags() {
    loading.value = true
    try {
      const { data } = await useFetch<RuleTagSelectSchema[]>('/api/rule-tags')
      ruleTags.value = data.value || []
    } catch (err) {
      error.value = err as Error
    } finally {
      loading.value = false
    }
  }

  return { ruleTags, loading, error, fetchRuleTags }
}
