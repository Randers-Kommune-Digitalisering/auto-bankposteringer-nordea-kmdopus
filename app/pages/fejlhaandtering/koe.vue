<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

type QueueListItem = {
  id: string
  typeOrTopic: string
  status: string
  runId: string | null
  attempts: number
  nextAt: string
  lastError: string | null
}

type RecoveryQueueResponse = {
  failedJobs: QueueListItem[]
  failedOutbox: QueueListItem[]
}

const toast = useToast()
const UButton = resolveComponent('UButton')

const { data: queue, pending: queuePending, refresh: refreshQueue } = await useFetch<RecoveryQueueResponse>(
  '/api/fejlhaandtering/queue',
  {
    key: 'recovery-queue',
    default: () => ({ failedJobs: [], failedOutbox: [] }),
  },
)

const queueColumns: TableColumn<QueueListItem>[] = [
  { accessorKey: 'typeOrTopic', header: 'Type/Topic' },
  {
    accessorKey: 'attempts',
    header: 'Forsøg',
    size: 90,
    cell: ({ row }) => String(row.getValue('attempts') ?? ''),
  },
  {
    accessorKey: 'runId',
    header: 'Run',
    size: 210,
    cell: ({ row }) => String(row.getValue('runId') ?? '—'),
  },
  {
    accessorKey: 'lastError',
    header: 'Seneste fejl',
    cell: ({ row }) => {
      const value = row.getValue('lastError') as string | null
      return value ? value : ''
    },
  },
]

function makeRetryColumn(options: { kind: 'job' | 'outbox' }): TableColumn<QueueListItem> {
  return {
    id: 'retry',
    header: '',
    enableSorting: false,
    cell: ({ row }) => {
      const id = row.original.id
      return h(
        UButton,
        {
          size: 'sm',
          color: 'primary',
          variant: 'soft',
          disabled: queuePending.value,
          onClick: async () => {
            try {
              const url =
                options.kind === 'job'
                  ? `/api/fejlhaandtering/jobs/${id}/retry`
                  : `/api/fejlhaandtering/outbox/${id}/retry`
              await $fetch(url, { method: 'POST' })
              await refreshQueue()
              toast.add({ title: 'Sat til genkørsel' })
            } catch (error) {
              console.error('Retry fejlede', error)
              toast.add({ title: 'Retry fejlede', color: 'error' })
            }
          },
        },
        () => 'Genkør',
      )
    },
  }
}

const jobColumns = computed(() => [...queueColumns, makeRetryColumn({ kind: 'job' })])
const outboxColumns = computed(() => [...queueColumns, makeRetryColumn({ kind: 'outbox' })])

const runningWorker = ref(false)
async function runWorkerNow() {
  runningWorker.value = true
  try {
    const res = await $fetch<{ success: boolean; jobs: number; outbox: number }>(
      '/api/fejlhaandtering/worker',
      { method: 'POST', body: { maxJobs: 25, maxOutbox: 50 } },
    )
    toast.add({
      title: 'Worker kørt',
      description: `Jobs: ${res.jobs}, outbox: ${res.outbox}`,
    })
    await refreshQueue()
  } catch (error) {
    console.error('Worker fejlede', error)
    toast.add({ title: 'Worker fejlede', color: 'error' })
  } finally {
    runningWorker.value = false
  }
}

const enqueuing = ref<'banking.ingest' | 'erp.ingestResponses' | null>(null)
async function enqueue(type: 'banking.ingest' | 'erp.ingestResponses') {
  enqueuing.value = type
  try {
    await $fetch('/api/fejlhaandtering/jobs/enqueue', {
      method: 'POST',
      body: { type },
    })
    toast.add({ title: 'Job oprettet', description: type })
    await refreshQueue()
  } catch (error) {
    console.error('Enqueue fejlede', error)
    toast.add({ title: 'Kunne ikke oprette job', color: 'error' })
  } finally {
    enqueuing.value = null
  }
}
</script>

<template>
  <UDashboardPanel id="recovery-queue">
    <template #header>
      <UDashboardNavbar title="Kø og genkørsel">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            variant="ghost"
            color="neutral"
            label="Opdatér"
            :loading="queuePending"
            @click="refreshQueue"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard>
        <template #header>
          <div class="flex flex-col gap-1">
            <div class="font-medium">Fejlhåndtering og genkørsel</div>
            <div class="text-sm text-muted">
              Genkørsel sker ved at sætte jobs/outbox tilbage til “pending” og lade worker håndtere retry.
            </div>
          </div>
        </template>

        <div class="flex flex-wrap items-center gap-2">
          <UButton
            icon="i-lucide-play"
            label="Kør worker nu"
            color="primary"
            variant="soft"
            :loading="runningWorker"
            @click="runWorkerNow"
          />
          <UButton
            icon="i-lucide-plus"
            label="Opret banking.ingest job"
            color="neutral"
            variant="soft"
            :loading="enqueuing === 'banking.ingest'"
            @click="enqueue('banking.ingest')"
          />
          <UButton
            icon="i-lucide-plus"
            label="Opret erp.ingestResponses job"
            color="neutral"
            variant="soft"
            :loading="enqueuing === 'erp.ingestResponses'"
            @click="enqueue('erp.ingestResponses')"
          />
        </div>

        <div class="grid gap-6 lg:grid-cols-2 mt-6">
          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="font-medium">Fejlede jobs</div>
              <UBadge color="neutral" variant="subtle">{{ (queue?.failedJobs?.length ?? 0) }}</UBadge>
            </div>
            <UEmpty
              v-if="!queue?.failedJobs?.length"
              icon="i-lucide-check"
              title="Ingen fejlede jobs"
              description="Der er ingen jobs med status 'failed'."
              class="border border-dashed border-default rounded-lg"
            />
            <UTable
              v-else
              :data="queue.failedJobs"
              :columns="jobColumns"
              :loading="queuePending"
              :ui="{
                base: 'border-separate border-spacing-0',
                thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                tbody: '[&>tr]:last:[&>td]:border-b-0',
                th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                td: 'border-b border-default',
                separator: 'h-0'
              }"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="font-medium">Fejlet outbox</div>
              <UBadge color="neutral" variant="subtle">{{ (queue?.failedOutbox?.length ?? 0) }}</UBadge>
            </div>
            <UEmpty
              v-if="!queue?.failedOutbox?.length"
              icon="i-lucide-check"
              title="Ingen fejlet outbox"
              description="Der er ingen outbox items med status 'failed'."
              class="border border-dashed border-default rounded-lg"
            />
            <UTable
              v-else
              :data="queue.failedOutbox"
              :columns="outboxColumns"
              :loading="queuePending"
              :ui="{
                base: 'border-separate border-spacing-0',
                thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                tbody: '[&>tr]:last:[&>td]:border-b-0',
                th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                td: 'border-b border-default',
                separator: 'h-0'
              }"
            />
          </div>
        </div>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
