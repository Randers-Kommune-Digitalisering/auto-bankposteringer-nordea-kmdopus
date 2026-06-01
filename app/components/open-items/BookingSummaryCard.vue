<script setup lang="ts">
import { computed, toRef } from 'vue'
import type { TransactionSummary } from '~/types/transactions'

const props = defineProps<{ summary: TransactionSummary }>()
const summary = toRef(props, 'summary')

type SummaryItemsSection = {
	key: 'part' | 'transaktionstype'
	label: string
	items: Array<{ label: string; value: string }>
}

type SummaryChipsSection = {
	key: 'fritekst'
	label: string
	chips: string[]
}

type TransactionSummarySection = SummaryItemsSection | SummaryChipsSection

const directionLabel = computed(() => (summary.value.direction === 'credit' ? 'Indbetaling' : 'Udbetaling'))
const directionIcon = computed(() =>
	summary.value.direction === 'credit' ? 'solar:arrow-to-down-left-bold-duotone' : 'solar:arrow-to-top-right-bold-duotone'
)

const partSection = computed<SummaryItemsSection | null>(() => {
	const section = (summary.value.sections as TransactionSummarySection[]).find((entry) => entry.key === 'part')
	return section?.key === 'part' ? section : null
})

const counterpartLabel = computed(() => partSection.value?.items?.[0]?.value ?? 'Ukendt modpart')
const hasCounterpart = computed(() => counterpartLabel.value !== 'Ukendt modpart')

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const orderedSections = computed<TransactionSummarySection[]>(() => {
	const order: TransactionSummarySection['key'][] = ['part', 'fritekst', 'transaktionstype']
	const prioritized = order
		.map((key) => (summary.value.sections as TransactionSummarySection[]).find((section) => section.key === key))
		.filter((section): section is TransactionSummarySection => Boolean(section))
	const remaining = (summary.value.sections as TransactionSummarySection[]).filter((section) => !order.includes(section.key))
	return [...prioritized, ...remaining]
})

const sectionColor = (key: TransactionSummarySection['key']): BadgeColor => {
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

type SectionEntry = {
	key: TransactionSummarySection['key']
	label: string
	color: BadgeColor
	values: Array<{ value: string; hint?: string }>
}

function splitTriadTokens(values: string[]): string[] {
	return values
		.flatMap((value) => String(value ?? '').split(';'))
		.map((value) => value.trim())
		.filter(Boolean)
}

function parseTriadToken(token: string): { code: string; label: string; value: string } | null {
	const match = /^(\d{2,3}):([^:]+):(.*)$/.exec(token)
	if (!match) return null
	const code = String(match[1] ?? '').trim()
	const label = String(match[2] ?? '').trim()
	const value = String(match[3] ?? '').trim()
	if (!code || !label || !value) return null
	return { code, label, value }
}

function toSectionEntry(section: TransactionSummarySection): SectionEntry {
	if (section.key === 'fritekst') {
		const tokens = splitTriadTokens(section.chips)
		const triadBadges: Array<{ value: string; hint?: string }> = []
		const freeTextBadges: Array<{ value: string; hint?: string }> = []

		for (const token of tokens) {
			const triad = parseTriadToken(token)
			if (!triad) {
				freeTextBadges.push({ value: token })
				continue
			}

			triadBadges.push({
				value: `${triad.code} · ${triad.label} · ${triad.value}`,
				hint: `${triad.code}:${triad.label}`,
			})
		}

		return {
			key: section.key,
			label: section.label,
			color: sectionColor(section.key),
			values: [...triadBadges, ...freeTextBadges],
		}
	}
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

const sectionEntries = computed<SectionEntry[]>(() => orderedSections.value.map(toSectionEntry))
</script>

<template>
	<UCard variant="soft" :ui="{ body: 'space-y-5 p-5', footer: 'p-5 pt-0 border-t border-default/60' }">
    <template #header>
      <!-- Direction -->
      <UBadge
        size="sm"
        variant="soft"
        color="primary"
        class="flex justify-center text-xs font-semibold uppercase tracking-wide mt-2 mb-6"
      >
        <UIcon :name="directionIcon" class="h-4.5 w-4.5" />
        <span>{{ directionLabel }}</span>
      </UBadge>
      <!-- Amount -->
			<div class="space-y-1 text-center mt-2 mb-6">
        <p class="text-xs font-medium uppercase tracking-wide">{{ summary.amount.label }}</p>
        <p class="text-3xl font-bold">{{ summary.amount.value }}</p>
      </div>
      <!-- Metadata -->
			<div class="flex flex-wrap items-start justify-center gap-4 mt-0">
				<div class="text-center">
					<p class="text-center text-xs font-medium uppercase tracking-wide">{{ summary.bookingDate.label }}</p>
					<p class="text-center text-sm font-bold">{{ summary.bookingDate.value }}</p>
        </div>
      </div>
    </template>
		<div class="space-y-6">
			<section v-for="section in sectionEntries" :key="section.key" class="space-y-2">
				<header class="text-xs font-semibold uppercase tracking-wide">
					{{ section.label }}
				</header>
				<div v-if="section.values.length" class="flex flex-wrap gap-2">
					<UBadge
						v-for="(entry, index) in section.values"
						:key="section.key + index"
						variant="soft"
						:color="section.color"
						size="lg"
						:title="entry.hint ?? undefined"
						class="max-w-full min-w-0 whitespace-normal break-all"
					>
						{{ entry.value }}
					</UBadge>
				</div>
				<UAlert v-else color="neutral" variant="soft" icon="solar:align-left-bold-duotone" class="text-xs">
					Ingen data i denne kategori
				</UAlert>
			</section>
		</div>
		<template v-if="$slots.footer" #footer>
			<slot name="footer" />
		</template>
	</UCard>
</template>
