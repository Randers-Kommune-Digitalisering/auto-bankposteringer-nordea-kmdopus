export const DEFAULT_BANK_ACCOUNT_QUERY_KEY = 'default-bank-account' as const

export type DefaultBankAccountResponse = {
  defaultBankAccountId: string | null
}

export function useDefaultBankAccount() {
  const { data, pending, refresh } = useFetch<DefaultBankAccountResponse>(
    '/api/settings/default-bank-account',
    {
      key: DEFAULT_BANK_ACCOUNT_QUERY_KEY,
      default: () => ({ defaultBankAccountId: null }),
    },
  )

  const defaultBankAccountId = computed(() => data.value?.defaultBankAccountId ?? null)

  async function setDefaultBankAccount(accountId: string | null) {
    const saved = await $fetch<DefaultBankAccountResponse>('/api/settings/default-bank-account', {
      method: 'PUT',
      body: { defaultBankAccountId: accountId },
    })

    data.value = saved
    await refreshNuxtData(DEFAULT_BANK_ACCOUNT_QUERY_KEY)
    return saved
  }

  return { data, pending, refresh, defaultBankAccountId, setDefaultBankAccount }
}