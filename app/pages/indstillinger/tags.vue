<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row, SortingState } from '@tanstack/table-core'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { RuleTagSelectSchema } from '~/lib/db/schema/ruleTag'
import { capitalizeFirst } from '~/lib/text/capitalizeFirst'

const RULE_TAGS_QUERY_KEY = 'rule-tags' as const

const appConfig = useAppConfig()
const toast = useToast()
const table = useTemplateRef('table')
const globalFilterValue = ref('')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UIcon = resolveComponent('UIcon')

const modalOpen = ref(false)
const editingTagId = ref<string | null>(null)
const deletingTagId = ref<string | null>(null)
const refreshingTags = ref(false)
const sorting = ref<SortingState>([])

const { data: ruleTags, pending, refresh: refreshRuleTags } = await useFetch<RuleTagSelectSchema[]>(
	'/api/rule-tags',
	{
		key: RULE_TAGS_QUERY_KEY,
		deep: true,
		dedupe: 'cancel',
		transform: (v) => Array.isArray(v) ? v.slice() : [],
		default: () => []
	}
)

const refreshTags = async () => {
	refreshingTags.value = true
	try {
		await refreshRuleTags()
	} finally {
		refreshingTags.value = false
	}
}

const rows = computed(() => [...(ruleTags.value ?? [])])

const tableDataKey = computed(() => rows.value.map((t) => String(t.id)).join('|'))

watch(
	() => tableDataKey.value,
	() => {
		// If the dataset changes, keep the UI predictable by going back to page 1.
		// Otherwise a newly created tag can land on a different page and look like "no refresh".
		pagination.value = { ...pagination.value, pageIndex: 0 }
	}
)

const createSortableHeader = (label: string) => ({ column }: { column: any }) => {
	const sortingState = column.getIsSorted?.()
	const iconName = sortingState === 'asc'
		? appConfig.ui.icons.sortAscending
		: sortingState === 'desc'
			? appConfig.ui.icons.sortDescending
			: appConfig.ui.icons.unsorted

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

function handleAddTag() {
	editingTagId.value = null
	modalOpen.value = true
}

function handleEditTag(row: Row<RuleTagSelectSchema>) {
	editingTagId.value = row.original.id
	modalOpen.value = true
}

async function handleSaved() {
	editingTagId.value = null
	modalOpen.value = false
}

async function handleDeleteTag(row: Row<RuleTagSelectSchema>) {
	const tagId = row.original.id
	deletingTagId.value = tagId

	try {
		await $fetch(`/api/rule-tags/${tagId}`, {
			method: 'DELETE'
		})

		toast.add({
			title: 'Tag slettet',
			description: `${capitalizeFirst(tagId)} er blevet fjernet.`
		})

		await refreshNuxtData(RULE_TAGS_QUERY_KEY)
	} catch (error) {
		console.error('Fejl ved sletning af tag', error)
		toast.add({
			title: 'Fejl ved sletning',
			description: 'Kunne ikke slette tag. Prøv igen senere.',
			color: 'error'
		})
	} finally {
		deletingTagId.value = null
	}
}

function getRowItems(row: Row<RuleTagSelectSchema>) {
	return [
		{ type: 'label', label: 'Handlinger' },
		{
			label: 'Rediger tag',
			icon: appConfig.ui.icons.edit,
			onSelect() { handleEditTag(row) }
		},
		{ type: 'separator' },
		{
			label: 'Slet tag',
			icon: appConfig.ui.icons.trash,
			color: 'error',
			disabled: deletingTagId.value === row.original.id,
			onSelect() { handleDeleteTag(row) }
		}
	]
}

const columns: TableColumn<RuleTagSelectSchema>[] = [
	{
		accessorKey: 'id',
		id: 'id',
		header: createSortableHeader('Tag'),
		enableSorting: true,
		cell: ({ row }) => h('span', capitalizeFirst(row.original.id))
	},
	{
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
						content: { align: 'end' },
						items: getRowItems(row)
					},
					() =>
						h(UButton, {
							icon: appConfig.ui.icons.dotMenu,
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
</script>

<template>
	<UDashboardPanel id="settings-ruletags">
		<template #header>
			<UDashboardNavbar title="Ruletags">
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>

				<template #right>
					<UButton
						class="font-bold rounded-full"
						:icon="appConfig.ui.icons.tag"
						:label="'Nyt tag'"
						@click="handleAddTag"
					/>
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<div class="flex flex-wrap items-center justify-between gap-1.5">
        <FiltersRow
          v-model:search="globalFilterValue"
          :show-search="true"
					:show-accounts="false"
					:show-date="false"
					search-placeholder="Søg i tags..."
        />
			</div>

			<UTable
				:key="tableDataKey"
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
				:loading="pending || refreshingTags"
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

			<RulesRuleTagModal
				v-model:open="modalOpen"
				:tag-id="editingTagId"
				@saved="handleSaved"
			/>
		</template>
	</UDashboardPanel>
</template>