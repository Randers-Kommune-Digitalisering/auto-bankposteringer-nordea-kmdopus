<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { SortingState } from '@tanstack/table-core'
import { getPaginationRowModel } from '@tanstack/table-core'
import BankingAccountModal from '~/components/banking/AccountModal.vue'

type BankingAccountUnionDto = {
  provider: 'danskebank' | 'nordea' | 'bankconnect'
  iban: string
  currency: string | null
  name: string | null
  statuskonto: string | null
  observed: boolean
  configuredForApi: boolean
  observedAccountId: string | null
}

type AllowlistAccount = { iban: string; name: string | null; statuskonto: string | null }

type NordeaRestAuthStatus = {
  provider: 'nordea'
  channel: 'rest'
  status: string | null
  accessId: string | null
  updatedAt: string | null
  accessTokenExpiresAt: string | null
  hasAccessToken: boolean
  hasRefreshToken: boolean
  message?: string
}

type BankingAgreement = {
  provider: 'danskebank' | 'nordea' | 'bankconnect'
  enabled: boolean
  channel: 'iso20022' | 'rest'
  allowlistAccounts?: AllowlistAccount[]
  certificate?:
    | { status: 'not_applicable'; message: string }
    | {
        provider: string
        channel: string
        status: 'missing' | 'invalid'
        message: string
      }
    | {
        provider: string
        channel: string
        status: 'ok' | 'expires_soon' | 'expired'
        expiresAt: string
        daysRemaining: number
        fingerprintSha256Hex?: string
      }
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
const UIcon = resolveComponent('UIcon')

const channelOptions = [
  { label: 'ISO 20022', value: 'iso20022' as const },
  { label: 'REST API', value: 'rest' as const },
]

const channelLabel = (c: BankingAgreement['channel']) => {
  if (c === 'rest') return 'REST API'
  return 'ISO 20022'
}

const nordeaRestAuthPending = ref(false)
const nordeaRestAuthStatus = ref<NordeaRestAuthStatus | null>(null)

const accountModalOpen = ref(false)
const accountModalMode = ref<'observed' | 'configured'>('observed')
const editingObservedAccountId = ref<string | null>(null)
const configuredDraft = ref<
  | { provider: 'danskebank' | 'nordea' | 'bankconnect'; iban: string; name?: string | null; statuskonto?: string | null }
  | null
>(null)

function formatNordeaRestAuthStatus(status: NordeaRestAuthStatus | null): string {
  if (!status) return '—'
  const s = status.status ?? 'UKENDT'
  if (status.hasAccessToken) return `${s} (token OK)`
  if (status.hasRefreshToken) return `${s} (refresh OK)`
  return s
}

async function refreshNordeaRestAuthStatus(refresh = true) {
  if (nordeaRestAuthPending.value) return
  nordeaRestAuthPending.value = true
  try {
    const q = refresh ? '?refresh=1' : ''
    nordeaRestAuthStatus.value = await $fetch<NordeaRestAuthStatus>(`/api/banking-agreements/nordea/authstatus${q}`)
  } catch (err: any) {
    toast.add({
      title: 'Kan ikke hente auth-status',
      description: String(err?.data?.statusMessage ?? err?.statusMessage ?? err?.message ?? err),
      color: 'error',
    })
  } finally {
    nordeaRestAuthPending.value = false
  }
}

async function requestNordeaRestReauth() {
  if (nordeaRestAuthPending.value) return
  nordeaRestAuthPending.value = true
  try {
    const res = await $fetch<NordeaRestAuthStatus>(`/api/banking-agreements/nordea/reauth`, { method: 'POST' })
    nordeaRestAuthStatus.value = res
    toast.add({
      title: '2FA/autorisation startet',
      description: res?.message ?? 'Godkend i Nordea, og opdater status bagefter.',
      color: 'success',
    })
  } catch (err: any) {
    toast.add({
      title: 'Kan ikke starte reauth',
      description: String(err?.data?.statusMessage ?? err?.statusMessage ?? err?.message ?? err),
      color: 'error',
    })
  } finally {
    nordeaRestAuthPending.value = false
  }
}

const refreshingAccounts = ref(false)
const sorting = ref<SortingState>([])

const envModalOpen = ref(false)
const envModalProvider = ref<BankingAgreement['provider'] | null>(null)

const { data: accounts, pending, refresh: refreshBankAccounts } = useFetch<BankingAccountUnionDto[]>(
  '/api/banking-accounts',
  {
    key: BANK_ACCOUNTS_QUERY_KEY,
    default: () => [],
    lazy: true,
  },
)

const { data: agreements, refresh: refreshAgreements } = useFetch<BankingAgreement[]>(
  '/api/banking-agreements',
  {
    key: 'banking-agreements',
    default: () => [],
    lazy: true,
  },
)

// Keep Nuxt's client-side cache for these endpoints; explicit refreshes are triggered after mutations.

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
    return 'Mangler env'
  }
  return '—'
}

function certificateText(a: BankingAgreement): string {
  const c: any = a.certificate
  if (!c) return '—'
  if (c.status === 'not_applicable') return '—'
  if (c.status === 'missing') return 'Certifikat mangler'
  if (c.status === 'invalid') return 'Certifikat ugyldigt'
  if (c.status === 'expired') return `Certifikat udløbet (${c.expiresAt?.slice(0, 10) ?? ''})`
  if (c.status === 'expires_soon') return `Certifikat udløber snart (${c.daysRemaining} dage)`
  if (c.status === 'ok') return `Certifikat OK (${c.expiresAt?.slice(0, 10) ?? ''})`
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

const refreshAccounts = async () => {
  refreshingAccounts.value = true
  try {
    await refreshBankAccounts()
  } finally {
    refreshingAccounts.value = false
  }
}

const rows = computed(() => [...(accounts.value ?? [])])

const configuredProviders = computed(() =>
  (agreements.value ?? [])
    .filter((a) => a.channel === 'rest')
    .map((a) => a.provider),
)

function openNewApiAccountModal() {
  accountModalMode.value = 'configured'
  editingObservedAccountId.value = null
  configuredDraft.value = null
  accountModalOpen.value = true
}

function openEditObservedAccountModal(accountId: string) {
  accountModalMode.value = 'observed'
  configuredDraft.value = null
  editingObservedAccountId.value = accountId
  accountModalOpen.value = true
}

function openEditConfiguredAccountModal(row: BankingAccountUnionDto) {
  accountModalMode.value = 'configured'
  editingObservedAccountId.value = null
  configuredDraft.value = {
    provider: row.provider,
    iban: row.iban,
    name: row.name,
    statuskonto: row.statuskonto,
  }
  accountModalOpen.value = true
}

async function removeConfiguredAccount(row: BankingAccountUnionDto) {
  const ok = window.confirm(`Er du sikker på at du vil fjerne API-kontoen ${row.iban} (${providerLabel(row.provider)})?`)
  if (!ok) return
  try {
    await $fetch(`/api/banking-agreements/${row.provider}/allowlist/${encodeURIComponent(row.iban)}`, {
      method: 'DELETE',
    })
    await refreshBankAccounts()
    await refreshAgreements()
    toast.add({ title: 'Konto fjernet', description: `${row.iban} er fjernet fra allowlist.` })
  } catch (err: any) {
    toast.add({
      title: 'Kan ikke fjerne konto',
      description: String(err?.data?.statusMessage ?? err?.statusMessage ?? err?.message ?? err),
      color: 'error',
    })
  }
}

async function handleAccountModalSaved() {
  editingObservedAccountId.value = null
  configuredDraft.value = null
  accountModalOpen.value = false
  await refreshAccounts()
  await refreshAgreements()
}

const createSortableHeader = (label: string) => ({ column }: { column: any }) => {
  const sortingState = column.getIsSorted?.()
  const iconName = sortingState === 'asc'
    ? 'solar:alt-arrow-up-bold-duotone'
    : sortingState === 'desc'
      ? 'solar:alt-arrow-down-bold-duotone'
      : 'solar:sort-vertical-bold-duotone'

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

const columns: TableColumn<BankingAccountUnionDto>[] = [
  {
    accessorKey: 'iban',
    id: 'iban',
    header: createSortableHeader('IBAN'),
    enableSorting: true,
    cell: ({ row }) => {
      const v = String((row.original as any).iban ?? '')
      return h('span', { class: 'font-mono text-xs' }, v.toUpperCase())
    }
  },
  {
    accessorKey: 'currency',
    id: 'currency',
    header: createSortableHeader('Valuta'),
    enableSorting: true,
    cell: ({ row }) => String((row.original as any).currency ?? '—')
  },
  { // name
    accessorKey: 'name',
    id: 'name',
    header: createSortableHeader('Kaldenavn'),
    enableSorting: true,
  },
  { // provider
    accessorKey: 'provider',
    id: 'provider',
    header: createSortableHeader('Udbyder'),
    enableSorting: true,
    cell: ({ row }) => {
      const p = row.original.provider as any
      if (p === 'danskebank') return 'Danske Bank'
      if (p === 'nordea') return 'Nordea'
      if (p === 'bankconnect') return 'Bank Connect'
      return String(p ?? '')
    }
  },
  {
    accessorKey: 'statuskonto',
    id: 'statuskonto',
    header: createSortableHeader('Statuskonto'),
    enableSorting: true,
    cell: ({ row }) => String((row.original as any).statuskonto ?? '—')
  },
  {
    id: 'source',
    header: 'Kilde',
    enableSorting: false,
    cell: ({ row }) => {
      const r = row.original
      const labels: string[] = []
      if (r.configuredForApi) labels.push('API')
      if (r.observed) labels.push('Observeret')
      return labels.length ? labels.join(' • ') : '—'
    }
  },
  {
    id: 'actions',
    enableSorting: false,
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-right flex items-center justify-end gap-1' },
        [
          h(UButton, {
            icon: 'solar:ruler-cross-pen-bold-duotone',
            color: 'neutral',
            variant: 'ghost',
            onClick: () => {
              const r: any = row.original
              if (r.observedAccountId) return openEditObservedAccountModal(String(r.observedAccountId))
              return openEditConfiguredAccountModal(row.original)
            },
          }),
          row.original.configuredForApi
            ? h(UButton, {
                icon: 'solar:trash-bin-trash-bold-duotone',
                color: 'error',
                variant: 'ghost',
                onClick: () => removeConfiguredAccount(row.original),
              })
            : null,
        ],
      ),
  },
]

const pagination = ref({ pageIndex: 0, pageSize: 20 })
</script>

<template>
  <UDashboardPanel id="settings-banking">
    <template #header>
      <UDashboardNavbar title="Bankintegration">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            v-if="configuredProviders.length"
            class="font-bold rounded-full"
            icon="solar:notes-bold-duotone"
            label="Ny bankkonto"
            @click="openNewApiAccountModal"
          />
          <div v-else />
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
                <div class="text-xs text-muted">
                  {{ certificateText(a) }}
                </div>
              </div>

              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="solar:settings-bold-duotone"
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
              <div v-if="a.provider === 'nordea'" class="space-y-2">
                <div class="text-xs font-semibold uppercase tracking-wide text-muted">2FA / autorisation</div>
                <div class="text-xs text-muted">
                  Nordeas REST API kræver godkendelse i Nordea ID
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <UBadge
                    color="neutral"
                    variant="subtle"
                    class="text-[11px]"
                  >
                    Status: {{ formatNordeaRestAuthStatus(nordeaRestAuthStatus) }}
                  </UBadge>

                  <UButton
                    size="xs"
                    color="neutral"
                    variant="soft"
                    :loading="nordeaRestAuthPending"
                    icon="solar:refresh-bold-duotone"
                    @click="refreshNordeaRestAuthStatus(true)"
                  >
                    Opdater status
                  </UButton>

                  <UButton
                    size="xs"
                    color="neutral"
                    variant="soft"
                    :loading="nordeaRestAuthPending"
                    icon="solar:restart-bold-duotone"
                    @click="requestNordeaRestReauth"
                  >
                    Genstart 2FA
                  </UButton>
                </div>

                <div v-if="nordeaRestAuthStatus?.updatedAt" class="text-xs text-muted">
                  Sidst opdateret: {{ nordeaRestAuthStatus.updatedAt }}
                </div>
                <div v-if="nordeaRestAuthStatus?.accessTokenExpiresAt" class="text-xs text-muted">
                  Token udløber: {{ nordeaRestAuthStatus.accessTokenExpiresAt }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UiFloatingLabelInput
          v-model="globalFilterValue"
          class="max-w-sm"
          color="primary"
          variant="outline"
          :ui="{ base: 'ring-primary/50 text-primary focus-visible:ring-primary' }"
          trailing-icon="solar:magnifer-bold-duotone"
          label="Søg..."
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
        v-model:open="accountModalOpen"
        :account-id="editingObservedAccountId"
        :mode="accountModalMode"
        :configured-draft="configuredDraft"
        :configured-providers="configuredProviders"
        @saved="handleAccountModalSaved"
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
                icon="solar:refresh-bold-duotone"
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
