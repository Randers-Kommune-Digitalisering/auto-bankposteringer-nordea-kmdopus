<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row, SortingState } from '@tanstack/table-core'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { AccountSelectSchema } from '~/lib/db/schema'

interface BankingMetadataResponse {
  serviceProvider: string
  servicerProviderId: string
  passcode: string
}

const BANK_ACCOUNTS_QUERY_KEY = 'bank-accounts' as const

const toast = useToast()
const table = useTemplateRef('table')
const globalFilterValue = ref('')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UIcon = resolveComponent('UIcon')

const modalOpen = ref(false)
const editingAccountId = ref<string | null>(null)
const deletingAccountId = ref<string | null>(null)
const refreshingAccounts = ref(false)
const sorting = ref<SortingState>([])

const { data: accounts, pending, refresh: refreshBankAccounts } = await useFetch<AccountSelectSchema[]>(
  '/api/bank-accounts',
  {
    key: BANK_ACCOUNTS_QUERY_KEY,
    default: () => []
  }
)

const { data: bankingMetadata } = await useFetch<BankingMetadataResponse>(
  '/api/settings/banking-metadata',
  {
    key: 'banking-metadata',
    default: () => ({
      serviceProvider: '',
      servicerProviderId: '',
      passcode: ''
    })
  }
)

const bankingMetadataFields = computed(() => [
  { label: 'Service Provider', value: bankingMetadata.value?.serviceProvider ?? '—' },
  { label: 'Servicer Provider ID', value: bankingMetadata.value?.servicerProviderId ?? '—' },
  { label: 'Passcode', value: bankingMetadata.value?.passcode ?? '—' }
])

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
      label: 'Rediger bankkonto',
      icon: 'solar:ruler-cross-pen-bold-duotone',
      onSelect() { handleEditAccount(row) }
    },
    { type: 'separator' },
    {
      label: 'Slet bankkonto',
      icon: 'solar:trash-bin-trash-bold-duotone',
      color: 'error',
      disabled: deletingAccountId.value === row.original.id,
      onSelect() { handleDeleteAccount(row) }
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
  editingAccountId.value = null
  modalOpen.value = true
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
          <UButton
            class="font-bold rounded-full"
            icon="i-lucide-plus"
            :label="'Ny bankkonto'"
            @click="handleAddAccount"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <section class="mb-6 space-y-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Bank metadata</p>
          <p class="text-sm text-muted">Værdierne kommer fra din .env fil og er kun til læsning.</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="field in bankingMetadataFields"
            :key="field.label"
            class="flex flex-col gap-1"
          >
            <span class="text-xs font-semibold text-muted">{{ field.label }}</span>
            <UInput
              :model-value="field.value"
              readonly
              class="font-mono text-sm"
            />
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
    </template>
  </UDashboardPanel>
</template>
