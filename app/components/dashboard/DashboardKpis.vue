<script setup lang="ts">
import type { DashboardKpis } from '~/types/dashboard'

const props = defineProps<{
  kpis: DashboardKpis
}>()

const formatInt = (value: number) => new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 }).format(value)
const formatPct = (value: number) => `${new Intl.NumberFormat('da-DK', { maximumFractionDigits: 1 }).format(value)}%`

type DashboardStat = {
  key: 'automation' | 'open-items' | 'rules' | 'errors'
  title: string
  icon: string
  to?: string
  value: string
  badge?: string
  sub?: string
}

const cardUi = {
  container: 'gap-y-1.5',
  wrapper: 'items-start',
  leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
  title: 'font-normal text-muted text-xs uppercase'
} as const

const stats = computed<DashboardStat[]>(() => {
  const kpis = props.kpis

  return [
    {
      key: 'automation',
      title: 'Automatisering',
      icon: 'i-lucide-wand-2',
      value: formatPct(kpis.automationRatePercent),
      badge: `${formatInt(kpis.matchedTransactions)} / ${formatInt(kpis.totalTransactions)}`,
      sub: `Auto: ${formatInt(kpis.autoBookedTransactions)}`
    },
    {
      key: 'open-items',
      title: 'Åbne poster',
      icon: 'i-lucide-inbox',
      to: '/open-items',
      value: formatInt(kpis.openTransactions)
    },
    {
      key: 'rules',
      title: 'Regler',
      icon: 'i-lucide-notebook-pen',
      to: '/konteringsregler',
      value: formatInt(kpis.activeRules),
      badge: 'aktive',
      sub: `Ubrugte: ${formatInt(kpis.unusedActiveRules)}`
    },
    {
      key: 'errors',
      title: 'Fejl',
      icon: 'i-lucide-triangle-alert',
      to: '/runs',
      value: formatInt(kpis.errorCount),
      badge: 'fejl',
      sub: `Kørsler: ${formatInt(kpis.failedRuns)}`
    }
  ]
})
</script>

<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      v-for="(stat, index) in stats"
      :key="stat.key"
      :icon="stat.icon"
      :title="stat.title"
      :to="stat.to"
      variant="subtle"
      :ui="cardUi"  
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stat.value }}
        </span>

        <UBadge v-if="stat.badge" variant="subtle" class="text-xs">
          {{ stat.badge }}
        </UBadge>
      </div>

      <div v-if="stat.sub" class="text-sm text-muted">
        {{ stat.sub }}
      </div>
    </UPageCard>
  </UPageGrid>
</template>
