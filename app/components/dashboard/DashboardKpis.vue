<script setup lang="ts">
import type { DashboardKpis } from '~/types/dashboard'

const appConfig = useAppConfig()

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
}

const leadingColorClassesByColor: Record<NonNullable<DashboardStat['color']>, string> = {
  primary: 'text-primary/10',
  secondary: 'text-secondary/10',
  success: 'text-success/10',
  info: 'text-info/10',
  warning: 'text-warning/10',
  error: 'text-error/10',
  neutral: 'text-neutral/10'
}

const leadingColorClasses = (color?: DashboardStat['color']) => leadingColorClassesByColor[color ?? 'primary']

const leadingBaseClass = 'pointer-events-none absolute left-1/2 top-1/2 z-0 mb-0 p-0 -translate-x-1/2 -translate-y-1/2'

const cardUiBase = {
  container: 'px-3 py-2 sm:px-4 sm:py-3',
  wrapper: 'pointer-events-none z-10 w-full flex-1',
  body: 'min-w-0 w-full flex-1',
  leadingIcon: 'size-[100cqh]',
  title: 'font-normal text-muted text-xs uppercase'
} as const

const cardCornerClasses: Record<DashboardStat['key'], string> = {
  automation: 'rounded-tl-lg',
  rules: 'rounded-tr-lg',
  'open-items': 'rounded-bl-lg',
  errors: 'rounded-br-lg'
}

const stats = computed<DashboardStat[]>(() => {
  const kpis = props.kpis

  return [
    {
      key: 'automation',
      title: 'Automatisering',
      icon: appConfig.ui.icons.wand,
      value: formatPct(kpis.automationRatePercent),
      badge: `af ${formatInt(kpis.totalTransactions)} transaktioner`
    },
    {
      key: 'rules',
      title: 'Regler i brug',
      icon: appConfig.ui.icons.notebook,
      to: '/konteringsregler',
      value: formatInt(kpis.activeRules - kpis.unusedActiveRules),
      badge: `af ${formatInt(kpis.activeRules)} aktive`
    },
    {
      key: 'open-items',
      title: 'Åbne poster',
      icon: appConfig.ui.icons.inbox,
      to: '/aabne-poster',
      value: formatInt(kpis.openSamleposter)
    },
    {
      key: 'errors',
      title: 'Aktuelle fejl',
      icon: appConfig.ui.icons.warning,
      to: '/koersler',
      value: formatInt(kpis.errorCount),
      color: 'error'
    }
  ]
})

const leadingIconClasses = (stat: DashboardStat) => {
  const transform = stat.key === 'automation'
    ? '-scale-x-100'
    : stat.key === 'rules'
      ? 'scale-110 translate-y-[4cqh]'
      : ''

  return `${cardUiBase.leadingIcon} ${leadingColorClasses(stat.color)} ${transform}`
}
</script>

<template>
  <div class="grid grid-cols-2 gap-2 lg:grid-rows-2">
    <UPageCard
      v-for="stat in stats"
      :key="stat.key"
      :icon="stat.icon"
      :title="stat.title"
      :to="stat.to"
      variant="subtle"
      :ui="{
        ...cardUiBase,
        leading: leadingBaseClass,
        leadingIcon: leadingIconClasses(stat)
      }"
      :class="[
        'relative min-h-28 overflow-hidden [container-type:size]',
        cardCornerClasses[stat.key]
      ]"
    >
      <template #body>
        <div class="grid h-full w-full grid-rows-[auto_1fr] justify-items-center text-center">
          <span class="text-base font-medium uppercase text-muted">{{ stat.title }}</span>
          <div class="grid place-content-center justify-items-center gap-2">
            <span class="text-4xl font-semibold text-highlighted">{{ stat.value }}</span>
            <UBadge v-if="stat.badge" variant="subtle" class="px-2 py-1 text-sm" :color="stat.color">
              {{ stat.badge }}
            </UBadge>
          </div>
        </div>
      </template>
    </UPageCard>
  </div>
</template>
