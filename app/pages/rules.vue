<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import type { Row, SortingFn, SortingState } from '@tanstack/table-core'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { RuleListDto } from '~/lib/db/schema/index'
import { ruleTypeEnum, ruleStatusEnum } from '~/lib/db/schema/index'
import useFlattenArray from '~/composables/useFlattenArray'

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')
const UCheckbox = resolveComponent('UCheckbox')
const UIcon = resolveComponent('UIcon')

const classBadgeColumn = 'flex flex-wrap gap-1'
const classMultiplePropsColumn = 'flex flex-col gap-1 text-sm'

const toast = useToast()
const table = useTemplateRef('table')
const modalOpen = ref(false)
const editingRuleId = ref<number | null>(null)
const globalFilterValue = ref('')
const deletingRuleId = ref<number | null>(null)

// API calls
const { data: rules, status } = await useFetch<RuleListDto[]>('/api/rules', {
  key: 'rules',
  method: 'GET'
})

// Type labels
const typeLabelMap = Object.fromEntries(Object.values(ruleTypeEnum).map(v => [v, upperFirst(v)]))

// Normaliser data til RuleTableRow
const rows = computed<RuleListDto[]>(() => {
  const flatRules = useFlattenArray<RuleListDto>(rules.value || [])

  return flatRules.map(rule => ({
    ...rule,
    bankAccountIds: rule.relatedBankAccounts || []
  }))
})

const compareStrings = (a?: string | null, b?: string | null) =>
  (a ?? '').localeCompare(b ?? '', 'da', { sensitivity: 'base', numeric: true })

const normalizeArrayValue = (value?: string[] | null) => (value ?? []).join(' ').trim()

const stringArraySortingFn: SortingFn<RuleListDto> = (rowA, rowB, columnId) => {
  const valueA = rowA.getValue<string[] | undefined>(columnId)
  const valueB = rowB.getValue<string[] | undefined>(columnId)
  return compareStrings(normalizeArrayValue(valueA), normalizeArrayValue(valueB))
}

function getHeader(column: Column<RuleListDto>, label: string) {
  const isSorted = column.getIsSorted()

  return h(
    UDropdownMenu,
    {
      content: {
        align: 'start'
      },
      'aria-label': 'Actions dropdown',
      items: [
        {
          label: 'Sortér stigende',
          type: 'checkbox',
          icon: 'i-lucide-arrow-up-narrow-wide',
          checked: isSorted === 'asc',
          onSelect: () => {
            if (isSorted === 'asc') {
              column.clearSorting()
            } else {
              column.toggleSorting(false)
            }
          }
        },
        {
          label: 'Sortér faldende',
          icon: 'i-lucide-arrow-down-wide-narrow',
          type: 'checkbox',
          checked: isSorted === 'desc',
          onSelect: () => {
            if (isSorted === 'desc') {
              column.clearSorting()
            } else {
              column.toggleSorting(true)
            }
          }
        }
      ]
    },
    () =>
      h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label,
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5 data-[state=open]:bg-elevated',
        'aria-label': `Sortér efter ${isSorted === 'asc' ? 'faldende' : 'stigende'}`
      })
  )
}

const sorting = ref([
  {
    id: 'id',
    desc: false
  }
])

// Dropdown-menu for actions
function getRowItems(row: Row<RuleListDto>) {
  return [
    { type: 'label', label: 'Handlinger' },
    {
      label: 'Rediger regel',
      icon: 'solar:ruler-cross-pen-bold-duotone',
      onSelect() { handleEditRule(row) }
    },
    { type: 'separator' },
    {
      label: 'Slet regel',
      icon: 'solar:trash-bin-trash-bold-duotone',
      color: 'error',
      disabled: deletingRuleId.value === row.original.id,
      onSelect() { handleDeleteRule(row) }
    }
  ]
}

const columnVisibility = ref({
  status: false,
  type: false,
  relatedBankAccounts: false,
  references_flat: false,
  counterparties_flat: false,
  classification_flat: false,
  ruleTags_flat: false
})

const columns: TableColumn<RuleListDto>[] = [
  { // Selekteringskolonne
    id: 'Vælg',
    enableHiding: false,
    enableSorting: false,
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Vælg alle'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Vælg række'
      })
  },
  { // RuleID
    accessorKey: 'id',
    header: ({ column }) => getHeader(column, 'ID'),
    enableSorting: true
  },
  { // Ruletags (badges)
    accessorKey: 'ruleTags',
    header: ({ column }) => getHeader(column, 'Tags'),
    sortingFn: stringArraySortingFn,
    cell: ({ row }) => {
        return h(
            'div',
            { class: classBadgeColumn },
            row.original.ruleTags?.map(tag =>
                h(UBadge, { class: 'capitalize', variant: 'solid', color: 'neutral' }, () => tag)
            )
        )
    }
  },
  { // Type (hidden, kun til filtrering)
    accessorKey: 'type',
    enableHiding: false,
    header: ({ column }) => getHeader(column, 'Type'),
    cell: ({ row }) => row.original.type
  },
  { // Status (hidden, kun til filtrering)
    accessorKey: 'status',
    enableHiding: false,
    header: ({ column }) => getHeader(column, 'Status'),
    cell: ({ row }) => row.original.status
  },
  { // Konto (hidden, kun til filtrering)
    accessorKey: 'relatedBankAccounts',
    enableHiding: false,
    header: ({ column }) => getHeader(column, 'Konti'),
    sortingFn: stringArraySortingFn,
    cell: ({ row }) => row.original.relatedBankAccounts.join(', ')
  },
  { // Stamdata
    id: 'Stamdata',
    header: 'Stamdata',
    cell: ({ row }) => {
      const statusColor = { aktiv: 'text-green-600', inaktiv: 'text-red-600' }[row.original.status]
      const typeLabel = typeLabelMap[row.original.type]

      return h('div', { class: classMultiplePropsColumn }, [
        h('p', { class: 'font-medium' }, [
          h('span', { class: 'text-highlighted' }, 'Status: '),
          h('span', { class: statusColor }, row.original.status === 'aktiv' ? 'Aktiv' : 'Inaktiv')
        ]),
        h('p', { class: 'font-medium' }, [
          h('span', { class: 'text-highlighted' }, 'Konti: '),
          h('span', {}, row.original.relatedBankAccounts.join(', '))
        ]),
        h('p', { class: 'font-medium' }, [
          h('span', { class: 'text-highlighted' }, 'Type: '),
          h('span', {}, typeLabel)
        ])
      ])
    }
  },
  { // Matching references
    id: 'matching.references',
    header: ({ column }) => getHeader(column, 'Fritekst'),
    accessorFn: row => row.matching.references,
    sortingFn: stringArraySortingFn,
    cell: ({ row }) =>
      h('div', { class: classBadgeColumn },
        row.original.matching.references.map(text =>
          h(UBadge, { class: 'capitalize', variant: 'subtle', color: 'primary' }, () => text)
        )
      )
  },
  { // Matching counterparties
    id: 'matching.counterparties',
    header: ({ column }) => getHeader(column, 'Part'),
    accessorFn: row => row.matching.counterparties,
    sortingFn: stringArraySortingFn,
    cell: ({ row }) =>
      h('div', { class: classBadgeColumn },
        row.original.matching.counterparties.map(text =>
          h(UBadge, { class: 'capitalize', variant: 'subtle', color: 'secondary' }, () => text)
        )
      )
  },
  { // Matching classification
    id: 'matching.classification',
    header: ({ column }) => getHeader(column, 'Transaktionstype'),
    accessorFn: row => row.matching.classification,
    sortingFn: stringArraySortingFn,
    cell: ({ row }) =>
      h('div', { class: classBadgeColumn },
        row.original.matching.classification.map(text =>
          h(UBadge, { class: 'capitalize', variant: 'subtle', color: 'warning' }, () => text)
        )
      )
  },
  { // Datoer
    id: 'Datoer',
    header: 'Datoer',
    cell: ({ row }) => {
      const formatDate = (date: Date | undefined | null) => {
        if (!date) return 'N/A'
        return new Date(date).toLocaleDateString('da-DK', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }

      return h('div', { class: classMultiplePropsColumn }, [
        h('p', { class: 'font-medium' }, [
          h('span', { class: 'text-highlighted' }, 'Senest anvendt: '),
          h('span', {}, formatDate(row.original.lastUsed))
        ]),
        h('p', { class: 'font-medium' }, [
          h('span', { class: 'text-highlighted' }, 'Oprettet: '),
          h('span', {}, formatDate(row.original.createdAt))
        ]),
        h('p', { class: 'font-medium' }, [
          h('span', { class: 'text-highlighted' }, 'Opdateret: '),
          h('span', {}, formatDate(row.original.updatedAt))
        ])
      ])
    }
  },
  { // Match-felter til filtrering
    id: 'references_flat',
    accessorFn: row => row.matching.references.join(' '),
    enableHiding: false,
    enableSorting: false,
    cell: () => undefined
  },
  { // Hidden matching columns to make them searchable
    id: 'counterparties_flat',
    accessorFn: row => row.matching.counterparties.join(' '),
    enableHiding: false,
    enableSorting: false,
    cell: () => undefined
  },
  {
    id: 'classification_flat',
    accessorFn: row => row.matching.classification.join(' '),
    enableHiding: false,
    enableSorting: false,
    cell: () => undefined
  },
  {
    id: 'ruleTags_flat',
    accessorFn: row => row.ruleTags?.join(' ') ?? '',
    enableHiding: false,
    enableSorting: false,
    cell: () => undefined
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

const statusFilter = ref('alle')
const typeFilter = ref('alle')

const statusItems = [
  { label: 'Alle', value: 'alle' },
  ...Object.values(ruleStatusEnum).map(t => ({ label: upperFirst(t), value: t }))
]

const typeItems = [
  { label: 'Alle', value: 'alle' },
  ...Object.values(ruleTypeEnum).map(t => ({ label: upperFirst(t), value: t }))
]

const statusDropdownItems = computed(() =>
  statusItems.map(item => ({
    ...item,
    type: 'button' as const,
    onSelect() {
      statusFilter.value = item.value
    }
  }))
)

const typeDropdownItems = computed(() =>
  typeItems.map(item => ({
    ...item,
    type: 'button' as const,
    onSelect() {
      typeFilter.value = item.value
    }
  }))
)

function bindEnumFilter(columnId: string, filterRef: Ref<string>) {
  watch(filterRef, val => {
    const col = table.value?.tableApi?.getColumn(columnId)
    col?.setFilterValue(val === 'alle' ? undefined : val)
  })
}

bindEnumFilter('status', statusFilter)
bindEnumFilter('type', typeFilter)

const pagination = ref({ pageIndex: 0, pageSize: 20 })

function handleAddRule() {
  editingRuleId.value = null
  modalOpen.value = true
}

function handleEditRule(row: Row<RuleListDto>) {
  editingRuleId.value = row.original.id
  modalOpen.value = true
}

function handleSaved() {
  refreshNuxtData('rules')
  modalOpen.value = false
}

async function handleDeleteRule(row: Row<RuleListDto>) {
  const ruleId = row.original.id
  deletingRuleId.value = ruleId

  try {
    await $fetch(`/api/rule/${ruleId}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Regel slettet',
      description: `Regel #${ruleId} er blevet fjernet.`
    })

    rules.value = (rules.value ?? []).filter(rule => rule.id !== ruleId)
    await refreshNuxtData('rules')
  } catch (error) {
    console.error('Fejl ved sletning af regel', error)
    toast.add({
      title: 'Fejl ved sletning',
      description: 'Kunne ikke slette reglen. Prøv igen senere.',
      color: 'error'
    })
  } finally {
    deletingRuleId.value = null
  }
}
</script>

<template>
  <UDashboardPanel id="regler">
    <template #header>
      <UDashboardNavbar title="Konteringsregler">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <RulesRuleModal
            v-model:open="modalOpen"
            @saved="handleSaved"
            @click="handleAddRule"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="globalFilterValue"
          class="max-w-sm"
          icon="solar:magnifer-bold-duotone"
          placeholder="Søg efter en regel..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <!-- Filtrering på status -->
          <UDropdownMenu
            :items="statusDropdownItems"
            :content="{ align: 'start' }"
          >
            <UButton
              :label="`Status: ${statusItems.find(i => i.value === statusFilter)?.label}`"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-chevron-down"
            />
          </UDropdownMenu>

          <!-- Filtrering på type -->
          <UDropdownMenu 
            :items="typeDropdownItems"
            :content="{ align: 'start' }"
          >
            <UButton
              :label="`Type: ${typeItems.find(i => i.value === typeFilter)?.label}`"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-chevron-down"
            />
          </UDropdownMenu>

          <!-- Tilføj/fjern kolonner i visningen -->
          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column: any) => column.getCanHide())
                .map((column: any) => ({
                  label: upperFirst(column.id),
                  type: 'checkbox' as const,
                  checked: column.getIsVisible(),
                  onUpdateChecked(checked: boolean) {
                    table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  }
                }))
            "
            :content="{ align: 'end' }"
          >
            <UButton
              label="Vis kolonner"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-settings-2"
            />
          </UDropdownMenu>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:global-filter="globalFilterValue"
        v-model:column-visibility="columnVisibility"
        v-model:pagination="pagination"
        v-model:sorting="sorting"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="shrink-0"
        :data="rows"
        :columns="columns"
        :loading="status === 'pending'"
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
    </template>
  </UDashboardPanel>
</template>