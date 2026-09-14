<script setup lang="ts">
import useFlattenArray from '~/composables/useFlattenArray'

type BankAccount = { id: string; name: string | null; ignoreIngestion?: boolean }

type Option = { value: string; label: string }

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    label?: string | null
    placeholder?: string
    disabled?: boolean
    loading?: boolean
  }>(),
  {
    label: null,
    placeholder: 'Alle konti',
    disabled: false,
    loading: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

function normalizeSelectedIds(next: unknown): string[] {
  const arr = Array.isArray(next) ? next : []

  return arr
    .map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object') {
        const v = (item as any).value
        if (typeof v === 'string') return v
        const id = (item as any).id
        if (typeof id === 'string') return id
      }
      return null
    })
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
}

const model = computed<string[]>({
  get: () => props.modelValue,
  set: (next) => emit('update:modelValue', normalizeSelectedIds(next)),
})

const { data: bankAccountsData, status: bankAccountsStatus } = await useFetch<BankAccount[]>('/api/bank-accounts', {
  key: 'bank-accounts',
  default: () => ([]),
})

const options = computed<Option[]>(() => {
  const accounts = useFlattenArray<BankAccount>(bankAccountsData)
  return accounts
    .filter((account) => !account.ignoreIngestion)
    .map((account) => ({ value: account.id, label: account.name ?? account.id }))
})

watch(bankAccountsData, (accounts) => {
  if (!Array.isArray(accounts)) return

  const allowedIds = new Set(accounts.filter((account) => !account.ignoreIngestion).map((account) => account.id))
  const filteredIds = model.value.filter((id) => allowedIds.has(id))
  if (filteredIds.length !== model.value.length) emit('update:modelValue', filteredIds)
})

const isLoading = computed(() => props.loading || bankAccountsStatus.value === 'pending')
</script>

<template>
  <UFormField v-if="label" :label="label">
    <USelectMenu
      v-model="model"
      :items="options"
      multiple
      valueKey="value"
      labelKey="label"
      :placeholder="placeholder"
      :loading="isLoading"
      :disabled="disabled"
      color="primary"
      variant="subtle"
      class="w-full"
    />
  </UFormField>

  <USelectMenu
    v-else
    v-model="model"
    :items="options"
    multiple
    valueKey="value"
    labelKey="label"
    :placeholder="placeholder"
    :loading="isLoading"
    :disabled="disabled"
    color="primary"
    variant="subtle"
    class="w-full"
  />
</template>
