<script setup lang="ts">
import { computed, toRef } from 'vue'
import type { TransactionSummary, TransactionSummarySection } from '~/types/transactions'

const props = defineProps<{ summary: TransactionSummary }>()
const summary = toRef(props, 'summary')

type SummaryItemsSection = Extract<TransactionSummarySection, { items: Array<{ label: string; value: string }> }>
type SummaryChipsSection = Extract<TransactionSummarySection, { chips: string[] }>

const isItemsSection = (section: TransactionSummarySection): section is SummaryItemsSection => 'items' in section
const isChipsSection = (section: TransactionSummarySection): section is SummaryChipsSection => 'chips' in section

const directionLabel = computed(() => (summary.value.direction === 'credit' ? 'Indbetaling' : 'Udbetaling'))
const directionIcon = computed(() =>
	summary.value.direction === 'credit' ? 'i-lucide-arrow-down-left' : 'i-lucide-arrow-up-right'
)

const partSection = computed<SummaryItemsSection | null>(() => {
	const section = summary.value.sections.find((entry) => entry.key === 'part')
	return section && isItemsSection(section) ? section : null
})

const counterpartLabel = computed(() => partSection.value?.items?.[0]?.value ?? 'Ukendt modpart')
const hasCounterpart = computed(() => counterpartLabel.value !== 'Ukendt modpart')

const orderedSections = computed(() => {
	const order: TransactionSummarySection['key'][] = ['part', 'fritekst', 'transaktionstype']
	const prioritized = order
		.map((key) => summary.value.sections.find((section) => section.key === key))
		.filter((section): section is TransactionSummarySection => Boolean(section))
	const remaining = summary.value.sections.filter((section) => !order.includes(section.key))
	return [...prioritized, ...remaining]
})

const sectionColor = (key: TransactionSummarySection['key']) => {
	switch (key) {
		case 'fritekst':
			return 'primary'
		case 'part':
			return 'secondary'
		case 'transaktionstype':
			return 'warning'
		default:
			return 'neutral'
	}
}

const sectionEntries = computed(() =>
	orderedSections.value.map((section) => {
		if (isItemsSection(section)) {
			return {
				key: section.key,
				label: section.label,
				color: sectionColor(section.key),
				values: section.items.map((item) => ({
					value: item.value,
					hint: item.label,
				})),
			}
		}
		if (isChipsSection(section)) {
			return {
				key: section.key,
				label: section.label,
				color: sectionColor(section.key),
				values: section.chips.map((chip) => ({ value: chip })),
			}
		}
		return {
			key: section.key,
			label: section.label,
			color: sectionColor(section.key),
			values: [],
		}
	})
)
</script>

<template>
	<UCard variant="soft" :ui="{ body: 'space-y-5 p-5', footer: 'p-5 pt-0 border-t border-default/60' }">
    <template #header>
      <UBadge
        size="sm"
        variant="subtle"
        color="primary"
        class="flex w-max items-center gap-2 text-[11px] font-semibold uppercase tracking-wide"
      >
        <UIcon :name="directionIcon" class="h-3.5 w-3.5" />
        <span>{{ directionLabel }}</span>
      </UBadge>
      <div class="flex flex-wrap items-start justify-between gap-4 mt-4">
        <div>
          <p class="text-xs font-medium uppercase tracking-wide">{{ summary.transactionId.label }}</p>
          <p class="text-sm font-bold">{{ summary.transactionId.value }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs font-medium uppercase tracking-wide">{{ summary.bookingDate.label }}</p>
          <p class="text-sm font-bold">{{ summary.bookingDate.value }}</p>
        </div>
      </div>
    </template>
    <!-- Visning af beløb -->
    <div class="space-y-1 text-center">
      <p class="text-xs font-medium uppercase tracking-wide">{{ summary.amount.label }}</p>
      <p class="text-3xl font-bold">{{ summary.amount.value }}</p>
    </div>
		<div class="space-y-4">
			<section v-for="section in sectionEntries" :key="section.key" class="space-y-2">
				<header class="text-xs font-semibold uppercase tracking-wide text-gray-500">
					{{ section.label }}
				</header>
				<div v-if="section.values.length" class="flex flex-wrap gap-2">
					<UBadge
						v-for="(entry, index) in section.values"
						:key="section.key + index"
						variant="soft"
						:color="section.color"
						size="lg"
						:title="entry.hint"
					>
						{{ entry.value }}
					</UBadge>
				</div>
				<UAlert v-else color="neutral" variant="soft" icon="i-lucide-align-left" class="text-xs">
					Ingen data i denne kategori
				</UAlert>
			</section>
		</div>
		<template v-if="$slots.footer" #footer>
			<slot name="footer" />
		</template>
	</UCard>
</template>
