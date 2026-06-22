<script setup lang="ts">
import { today } from '@internationalized/date'
import type { DashboardResponse } from '~/types/dashboard'
import { DEFAULT_TIME_ZONE } from '~/lib/timeZone'

const appConfig = useAppConfig()

const timeZone = DEFAULT_TIME_ZONE

const endDefault = today(timeZone)
const startDefault = endDefault.subtract({ days: 29 })

const defaultRange = {
	start: startDefault,
	end: endDefault,
}

const dateRange = ref<any>(defaultRange)

const selectedAccountIds = ref<string[]>([])

const start = computed(() => {
	const v = dateRange.value?.start ?? startDefault
	return v.toDate(timeZone).toISOString().slice(0, 10)
})

const end = computed(() => {
	const v = dateRange.value?.end ?? endDefault
	return v.toDate(timeZone).toISOString().slice(0, 10)
})

const { data, status, refresh } = await useFetch<DashboardResponse>('/api/dashboard', {
	key: computed(() => `dashboard:${start.value}:${end.value}`),
	deep: true,
	query: computed(() => ({
		start: start.value,
		end: end.value,
		accountIds: selectedAccountIds.value.length ? selectedAccountIds.value.join(',') : undefined,
	})),
	watch: [start, end, selectedAccountIds],
	dedupe: 'cancel',
})

const payload = computed(() => data.value)
</script>

<template>
	<UDashboardPanel id="dashboard">
		<template #header>
			<UDashboardNavbar title="Dashboard">
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>
				<template #right>
					<UButton
						:icon="appConfig.ui.icons.reload"
						label="Opdater"
						variant="ghost"
						color="primary"
						:loading="status === 'pending'"
						@click="refresh()"
					/>
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<div class="space-y-4">
				<FiltersRow
					v-model:date-range="dateRange"
					:reset-date-range="defaultRange"
					:time-zone="timeZone"
					v-model:account-ids="selectedAccountIds"
				/>

				<DashboardKpis v-if="payload" :kpis="payload.kpis" />

				<DashboardAutomationChart
					v-if="payload"
					:series="payload.automationSeries"
					title="Automatiseringsgrad (matches / transaktioner)"
				/>

				<DashboardLatestRuns v-if="payload" :runs="payload.latestRuns" />
			</div>
		</template>
	</UDashboardPanel>
</template>
