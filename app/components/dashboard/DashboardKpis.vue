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
  color?: "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral"
  sub?: string
}

const leadingColorClassesByColor: Record<NonNullable<DashboardStat['color']>, string> = {
  primary: 'bg-primary/10 ring-primary/25',
  secondary: 'bg-secondary/10 ring-secondary/25',
  success: 'bg-success/10 ring-success/25',
  info: 'bg-info/10 ring-info/25',
  warning: 'bg-warning/10 ring-warning/25',
  error: 'bg-error/10 ring-error/25',
  neutral: 'bg-neutral/10 ring-neutral/25'
}

const leadingColorClasses = (color?: DashboardStat['color']) => leadingColorClassesByColor[color ?? 'primary']

const leadingBaseClass = 'p-2.5 rounded-full ring ring-inset flex-col'

const cardUiBase = {
  container: 'gap-y-1.5',
  wrapper: 'items-start',
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
      to: '/aabne-poster',
      value: formatInt(kpis.openTransactions)
    },
    {
      key: 'rules',
      title: 'Regler',
      icon: 'i-lucide-notebook-pen',
      to: '/konteringsregler',
      value: formatInt(kpis.activeRules),
      badge: 'Aktive',
      sub: `Ubrugte: ${formatInt(kpis.unusedActiveRules)}`
    },
    {
      key: 'errors',
      title: 'Fejl',
      icon: 'i-lucide-triangle-alert',
      to: '/koersler',
      value: formatInt(kpis.errorCount),
      badge: 'Fejl',
      color: 'error',
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
      :ui="{ ...cardUiBase, leading: `${leadingBaseClass} ${leadingColorClasses(stat.color)}` }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stat.value }}
        </span>

        <UBadge v-if="stat.badge" variant="subtle" class="text-xs" :color="stat.color">
          {{ stat.badge }}
        </UBadge>
      </div>

      <div v-if="stat.sub" class="text-sm text-muted">
        {{ stat.sub }}
      </div>
      <div v-else class="text-sm text-muted" aria-hidden="true">&nbsp;</div>
    </UPageCard>
  </UPageGrid>
</template>
