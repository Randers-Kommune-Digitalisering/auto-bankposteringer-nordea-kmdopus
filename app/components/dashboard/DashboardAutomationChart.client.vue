<script setup lang="ts">
import type { DashboardAutomationSeriesPoint } from '~/types/dashboard'

const containerRef = ref<HTMLElement | null>(null)

type HoverState = {
  index: number
  clientX: number
  clientY: number
} | null

const props = defineProps<{
  series: DashboardAutomationSeriesPoint[]
  title?: string
}>()

const width = 860
const height = 240
const padding = { top: 16, right: 16, bottom: 24, left: 32 }

const points = computed(() => {
  const series = props.series
  if (!series?.length) return [] as Array<{ x: number; y: number; value: number; date: string }>

  const values = series.map((p) => p.automationRatePercent)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 100)

  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const xStep = series.length === 1 ? 0 : innerW / (series.length - 1)
  const scaleY = (v: number) => {
    if (max === min) return padding.top + innerH / 2
    const t = (v - min) / (max - min)
    return padding.top + (1 - t) * innerH
  }

  return series.map((p, idx) => ({
    x: padding.left + idx * xStep,
    y: scaleY(p.automationRatePercent),
    value: p.automationRatePercent,
    date: p.date,
  }))
})

const hover = ref<HoverState>(null)

function formatShortDate(value: string): string {
  // value is YYYY-MM-DD
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short' }).format(parsed)
}

const tickIndices = computed(() => {
  const n = points.value.length
  if (n <= 1) return [] as number[]
  const indices = new Set<number>()
  indices.add(0)
  indices.add(n - 1)
  indices.add(Math.floor((n - 1) * 0.25))
  indices.add(Math.floor((n - 1) * 0.5))
  indices.add(Math.floor((n - 1) * 0.75))
  return Array.from(indices).sort((a, b) => a - b)
})

const hoveredPoint = computed(() => {
  if (!hover.value) return null
  const p = props.series[hover.value.index]
  const xy = points.value[hover.value.index]
  if (!p || !xy) return null
  return { ...p, x: xy.x, y: xy.y }
})

function nearestIndexFromEvent(ev: PointerEvent): number | null {
  const el = containerRef.value
  if (!el || points.value.length === 0) return null
  const svg = el.querySelector('svg')
  if (!svg) return null
  const rect = svg.getBoundingClientRect()
  const xPx = ev.clientX - rect.left
  const xView = (xPx / rect.width) * width

  const innerLeft = padding.left
  const innerRight = width - padding.right
  const clamped = Math.min(innerRight, Math.max(innerLeft, xView))

  const idxFloat = (clamped - innerLeft) / (innerRight - innerLeft)
  const idx = Math.round(idxFloat * (points.value.length - 1))
  return Math.max(0, Math.min(points.value.length - 1, idx))
}

function onPointerMove(ev: PointerEvent) {
  const idx = nearestIndexFromEvent(ev)
  if (idx === null) return
  hover.value = { index: idx, clientX: ev.clientX, clientY: ev.clientY }
}

function onPointerLeave() {
  hover.value = null
}

const pathD = computed(() => {
  if (points.value.length < 2) return ''
  return points.value
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')
})

const areaD = computed(() => {
  if (points.value.length < 2) return ''
  const baseY = height - padding.bottom
  const first = points.value[0]!
  const last = points.value[points.value.length - 1]!
  const line = points.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  return `${line} L ${last.x.toFixed(2)} ${baseY.toFixed(2)} L ${first.x.toFixed(2)} ${baseY.toFixed(2)} Z`
})

const tooltip = computed(() => {
  const p = hoveredPoint.value
  if (!p) return null
  const pct = new Intl.NumberFormat('da-DK', { maximumFractionDigits: 1 }).format(p.automationRatePercent)
  return {
    title: formatShortDate(p.date),
    lines: [
      `Automatisering: ${pct}%`,
      `Matches: ${p.matchedTransactions} / ${p.totalTransactions}`,
      `Auto-bogført: ${p.autoBookedTransactions}`,
    ],
  }
})
</script>

<template>
  <UCard :ui="{ root: 'overflow-visible' }">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="font-medium">{{ title ?? 'Automatiseringsgrad' }}</div>
        <div v-if="tooltip" class="text-sm text-muted">{{ tooltip.title }}</div>
      </div>
    </template>

    <div ref="containerRef" class="relative w-full overflow-x-auto">
      <svg
        :viewBox="`0 0 ${width} ${height}`"
        class="min-w-[720px] w-full"
        @pointermove="onPointerMove"
        @pointerleave="onPointerLeave"
      >
        <defs>
          <linearGradient id="automationArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="currentColor" stop-opacity="0.18" />
            <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
          </linearGradient>
        </defs>

        <!-- X axis -->
        <g class="text-muted" fill="none" stroke="currentColor" stroke-opacity="0.12">
          <line
            :x1="padding.left"
            :x2="width - padding.right"
            :y1="height - padding.bottom"
            :y2="height - padding.bottom"
          />
        </g>

        <g class="text-muted" fill="none" stroke="currentColor" stroke-opacity="0.16">
          <line
            v-for="i in tickIndices"
            :key="i"
            :x1="points[i]?.x"
            :x2="points[i]?.x"
            :y1="height - padding.bottom"
            :y2="height - padding.bottom + 6"
          />
        </g>

        <g class="text-muted" fill="currentColor" fill-opacity="0.7">
          <text
            v-for="i in tickIndices"
            :key="`label-${i}`"
            :x="points[i]?.x"
            :y="height - 10"
            text-anchor="middle"
            class="text-[11px]"
          >
            {{ (i === 0 || i === points.length - 1) ? '' : (series[i]?.date ? formatShortDate(series[i].date) : '') }}
          </text>
        </g>

        <g class="text-muted" fill="none" stroke="currentColor" stroke-opacity="0.12">
          <line :x1="padding.left" :x2="width - padding.right" :y1="padding.top" :y2="padding.top" />
        </g>

        <path v-if="areaD" :d="areaD" fill="url(#automationArea)" class="text-primary" />
        <path v-if="pathD" :d="pathD" fill="none" stroke="currentColor" stroke-width="2.5" class="text-primary" />

        <!-- Crosshair + hover point -->
        <g v-if="hoveredPoint" class="text-primary">
          <line
            :x1="hoveredPoint.x"
            :x2="hoveredPoint.x"
            :y1="padding.top"
            :y2="height - padding.bottom"
            stroke="currentColor"
            stroke-opacity="0.35"
            stroke-width="1.5"
          />
          <circle
            :cx="hoveredPoint.x"
            :cy="hoveredPoint.y"
            r="4"
            fill="currentColor"
          />
          <circle
            :cx="hoveredPoint.x"
            :cy="hoveredPoint.y"
            r="7"
            fill="none"
            stroke="currentColor"
            stroke-opacity="0.25"
            stroke-width="2"
          />
        </g>
      </svg>

      <!-- Tooltip -->
      <div
        v-if="tooltip && hoveredPoint"
        class="pointer-events-none absolute z-10"
        :style="{
          left: `min(calc(100% - 12rem), max(0.5rem, ${(hoveredPoint.x / width) * 100}%))`,
          top: '0.5rem'
        }"
      >
        <div class="rounded-lg border border-default bg-default px-3 py-2 shadow-sm w-48">
          <div class="text-sm font-medium text-highlighted">{{ tooltip.title }}</div>
          <div class="mt-1 text-xs text-muted" v-for="(line, idx) in tooltip.lines" :key="idx">
            {{ line }}
          </div>
        </div>
      </div>
    </div>

    <div class="mt-3 text-sm text-muted">
      Viser matches/total pr. dag (seneste 30 dage som default).
    </div>
  </UCard>
</template>
