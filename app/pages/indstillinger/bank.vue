<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row, SortingState } from '@tanstack/table-core'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { AccountSelectSchema } from '~/lib/db/schema/account'

type BankingAgreement = {
  provider: 'danskebank' | 'nordea' | 'bankconnect'
  enabled: boolean
  channel: 'iso20022' | 'rest'
  allowlistIbans?: string[]
  readiness?: 
    | {
        status: 'ready'
        env: {
          requirements: Array<
            | { type: 'key'; key: string; present: boolean; invalid: boolean }
            | {
                type: 'anyOf'
                label: string
                keys: string[]
                presentKeys: string[]
                satisfied: boolean
                invalidKeys: string[]
              }
          >
          presentKeys: string[]
          missingKeys: string[]
          invalidKeys: string[]
        }
      }
    | {
        status: 'not_configured'
        message: string
        env: {
          requirements: any[]
          presentKeys: string[]
          missingKeys: string[]
          invalidKeys: string[]
        }
      }
    | {
        status: 'missing_env'
        message: string
        missingKeys: string[]
        env: {
          requirements: any[]
          presentKeys: string[]
          missingKeys: string[]
          invalidKeys: string[]
        }
      }
    | { status: 'not_implemented'; message: string; env?: any }
}

const BANK_ACCOUNTS_QUERY_KEY = 'bank-accounts' as const

const toast = useToast()
const table = useTemplateRef('table')
const globalFilterValue = ref('')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UIcon = resolveComponent('UIcon')

const channelOptions = [
  { label: 'ISO 20022', value: 'iso20022' as const },
  { label: 'REST API', value: 'rest' as const },
]

const channelLabel = (c: BankingAgreement['channel']) => {
  if (c === 'rest') return 'REST API'
  return 'ISO 20022'
}

const modalOpen = ref(false)
const editingAccountId = ref<string | null>(null)
const deletingAccountId = ref<string | null>(null)
const refreshingAccounts = ref(false)
const sorting = ref<SortingState>([])

const envModalOpen = ref(false)
const envModalProvider = ref<BankingAgreement['provider'] | null>(null)

const allowlistDraftIbanByProvider = reactive<Record<BankingAgreement['provider'], string>>({
  danskebank: '',
  nordea: '',
  bankconnect: '',
})

const { data: accounts, pending, refresh: refreshBankAccounts } = await useFetch<AccountSelectSchema[]>(
  '/api/bank-accounts',
  {
    key: BANK_ACCOUNTS_QUERY_KEY,
    default: () => []
  }
)


const { data: agreements, refresh: refreshAgreements } = await useFetch<BankingAgreement[]>(
  '/api/banking-agreements',
  {
    key: 'banking-agreements',
    default: () => [],
  }
)

const providerLabel = (p: BankingAgreement['provider']) => {
  if (p === 'danskebank') return 'Danske Bank'
  if (p === 'nordea') return 'Nordea'
  return 'Bank Connect'
}

async function toggleAgreement(provider: BankingAgreement['provider'], enabled: boolean) {
  try {
    await $fetch(`/api/banking-agreements/${provider}`, {
      method: 'PUT',
      body: { enabled },
    })
    await refreshAgreements()
    return true
  } catch (err: any) {
    toast.add({
      title: 'Kan ikke aktivere aftale',
      description: String(err?.data?.statusMessage ?? err?.statusMessage ?? err?.message ?? err),
      color: 'error',
    })
    return false
  }
}

async function updateAgreementChannel(provider: BankingAgreement['provider'], channel: BankingAgreement['channel']) {
  try {
    await $fetch(`/api/banking-agreements/${provider}`, {
      method: 'PUT',
      body: { channel },
    })
    await refreshAgreements()
    return true
  } catch (err: any) {
    toast.add({
      title: 'Kan ikke ændre kanal',
      description: String(err?.data?.statusMessage ?? err?.statusMessage ?? err?.message ?? err),
      color: 'error',
    })
    return false
  }
}

const readinessText = (a: BankingAgreement) => {
  const r = a.readiness
  if (!r) return '—'
  if (r.status === 'ready') return 'Klar'
  if (r.status === 'not_implemented') return 'Ikke implementeret'
  if (r.status === 'not_configured') return 'Ikke konfigureret'
  if (r.status === 'missing_env') {
    const missing = (r as any)?.env?.missingKeys ?? r.missingKeys ?? []
    const invalid = (r as any)?.env?.invalidKeys ?? []
    const missingText = missing?.length ? missing.slice(0, 3).join(', ') : ''
    const invalidText = invalid?.length ? invalid.slice(0, 2).join(', ') : ''
    if (missingText && invalidText) return `Mangler: ${missingText} • Ugyldig: ${invalidText}`
    if (missingText) return `Mangler: ${missingText}`
    if (invalidText) return `Ugyldig: ${invalidText}`
    return 'Mangler env'
  }
  return '—'
}

const selectedAgreement = computed(() => {
  const provider = envModalProvider.value
  if (!provider) return null
  return (agreements.value ?? []).find((a) => a.provider === provider) ?? null
})

const selectedEnvRequirements = computed(() => {
  const r = selectedAgreement.value?.readiness as any
  return r?.env?.requirements ?? []
})

const canEnableSelectedAgreement = computed(() => selectedAgreement.value?.readiness?.status === 'ready')

function openEnvModal(provider: BankingAgreement['provider']) {
  envModalProvider.value = provider
  envModalOpen.value = true
}

async function activateSelectedAgreement() {
  if (!envModalProvider.value) return
  const ok = await toggleAgreement(envModalProvider.value, true)
  if (ok) {
    envModalOpen.value = false
    envModalProvider.value = null
  }
}

async function addAllowlistIban(provider: BankingAgreement['provider']) {
  const draft = allowlistDraftIbanByProvider[provider]
  const iban = String(draft ?? '').trim()
  if (!iban) return
  try {
    await $fetch(`/api/banking-agreements/${provider}/allowlist`, {
      method: 'POST',
      body: { iban },
    })
    allowlistDraftIbanByProvider[provider] = ''
    await refreshAgreements()
  } catch (err: any) {
    toast.add({
      title: 'Kan ikke tilføje konto',
      description: String(err?.data?.statusMessage ?? err?.statusMessage ?? err?.message ?? err),
      color: 'error',
    })
  }
}

async function removeAllowlistIban(provider: BankingAgreement['provider'], iban: string) {
  try {
    await $fetch(`/api/banking-agreements/${provider}/allowlist/${encodeURIComponent(iban)}`, {
      method: 'DELETE',
    })
    await refreshAgreements()
  } catch (err: any) {
    toast.add({
      title: 'Kan ikke fjerne konto',
      description: String(err?.data?.statusMessage ?? err?.statusMessage ?? err?.message ?? err),
      color: 'error',
    })
  }
}

const refreshAccounts = async () => {
  refreshingAccounts.value = true
  try {
    await refreshBankAccounts()
  } finally {
    refreshingAccounts.value = false
  }
}

const rows = computed(() => [...(accounts.value ?? [])])

const createSortableHeader = (label: string) => ({ column }: { column: any }) => {
  const sortingState = column.getIsSorted?.()
  const iconName = sortingState === 'asc'
    ? 'i-lucide-arrow-up'
    : sortingState === 'desc'
      ? 'i-lucide-arrow-down'
      : 'i-lucide-arrow-up-down'

  return h(
    'button',
    {
      type: 'button',
      class: 'inline-flex items-center gap-1 font-semibold text-left text-sm',
      onClick: column.getToggleSortingHandler?.()
    },
    [
      h('span', label),
      h(UIcon, {
        name: iconName,
        class: 'size-3.5 text-muted'
      })
    ]
  )
}

// Dropdown-menu for actions
function getRowItems(row: Row<AccountSelectSchema>) {
  return [
    { type: 'label', label: 'Handlinger' },
    {
      label: 'Rediger',
      icon: 'solar:ruler-cross-pen-bold-duotone',
      onSelect() { handleEditAccount(row) }
    }
  ]
}

const columns: TableColumn<AccountSelectSchema>[] = [
  { // id
    accessorKey: 'id',
    id: 'id',
    header: createSortableHeader('Bankkonto'),
    enableSorting: true
  },
  { // provider
    accessorKey: 'provider',
    id: 'provider',
    header: createSortableHeader('Udbyder'),
    enableSorting: true,
  },
  { // statusAccount
    accessorKey: 'statusAccount',
    id: 'statusAccount',
    header: createSortableHeader('Statuskonto'),
    enableSorting: true
  },
  { // Handlinger
    id: 'actions',
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end'
            },
            items: getRowItems(row)
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
        )
      )
    }
  }
]

const pagination = ref({ pageIndex: 0, pageSize: 20 })

function handleAddAccount() {
  // Manual account creation is intentionally disabled.
}

function handleEditAccount(row: Row<AccountSelectSchema>) {
  editingAccountId.value = row.original.id
  modalOpen.value = true
}

async function handleSaved() {
  editingAccountId.value = null
  await refreshAccounts()
  modalOpen.value = false
}

async function handleDeleteAccount(row: Row<AccountSelectSchema>) {
  // Discovered accounts are managed by ingestion and should not be deleted from UI.
  void row
  return
  const accountId = row.original.id
  deletingAccountId.value = accountId

  try {
    await $fetch(`/api/bank-accounts/${accountId}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Bankkonto slettet',
      description: `${accountId} er blevet fjernet.`
    })

    accounts.value = (accounts.value ?? []).filter((account) => account.id !== accountId)
    await refreshAccounts()
  } catch (error) {
    console.error('Fejl ved sletning af konto', error)
    toast.add({
      title: 'Fejl ved sletning',
      description: 'Kunne ikke slette bankkontoen. Prøv igen senere.',
      color: 'error'
    })
  } finally {
    deletingAccountId.value = null
  }
}
</script>

<template>
  <UDashboardPanel id="settings-banking">
    <template #header>
      <UDashboardNavbar title="Bankintegration">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <div />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <section class="mb-8 space-y-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Aftaler</p>
          <p class="text-sm text-muted">Aktivér de bankudbydere I har aftale med. Konti oprettes automatisk ved indlæsning af CAMT.053.</p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="a in agreements"
            :key="a.provider"
            class="flex flex-col gap-3 rounded-md border border-default p-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="text-sm font-semibold">{{ providerLabel(a.provider) }}</div>
                <div class="text-xs text-muted">
                  {{ a.enabled ? 'Aktiv' : 'Inaktiv' }} • {{ readinessText(a) }}
                </div>
              </div>

              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-settings-2"
                :disabled="a.enabled"
                @click="openEnvModal(a.provider)"
              />
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <USelect
                class="w-auto shrink-0"
                :model-value="a.channel"
                :items="channelOptions"
                valueKey="value"
                labelKey="label"
                size="sm"
                :disabled="a.enabled"
                @update:model-value="(v: any) => updateAgreementChannel(a.provider, v)"
              />

              <UButton
                class="whitespace-nowrap"
                size="sm"
                :variant="a.enabled ? 'soft' : 'solid'"
                :color="a.enabled ? 'neutral' : 'primary'"
                @click="a.enabled ? toggleAgreement(a.provider, false) : openEnvModal(a.provider)"
              >
                {{ a.enabled ? 'Deaktiver' : 'Aktiver' }}
              </UButton>
            </div>

            <div
              v-if="a.channel === 'rest'"
              class="pt-3 border-t border-default space-y-2"
            >
              <div class="text-xs font-semibold uppercase tracking-wide text-muted">Konti til API</div>
              <div class="text-xs text-muted">
                Angiv IBAN(s) som må hentes via API. Dette er pr. udbyder (ikke pr. kanal).
              </div>

              <div v-if="(a.allowlistIbans?.length ?? 0)" class="flex flex-wrap gap-1.5">
                <UBadge
                  v-for="iban in a.allowlistIbans"
                  :key="iban"
                  color="neutral"
                  variant="subtle"
                  class="gap-1"
                >
                  <span class="font-mono text-[11px]">{{ iban }}</span>
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-x"
                    @click="removeAllowlistIban(a.provider, iban)"
                  />
                </UBadge>
              </div>
              <div v-else class="text-xs text-muted">
                Ingen konti tilføjet endnu.
              </div>

              <div class="flex items-center gap-2">
                <UInput
                  v-model="allowlistDraftIbanByProvider[a.provider]"
                  placeholder="Tilføj IBAN…"
                  class="flex-1"
                />
                <UButton
                  size="sm"
                  color="neutral"
                  variant="soft"
                  @click="addAllowlistIban(a.provider)"
                >
                  Tilføj
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="globalFilterValue"
          class="max-w-sm"
          icon="solar:magnifer-bold-duotone"
          placeholder="Søg efter en bankkonto..."
        />
      </div>

      <UTable
        ref="table"
        v-model:global-filter="globalFilterValue"
        v-model:pagination="pagination"
        v-model:sorting="sorting"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="shrink-0"
        :data="rows"
        :columns="columns"
        :loading="pending || refreshingAccounts"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }"
      />

      <div class="flex items-center border-t border-default pt-4 mt-auto">
        <div class="flex-1 text-sm text-muted">
          <template v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
            {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} af
            {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} række(r) valgt
          </template>
        </div>
        <div class="flex justify-center flex-1">
          <UPagination
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>
        <div class="flex-1"></div>
      </div>
      
      <BankingAccountModal
        v-model:open="modalOpen"
        :account-id="editingAccountId"
        @saved="handleSaved"
      />

        <UModal v-model:open="envModalOpen">
          <template #header>
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-lg font-semibold">Aktivér {{ selectedAgreement ? providerLabel(selectedAgreement.provider) : 'bankaftale' }}</div>
                <div class="text-sm text-muted">
                  {{ selectedAgreement ? readinessText(selectedAgreement) : '—' }}
                </div>
              </div>

              <UButton
                icon="i-lucide-refresh-cw"
                color="neutral"
                variant="ghost"
                @click="refreshAgreements()"
              />
            </div>
          </template>

          <template #body>
            <div v-if="!selectedAgreement" class="text-sm text-muted">
              Kunne ikke finde bankaftalen.
            </div>

            <div v-else class="space-y-4">
              <div class="text-sm text-muted">
                Viser kun hvilke env keys der er sat/mangler — ikke deres værdier.
              </div>

              <div v-if="selectedEnvRequirements.length" class="rounded-md border border-default">
                <div class="px-3 py-2 border-b border-default text-xs font-semibold uppercase tracking-wide text-muted">
                  Miljøvariabler
                </div>

                <div class="divide-y divide-default">
                  <div
                    v-for="(req, idx) in selectedEnvRequirements"
                    :key="idx"
                    class="px-3 py-2"
                  >
                    <template v-if="req.type === 'key'">
                      <div class="flex items-center justify-between gap-3">
                        <div class="font-mono text-xs">{{ req.key }}</div>
                        <UBadge
                          v-if="req.invalid"
                          color="error"
                          variant="subtle"
                        >
                          Ugyldig
                        </UBadge>
                        <UBadge
                          v-else
                          :color="req.present ? 'success' : 'error'"
                          variant="subtle"
                        >
                          {{ req.present ? 'Sat' : 'Mangler' }}
                        </UBadge>
                      </div>
                    </template>

                    <template v-else>
                      <div class="flex items-center justify-between gap-3">
                        <div class="text-sm font-medium">{{ req.label }}</div>
                        <UBadge
                          :color="req.satisfied ? 'success' : 'error'"
                          variant="subtle"
                        >
                          {{ req.satisfied ? 'OK' : 'Mangler' }}
                        </UBadge>
                      </div>

                      <div class="mt-2 grid gap-1">
                        <div
                          v-for="k in req.keys"
                          :key="k"
                          class="flex items-center justify-between gap-3"
                        >
                          <div class="font-mono text-xs text-muted">{{ k }}</div>
                          <UBadge
                            v-if="req.invalidKeys?.includes(k)"
                            color="error"
                            variant="subtle"
                          >
                            Ugyldig
                          </UBadge>
                          <UBadge
                            v-else
                            :color="req.presentKeys?.includes(k) ? 'success' : 'error'"
                            variant="subtle"
                          >
                            {{ req.presentKeys?.includes(k) ? 'Sat' : 'Mangler' }}
                          </UBadge>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>

              <div v-else class="text-sm text-muted">
                Ingen env-krav er registreret for denne udbyder.
              </div>

              <div class="flex justify-between gap-2 pt-4 mt-4 border-t border-default">
                <UButton
                  label="Luk"
                  variant="soft"
                  color="neutral"
                  @click="envModalOpen = false"
                />

                <UButton
                  color="primary"
                  :disabled="!canEnableSelectedAgreement"
                  @click="activateSelectedAgreement"
                >
                  Aktivér
                </UButton>
              </div>
            </div>
          </template>
        </UModal>
    </template>
  </UDashboardPanel>
</template>
