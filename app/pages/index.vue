<script setup lang="ts">
import { getLocalTimeZone, today } from '@internationalized/date'
import type { DashboardResponse } from '~/types/dashboard'

const endDefault = today(getLocalTimeZone())
const startDefault = endDefault.subtract({ days: 29 })

const defaultRange = {
	start: startDefault,
	end: endDefault,
}

const dateRange = ref<any>(defaultRange)

const start = computed(() => {
	const v = dateRange.value?.start ?? startDefault
	return v.toDate(getLocalTimeZone()).toISOString().slice(0, 10)
})

const end = computed(() => {
	const v = dateRange.value?.end ?? endDefault
	return v.toDate(getLocalTimeZone()).toISOString().slice(0, 10)
})

const { data, status, refresh } = await useFetch<DashboardResponse>('/api/dashboard', {
	key: computed(() => `dashboard:${start.value}:${end.value}`),
	query: computed(() => ({ start: start.value, end: end.value })),
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
				<template #trailing>
					<div class="flex items-center gap-2">
						<DashboardDateRangePicker v-model="dateRange" :reset-value="defaultRange" />
						<UButton
							icon="i-lucide-refresh-cw"
							label="Opdater"
							variant="ghost"
							:loading="status === 'pending'"
							@click="refresh()"
						/>
					</div>
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
      <DashboardKpis v-if="payload" :kpis="payload.kpis" />

      <DashboardAutomationChart
        v-if="payload"
        :series="payload.automationSeries"
        title="Automatiseringsgrad (matches / transaktioner)"
      />

      <DashboardLatestRuns v-if="payload" :runs="payload.latestRuns" />
		</template>
	</UDashboardPanel>
</template>
