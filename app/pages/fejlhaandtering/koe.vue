<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const appConfig = useAppConfig()
const toast = useToast()
const UButton = resolveComponent('UButton')
const NuxtLink = resolveComponent('NuxtLink')
const page = ref(1)
const pageSize = 25
const pollingNow = ref(false)
const retryingId = ref<string | null>(null)

type RecoveryWorkItem = {
  kind: 'job' | 'outbox'
  id: string
  typeOrTopic: string
  status: string
  runId: string | null
  requestId: string | null
  attempts: number
  nextAt: string
  updatedAt: string
  lastError: string | null
  canRetry: boolean
}

type RecoveryQueueResponse = {
  items: RecoveryWorkItem[]
  total: number
  page: number
  pageSize: number
}

const { data, pending, refresh } = await useFetch<RecoveryQueueResponse>('/api/fejlhaandtering/queue', {
  key: 'failed-recovery-worklist',
  query: computed(() => ({ page: page.value, pageSize })),
  watch: [page],
  deep: true,
  default: () => ({ items: [], total: 0, page: 1, pageSize }),
})

const workItems = computed(() => data.value?.items ?? [])
const tableKey = computed(() => workItems.value.map(item => `${item.kind}:${item.id}`).join('|'))

function typeLabel(item: RecoveryWorkItem): string {
  if (item.kind === 'outbox') return 'ERP-aflevering'
  switch (item.typeOrTopic) {
    case 'banking.ingest': return 'Bankindlæsning'
    case 'banking.accountDiscovery': return 'Kontoopdagelse'
    case 'erp.ingestResponses': return 'ERP-svarpoll'
    case 'ops.dbCleanup': return 'Databaseoprydning'
    default: return item.typeOrTopic
  }
}

function actionLabel(item: RecoveryWorkItem): string {
  if (!item.canRetry) return 'Ikke genkørbar'
  if (item.kind === 'outbox') return 'Genkør ERP-aflevering'
  switch (item.typeOrTopic) {
    case 'banking.ingest': return 'Genkør bankindlæsning'
    case 'banking.accountDiscovery': return 'Genkør kontoopdagelse'
    case 'erp.ingestResponses': return 'Genkør ERP-poll'
    default: return 'Genkør job'
  }
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('da-DK', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

async function retryWorkItem(item: RecoveryWorkItem) {
  if (!item.canRetry || retryingId.value) return
  retryingId.value = item.id
  try {
    const path = item.kind === 'job'
      ? `/api/fejlhaandtering/jobs/${encodeURIComponent(item.id)}/retry`
      : `/api/fejlhaandtering/outbox/${encodeURIComponent(item.id)}/retry`
    await $fetch(path, { method: 'POST' })
    toast.add({ title: `${typeLabel(item)} sat til genkørsel` })
    await refresh()
  } catch (error) {
    console.error('Genkørsel fejlede', error)
    toast.add({ title: 'Kunne ikke genkøre arbejdet', color: 'error' })
  } finally {
    retryingId.value = null
  }
}

async function pollErpResponses() {
  pollingNow.value = true
  try {
    await $fetch('/api/fejlhaandtering/jobs/enqueue', {
      method: 'POST',
      body: { type: 'erp.ingestResponses' },
    })
    toast.add({
      title: 'ERP-svarpoll sat i kø',
      description: 'Pollingen er global og bliver udført af workeren.',
    })
    await refresh()
  } catch (error) {
    console.error('ERP-svarpoll kunne ikke sættes i kø', error)
    toast.add({ title: 'Kunne ikke starte ERP-svarpoll', color: 'error' })
  } finally {
    pollingNow.value = false
  }
}

const columns: TableColumn<RecoveryWorkItem>[] = [
  {
    id: 'type',
    header: 'Arbejde',
    cell: ({ row }) => typeLabel(row.original),
  },
  {
    id: 'reference',
    header: 'Run / request',
    cell: ({ row }) => {
      const item = row.original
      if (item.requestId) {
        return h(
          NuxtLink,
          {
            to: { path: '/fejlhaandtering/erp', query: { requestId: item.requestId } },
            class: 'font-mono text-primary hover:underline',
          },
          () => item.requestId,
        )
      }
      if (item.runId) {
        return h(
          NuxtLink,
          {
            to: { path: '/koersler', query: { runId: item.runId } },
            class: 'font-mono text-primary hover:underline',
          },
          () => item.runId,
        )
      }
      return 'Global'
    },
  },
  {
    accessorKey: 'attempts',
    header: 'Forsøg',
    size: 90,
    cell: ({ row }) => String(row.original.attempts),
  },
  {
    id: 'nextAt',
    header: 'Senest ændret',
    cell: ({ row }) => formatDate(row.original.updatedAt || row.original.nextAt),
  },
  {
    accessorKey: 'lastError',
    header: 'Seneste fejl',
    cell: ({ row }) => row.original.lastError || 'Ingen fejlbesked',
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => h(
      UButton,
      {
        size: 'sm',
        color: 'primary',
        variant: 'soft',
        disabled: !row.original.canRetry || retryingId.value !== null,
        loading: retryingId.value === row.original.id,
        label: actionLabel(row.original),
        onClick: () => retryWorkItem(row.original),
      },
    ),
  },
]
</script>

<template>
  <UDashboardPanel id="recovery-queue">
    <template #header>
      <UDashboardNavbar title="Fejlhåndtering">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            :icon="appConfig.ui.icons.download"
            label="Poll ERP-svar nu"
            color="neutral"
            variant="soft"
            :loading="pollingNow"
            :disabled="pending || pollingNow"
            @click="pollErpResponses"
          />
          <UButton
            :icon="appConfig.ui.icons.reload"
            label="Opdater"
            color="primary"
            variant="ghost"
            :loading="pending"
            @click="refresh"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard>
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="font-medium">Fejlet arbejde</h2>
              <p class="mt-1 text-sm text-muted">Genkør kun den fejlede delproces. ERP-genfremsendelse og transaktionsgenåbning findes under ERP-integration.</p>
            </div>
            <UBadge color="error" variant="subtle">{{ data.total }} fejl</UBadge>
          </div>
        </template>

        <UEmpty
          v-if="!pending && !workItems.length"
          :icon="appConfig.ui.icons.check"
          title="Ingen fejlede jobs eller ERP-afleveringer"
          description="Nye fejl vises her, når en automatisk behandling eller aflevering fejler."
          class="border border-dashed border-default rounded-lg"
        />

        <UTable
          v-else
          :key="tableKey"
          :data="workItems"
          :columns="columns"
          :loading="pending"
          :ui="{
            base: 'border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
            td: 'border-b border-default align-top',
            separator: 'h-0',
          }"
        />

        <div v-if="data.total > pageSize" class="flex justify-center border-t border-default pt-4 mt-4">
          <UPagination v-model:page="page" :items-per-page="pageSize" :total="data.total" />
        </div>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
