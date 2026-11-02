<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { VNode } from 'vue'
import { upperFirst } from 'scule'
import type { Column, SortingFn, SortingState } from '@tanstack/table-core'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { RuleListDto } from '~/lib/db/schema/rule'
import { ruleTypeEnum, ruleStatusEnum } from '~/lib/db/schema/enums'
import { useDebouncedString } from '~/composables/useDebouncedString'
import useFlattenArray from '~/composables/useFlattenArray'
import { fuzzyRankRows } from '~/lib/search/fuzzyRanking'
import { useRuleTags } from '~/composables/useRuleTags'
import { useTransactionTypeCatalog } from '~/composables/useTransactionTypeCatalog'
import { matchCategoryLabels } from '~/lib/rules/match-config'
import { TRANSACTION_BADGE_COLUMN_CLASS } from '~/lib/presenters/transactionBadgeStyles'
import {
  activateClickableTableRowOnKeydown,
  clickableTableRowsBodyClass,
  createTableRowSelectHandler,
} from '~/composables/useClickableTableRows'

const appConfig = useAppConfig()
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')
const UCheckbox = resolveComponent('UCheckbox')
const UIcon = resolveComponent('UIcon')
const UTooltip = resolveComponent('UTooltip')

const classBadgeColumn = 'flex flex-wrap gap-1.5'
const classMultiplePropsColumn = 'flex flex-col gap-0.5 text-sm'

const toast = useToast()
const table = useTemplateRef('table')
const rowSelection = ref<Record<string, boolean>>({})
const modalOpen = ref(false)
const editingRuleId = ref<number | null>(null)
const bulkActionPending = ref<'download' | 'delete' | null>(null)
const bulkDeleteResult = ref<{
  deletedIds: number[]
  skipped: Array<{ ruleId: number; reason: string }>
} | null>(null)
const globalFilterValue = ref('')
const debouncedGlobalFilterValue = useDebouncedString(globalFilterValue, { delayMs: 300 })

const selectedAccountIds = ref<string[]>([])
const selectedTransactionTypes = ref<string[]>([])
const selectedRuleTags = ref<string[]>([])

const statusFilter = ref('alle')
const typeFilter = ref('alle')

const { ruleTags } = useRuleTags()
const { options: transactionTypeOptions } = useTransactionTypeCatalog()

// API calls
const { data: rules, status } = await useFetch<RuleListDto[]>('/api/rules', {
  key: 'rules',
  method: 'GET',
  server: false,
  deep: true,
  transform: (v) => Array.isArray(v) ? v.slice() : [],
})

// Type labels
const ruleTypeValues = ruleTypeEnum.enumValues ?? []
const ruleStatusValues = ruleStatusEnum.enumValues ?? []

const fetchedRows = computed<RuleListDto[]>(() => useFlattenArray<RuleListDto>(rules))
const selectedRuleIds = computed(() =>
  Object.entries(rowSelection.value)
    .filter(([, selected]) => selected)
    .map(([id]) => Number(id))
    .filter(id => Number.isSafeInteger(id) && id > 0)
)

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase()
}

function ruleMatchesTransactionType(rule: RuleListDto, selectedLabel: string): boolean {
  const option = transactionTypeOptions.value.find(item => item.value === selectedLabel)
  if (!option) return false

  const values = new Set(rule.matching.classification.map(value => value.trim().toLowerCase()))
  if (values.has(option.label.trim().toLowerCase())) return true

  return option.rows.some((row) => {
    if (row.proprietary) return values.has(row.proprietary.trim().toLowerCase())

    return [row.domain, row.family, row.subFamily]
      .filter((value): value is string => Boolean(value?.trim()))
      .every(value => values.has(value.trim().toLowerCase()))
  })
}

const visibleRows = computed<RuleListDto[]>(() => {
  const q = normalizeSearchText(debouncedGlobalFilterValue.value)

  const baseRows = fetchedRows.value
    .filter((rule) => {
      if (statusFilter.value !== 'alle' && rule.status !== statusFilter.value) return false
      if (typeFilter.value !== 'alle' && rule.type !== typeFilter.value) return false

      if (selectedTransactionTypes.value.length && !selectedTransactionTypes.value.some(value => ruleMatchesTransactionType(rule, value))) return false

      if (selectedRuleTags.value.length && !selectedRuleTags.value.some(tag => (rule.ruleTags ?? []).includes(tag))) return false

      if (selectedAccountIds.value.length) {
        const hasMatch = (rule.relatedBankAccounts || []).some((id) => selectedAccountIds.value.includes(id))
        if (!hasMatch) return false
      }

      return true
    })
    .slice()

  return fuzzyRankRows({
    rows: baseRows,
    query: q,
    getValues: (rule) => [
      rule.id,
      rule.type,
      rule.status,
      ...(rule.relatedBankAccounts || []),
      ...(rule.ruleTags || []),
      ...(rule.matching?.references || []),
      ...(rule.matching?.counterparties || []),
      ...(rule.matching?.classification || []),
    ],
    tieBreaker: (a, b) => Number(a.id) - Number(b.id),
  })
})

const rulesTableKey = computed(() => visibleRows.value.map(rule => String(rule.id)).join('|'))

const compareStrings = (a?: string | null, b?: string | null) =>
  (a ?? '').localeCompare(b ?? '', 'da', { sensitivity: 'base', numeric: true })

const normalizeArrayValue = (value?: string[] | null) => (value ?? []).join(' ').trim()

const stringArraySortingFn: SortingFn<RuleListDto> = (rowA, rowB, columnId) => {
  const valueA = rowA.getValue<string[] | undefined>(columnId)
  const valueB = rowB.getValue<string[] | undefined>(columnId)
  return compareStrings(normalizeArrayValue(valueA), normalizeArrayValue(valueB))
}

const columnVisibilityLabelById: Record<string, string> = {
  id: 'ID',
  ruleTags: 'Tags',
  Konti: 'Bankkonti',
  ruleIndicators: 'Status og regeltype',
  'matching.references': matchCategoryLabels.reference,
  'matching.counterparties': matchCategoryLabels.counterparty,
  'matching.classification': matchCategoryLabels.transactionType,
  Datoer: 'Datoer'
}

function getColumnVisibilityLabel(column: any) {
  const id = String(column?.id ?? '')

  const mapped = columnVisibilityLabelById[id]
  if (mapped) return mapped

  const header = column?.columnDef?.header
  if (typeof header === 'string' && header.trim().length) return header

  return upperFirst(id)
}

type MatchHeaderColor = 'primary' | 'secondary' | 'warning'

const headerHoverClassByColor: Record<MatchHeaderColor, string> = {
  primary: 'hover:bg-primary/15 data-[state=open]:bg-primary/15',
  secondary: 'hover:bg-secondary/15 data-[state=open]:bg-secondary/15',
  warning: 'hover:bg-warning/15 data-[state=open]:bg-warning/15',
}

function getHeader(column: Column<RuleListDto>, label: string, matchColor?: MatchHeaderColor) {
  const isSorted = column.getIsSorted()
  const hoverClass = matchColor
    ? headerHoverClassByColor[matchColor]
    : 'hover:bg-elevated data-[state=open]:bg-elevated'

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
              icon: appConfig.ui.icons.sortAscending,
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
              icon: appConfig.ui.icons.sortDescending,
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
        trailingIcon: isSorted
          ? isSorted === 'asc'
                ? appConfig.ui.icons.sortAscending
                : appConfig.ui.icons.sortDescending
              : appConfig.ui.icons.unsorted,
        class: `w-full justify-between px-0 ${hoverClass}`,
        'aria-label': `Sortér efter ${isSorted === 'asc' ? 'faldende' : 'stigende'}`
      })
  )
}

type RuleIndicatorColor = 'neutral' | 'warning' | 'info'

const ruleIndicatorColorClasses: Record<RuleIndicatorColor, string> = {
  neutral: 'bg-elevated text-muted',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
}

function createRuleIndicator(icon: string, label: string, color: RuleIndicatorColor) {
  return h(UTooltip, { text: label }, () =>
    h(
      'span',
      {
        class: `inline-flex size-7 items-center justify-center rounded-full ${ruleIndicatorColorClasses[color]}`,
        role: 'img',
        'aria-label': label,
      },
      [
        h(UIcon, { name: icon, class: 'size-4' }),
        h('span', { class: 'sr-only' }, label),
      ]
    )
  )
}

const sorting = ref([
  {
    id: 'id',
    desc: false
  }
])

const columnVisibility = ref({
  status: false,
  type: false,
  relatedBankAccounts: false,
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
  { // Kompakte status- og typeindikatorer
    id: 'ruleIndicators',
    header: () => h('span', { class: 'sr-only' }, 'Status og regeltype'),
    enableHiding: false,
    enableSorting: false,
    meta: {
      class: {
        th: 'w-16 px-1',
        td: 'w-16 px-1',
      },
    },
    cell: ({ row }) => {
      const { status, type } = row.original
      const indicators: VNode[] = []

      if (type === 'undtagelse') {
        indicators.push(createRuleIndicator(appConfig.ui.icons.caution, 'Undtagelsesregel', 'warning'))
      } else if (type === 'engangs') {
        indicators.push(createRuleIndicator(appConfig.ui.icons.calendar, 'Engangsregel', 'info'))
      }

      return h(
        'div',
        {
          class: 'flex min-h-10 items-center justify-center gap-1',
          'data-rule-status': status,
        },
        [
          ...(status === 'inaktiv' ? [h('span', { class: 'sr-only' }, 'Inaktiv')] : []),
          ...indicators,
        ]
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
  { // Matching references
    id: 'matching.references',
    header: ({ column }) => getHeader(column, 'Reference', 'primary'),
    accessorFn: row => row.matching.references,
    sortingFn: stringArraySortingFn,
    meta: {
      class: {
        th: 'border-l-2 border-l-primary/30 bg-primary/10 text-primary-800 dark:text-primary-200',
        td: 'border-l-2 border-l-primary/30 bg-primary/5',
      },
    },
    cell: ({ row }) =>
      h('div', { class: classBadgeColumn },
        row.original.matching.references.map(text =>
          h(UBadge, { class: 'font-semibold capitalize', size: 'md', variant: 'solid', color: 'primary' }, () => text)
        )
      )
  },
  { // Matching counterparties
    id: 'matching.counterparties',
    header: ({ column }) => getHeader(column, 'Modpart', 'secondary'),
    accessorFn: row => row.matching.counterparties,
    sortingFn: stringArraySortingFn,
    meta: {
      class: {
        th: 'bg-secondary/10 text-secondary-800 dark:text-secondary-200',
        td: 'bg-secondary/5',
      },
    },
    cell: ({ row }) =>
      h('div', { class: classBadgeColumn },
        row.original.matching.counterparties.map(text =>
          h(UBadge, { class: 'font-semibold capitalize', size: 'md', variant: 'solid', color: 'secondary' }, () => text)
        )
      )
  },
  { // Matching classification
    id: 'matching.classification',
    header: ({ column }) => getHeader(column, 'Transaktionstype', 'warning'),
    accessorFn: row => row.matching.classification,
    sortingFn: stringArraySortingFn,
    meta: {
      class: {
        th: 'border-r-2 border-r-warning/30 bg-warning/10 text-warning-800 dark:text-warning-200',
        td: 'border-r-2 border-r-warning/30 bg-warning/5',
      },
    },
    cell: ({ row }) =>
      h('div', { class: classBadgeColumn },
        row.original.matching.classification.map(text =>
          h(UBadge, { class: 'font-semibold capitalize', size: 'md', variant: 'solid', color: 'warning' }, () => text)
        )
      )
  },
  { // Ruletags (secondary badges)
    accessorKey: 'ruleTags',
    header: ({ column }) => getHeader(column, 'Tags'),
    sortingFn: stringArraySortingFn,
    cell: ({ row }) =>
      h('div', { class: 'flex flex-wrap gap-1' },
        row.original.ruleTags?.map(tag =>
          h(UBadge, { class: 'capitalize', size: 'sm', variant: 'outline', color: 'neutral' }, () => tag)
        )
      )
  },
  { // Bankkonti
    id: 'Konti',
    header: ({ column }) => getHeader(column, 'Bankkonti'),
    accessorFn: row => row.relatedBankAccountNames.length
      ? row.relatedBankAccountNames
      : row.relatedBankAccounts,
    sortingFn: stringArraySortingFn,
    cell: ({ row }) => {
      const accountNames = row.original.relatedBankAccountNames.length
        ? row.original.relatedBankAccountNames
        : row.original.relatedBankAccounts

      return h(
        'div',
        { class: `${TRANSACTION_BADGE_COLUMN_CLASS} max-w-56` },
        accountNames.length
          ? accountNames.map((accountName, index) =>
              h(UBadge, {
                key: `rule-account-${index}`,
                variant: 'subtle',
                color: 'neutral',
              }, () => accountName)
            )
          : '-'
      )
    }
  },
  { // Datoer
    id: 'Datoer',
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
]

const statusItems = [
  { label: 'Alle', value: 'alle' },
  ...ruleStatusValues.map(t => ({ label: upperFirst(t), value: t }))
]

const typeItems = [
  { label: 'Alle', value: 'alle' },
  ...ruleTypeValues.map(t => ({ label: upperFirst(t), value: t }))
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

const pagination = ref({ pageIndex: 0, pageSize: 20 })

watch(
  () => [
    pagination.value.pageIndex,
    pagination.value.pageSize,
    JSON.stringify(sorting.value),
    visibleRows.value.map(rule => rule.id).join(','),
  ],
  () => {
    rowSelection.value = {}
  }
)

function handleAddRule() {
  editingRuleId.value = null
  modalOpen.value = true
}

function handleEditRule(rule: RuleListDto) {
  editingRuleId.value = rule.id
  modalOpen.value = true
}

const onRuleRowSelect = createTableRowSelectHandler(handleEditRule)

async function handleSaved() {
  await refreshNuxtData('rules')
  modalOpen.value = false
  editingRuleId.value = null
}

watch(modalOpen, (isOpen) => {
  if (!isOpen) editingRuleId.value = null
})

async function handleDeleted(ruleId: number) {
  rules.value = (rules.value ?? []).filter(rule => rule.id !== ruleId)
  modalOpen.value = false
  editingRuleId.value = null
  await refreshNuxtData('rules')
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ukendt fejl'
}

function getRuleCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'regel' : 'regler'}`
}

async function downloadSelectedRules() {
  if (!selectedRuleIds.value.length || bulkActionPending.value) return

  bulkActionPending.value = 'download'
  try {
    const query = new URLSearchParams({
      variant: 'advanced',
      ids: selectedRuleIds.value.join(','),
    })
    const csv = await $fetch<string>(`/api/rules/export?${query}`, { responseType: 'text' })
    const downloadUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = 'konteringsregler_valgte_advanced.csv'
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0)
  } catch (error) {
    toast.add({
      title: 'Kunne ikke hente markerede regler',
      description: getErrorMessage(error),
      color: 'error',
    })
  } finally {
    bulkActionPending.value = null
  }
}

async function deleteSelectedRules() {
  const ruleIds = selectedRuleIds.value
  if (!ruleIds.length || bulkActionPending.value) return

  const confirmed = window.confirm(
    `Vil du slette ${getRuleCountLabel(ruleIds.length)}? Regelversioner slettes også. Regler, der er låst eller anvendt på transaktioner, springes over.`
  )
  if (!confirmed) return

  bulkActionPending.value = 'delete'
  try {
    let result: {
      success: boolean
      deletedIds: number[]
      skipped: Array<{ ruleId: number; reason: string }>
    }

    try {
      result = await $fetch<{
        success: boolean
        deletedIds: number[]
        skipped: Array<{ ruleId: number; reason: string }>
      }>('/api/rules/bulk-delete', {
        method: 'POST',
        body: { ruleIds },
      })
    } catch (error) {
      toast.add({
        title: 'Kunne ikke slette markerede regler',
        description: getErrorMessage(error),
        color: 'error',
      })
      return
    }

    bulkDeleteResult.value = {
      deletedIds: result.deletedIds,
      skipped: result.skipped,
    }
    const deletedIds = new Set(result.deletedIds)
    rules.value = (rules.value ?? []).filter(rule => !deletedIds.has(rule.id))
    rowSelection.value = {}

    try {
      await refreshNuxtData('rules')
    } catch (error) {
      toast.add({
        title: 'Reglerne blev slettet, men listen kunne ikke opdateres',
        description: getErrorMessage(error),
        color: 'warning',
      })
    }
  } finally {
    bulkActionPending.value = null
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
          <UButton
            class="font-bold rounded-full"
            :icon="appConfig.ui.icons.notes"
            label="Ny regel"
            @click="handleAddRule"
          />
          <RulesRuleModal
            v-model:open="modalOpen"
            :rule-id="editingRuleId"
            @saved="handleSaved"
            @deleted="handleDeleted"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <FiltersRow
        v-model:account-ids="selectedAccountIds"
        v-model:search="globalFilterValue"
        v-model:transaction-type="selectedTransactionTypes"
        v-model:rule-tags="selectedRuleTags"
        :show-search="true"
        :show-transaction-type="true"
        :transaction-type-options="transactionTypeOptions"
        :show-rule-tags="true"
        :rule-tag-options="ruleTags.map(tag => ({ label: tag.id, value: tag.id }))"
        search-placeholder="Søg efter en regel..."
        account-placeholder="Alle konti"
      >
        <template #filters-secondary>
          <UFormField label="Status" class="min-w-40">
            <UDropdownMenu
              :items="statusDropdownItems"
              :content="{ align: 'start' }"
            >
              <UButton
                :label="statusItems.find(i => i.value === statusFilter)?.label"
                color="neutral"
                variant="outline"
                :trailing-icon="appConfig.ui.icons.arrowDown"
                class="w-full justify-between"
              />
            </UDropdownMenu>
          </UFormField>

          <UFormField label="Type" class="min-w-40">
            <UDropdownMenu
              :items="typeDropdownItems"
              :content="{ align: 'start' }"
            >
              <UButton
                :label="typeItems.find(i => i.value === typeFilter)?.label"
                color="neutral"
                variant="outline"
                :trailing-icon="appConfig.ui.icons.arrowDown"
                class="w-full justify-between"
              />
            </UDropdownMenu>
          </UFormField>
        </template>

        <template #date>
          <div class="flex flex-wrap items-end gap-2 justify-end">
            <UFormField label="Tilpas visning">
              <UDropdownMenu
                :items="
                  table?.tableApi
                    ?.getAllColumns()
                    .filter((column: any) => column.getCanHide())
                    .map((column: any) => ({
                      label: getColumnVisibilityLabel(column),
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
                  :trailing-icon="appConfig.ui.icons.settings"
                />
              </UDropdownMenu>
            </UFormField>
          </div>
        </template>
      </FiltersRow>

      <div
        v-if="bulkDeleteResult"
        class="rounded-lg border border-default bg-elevated/40 px-3 py-2 text-sm"
        role="status"
      >
        <p class="font-medium">
          {{ getRuleCountLabel(bulkDeleteResult.deletedIds.length) }} slettet.
        </p>
        <ul v-if="bulkDeleteResult.skipped.length" class="mt-1 list-inside list-disc text-muted">
          <li v-for="skipped in bulkDeleteResult.skipped" :key="skipped.ruleId">
            Regel #{{ skipped.ruleId }} blev sprunget over: {{ skipped.reason }}
          </li>
        </ul>
      </div>

      <UTable
        ref="table"
        :key="rulesTableKey"
        v-model:column-visibility="columnVisibility"
        v-model:pagination="pagination"
        v-model:row-selection="rowSelection"
        v-model:sorting="sorting"
        :get-row-id="(row: RuleListDto) => String(row.id)"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="rules-table shrink-0"
        :data="visibleRows"
        :columns="columns"
        :loading="status === 'pending' || status === 'idle'"
        @select="onRuleRowSelect"
        @keydown="activateClickableTableRowOnKeydown"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: `${clickableTableRowsBodyClass} [&>tr]:last:[&>td]:border-b-0`,
          th: 'px-2 py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'px-2 py-2 border-b border-default',
          separator: 'h-0'
        }"
      />

      <div
        v-if="selectedRuleIds.length"
        class="sticky bottom-0 z-20 flex items-center justify-between gap-3 border-t border-default bg-default/95 px-4 py-3 shadow-lg backdrop-blur"
        role="status"
        aria-live="polite"
      >
        <p class="text-sm font-semibold text-highlighted">
          {{ selectedRuleIds.length }} af
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} rækker valgt
        </p>
        <div class="flex items-center gap-1">
          <UTooltip text="Download markerede regler">
            <UButton
              :icon="appConfig.ui.icons.download"
              color="neutral"
              variant="ghost"
              aria-label="Download markerede regler som CSV"
              :loading="bulkActionPending === 'download'"
              :disabled="Boolean(bulkActionPending)"
              @click="downloadSelectedRules"
            />
          </UTooltip>
          <UTooltip text="Slet markerede regler">
            <UButton
              :icon="appConfig.ui.icons.trash"
              color="error"
              variant="ghost"
              aria-label="Slet markerede regler"
              :loading="bulkActionPending === 'delete'"
              :disabled="Boolean(bulkActionPending)"
              @click="deleteSelectedRules"
            />
          </UTooltip>
        </div>
      </div>

      <div class="flex items-center border-t border-default pt-4 mt-auto">
        <div class="flex-1 text-sm text-muted"></div>
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

<style scoped>
:global(.rules-table tbody tr:has([data-rule-status="inaktiv"]) > td) {
  background-color: var(--ui-bg-muted);
  background-image: none;
}
</style>