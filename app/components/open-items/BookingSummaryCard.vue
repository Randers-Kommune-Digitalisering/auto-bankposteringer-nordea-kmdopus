<script setup lang="ts">
import { computed, toRef } from 'vue'
import { toVisibleSummarySections } from '~/lib/presenters/transactionSummaryEntries'
import type { TransactionSummary } from '~/types/transactions'

const appConfig = useAppConfig()

const directionIcon = computed(() =>
	summary.value.direction === 'credit' ? appConfig.ui.icons.arrowAngleUp : appConfig.ui.icons.arrowAngleDown
)

const props = defineProps<{ summary: TransactionSummary }>()
const summary = toRef(props, 'summary')

const isGroupedSummary = computed(() => /^samlepost\s*\(/i.test(String(summary.value.transactionId?.value ?? '').trim()))
const directionLabel = computed(() => {
	const base = summary.value.direction === 'credit' ? 'Indbetaling' : 'Udbetaling'
	return isGroupedSummary.value ? `${base} (samlepost)` : base
})

const sectionEntries = computed(() => toVisibleSummarySections(summary.value.sections))
</script>

<template>
	<UCard variant="soft" :ui="{ body: 'space-y-3 p-4', footer: 'p-5 pt-0 border-t border-default/60' }">
    <template #header>
      <!-- Direction -->
      <UBadge
        size="sm"
        variant="soft"
        color="primary"
        class="flex justify-center text-xs font-semibold uppercase tracking-wide mb-3"
      >
        <UIcon :name="directionIcon" class="h-4.5 w-4.5" />
        <span>{{ directionLabel }}</span>
      </UBadge>
      <!-- Amount -->
			<div class="space-y-1 text-center mb-3">
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
		<div class="space-y-1.5">
			<section v-for="section in sectionEntries" :key="section.key" :aria-label="section.label" class="space-y-1.5">
				<div class="grid gap-1.5">
					<div
						v-for="(entry, index) in section.values"
						:key="section.key + index"
						class="min-w-0 rounded-md border border-default/60 border-l-4 px-3 py-2"
						:class="{
							'border-l-secondary': section.key === 'part',
							'border-l-success': section.key === 'reference',
							'border-l-warning': section.key === 'transaktionstype',
							'bg-secondary/5': section.key === 'part',
							'bg-success/5': section.key === 'reference',
							'bg-warning/5': section.key === 'transaktionstype',
							'grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] items-stretch gap-x-3': !entry.valueLines?.length,
							'space-y-3': entry.valueLines?.length,
						}"
					>
						<div
							v-if="entry.valueLines?.length"
							class="space-y-1 text-center"
						>
							<p class="text-xs font-semibold text-muted">
								{{ entry.label }}
							</p>
							<p
								v-if="entry.sourcePath"
								class="break-all font-mono text-[10px] leading-3.5 text-muted"
							>
								{{ entry.sourcePath }}
							</p>
						</div>
						<template v-else>
							<div class="flex min-w-0 flex-col justify-center gap-1">
								<p class="text-xs font-semibold text-muted">
									{{ entry.label }}
								</p>
								<p
									v-if="entry.sourcePath"
									class="break-all font-mono text-[10px] leading-3.5 text-muted"
								>
									{{ entry.sourcePath }}
								</p>
							</div>
						</template>
						<div
							class="min-w-0"
							:class="entry.valueLines?.length ? 'w-full' : 'flex min-h-12 items-center border-l border-default/50 pl-3'"
						>
							<div v-if="entry.valueLines?.length" class="w-full divide-y divide-default/40">
								<div
									v-for="(line, lineIndex) in entry.valueLines"
									:key="lineIndex"
									class="grid min-w-0 grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)] items-center gap-x-3 py-1.5 first:pt-0 last:pb-0"
								>
									<p v-if="line.label" class="break-words text-xs font-medium leading-4 text-muted">
										{{ line.label }}
									</p>
									<p
										class="break-words text-right text-base font-semibold leading-5"
										:class="{ 'col-span-2': !line.label }"
									>
										{{ line.value }}
									</p>
								</div>
							</div>
							<p v-else class="w-full break-words text-right text-base font-semibold leading-5">
								{{ entry.value }}
							</p>
						</div>
					</div>
				</div>
			</section>
		</div>
		<template v-if="$slots.footer" #footer>
			<slot name="footer" />
		</template>
	</UCard>
</template>
