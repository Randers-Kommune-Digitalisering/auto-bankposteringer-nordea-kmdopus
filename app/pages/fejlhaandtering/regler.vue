<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { RuleListDto } from '~/lib/db/schema/rule'

type RuleVersionItem = {
  version: number
  createdAt: string
  content: unknown
}

type RuleVersionsResponse = {
  ruleId: number
  currentVersion: number
  updatedAt: string
  versions: RuleVersionItem[]
}

const toast = useToast()
const UButton = resolveComponent('UButton')

const { data: rules, pending: rulesPending, refresh: refreshRules } = await useFetch<RuleListDto[]>('/api/rules', {
  key: 'rules',
  method: 'GET',
  default: () => [],
})

const ruleOptions = computed(() =>
  (rules.value ?? []).map((r) => ({
    value: r.id,
    label: `#${r.id} · ${r.status} · ${r.type}`,
  })),
)

const selectedRuleId = ref<number | null>(null)
const versionsLoading = ref(false)
const versionsData = ref<RuleVersionsResponse | null>(null)

async function loadRuleVersions() {
  if (!selectedRuleId.value) {
    versionsData.value = null
    return
  }

  versionsLoading.value = true
  try {
    versionsData.value = await $fetch<RuleVersionsResponse>(`/api/rule-versions/${selectedRuleId.value}`, {
      method: 'GET',
    })
  } finally {
    versionsLoading.value = false
  }
}

watch(selectedRuleId, () => {
  void loadRuleVersions()
})

async function rollbackRule(targetVersion: number) {
  const ruleId = selectedRuleId.value
  if (!ruleId) return

  const ok = window.confirm(
    `Vil du gendanne regel #${ruleId} til version ${targetVersion}?\n\nDette opretter en ny version, der kopierer den valgte version.`,
  )
  if (!ok) return

  try {
    const result = await $fetch<{ success: boolean; newVersion: number }>(`/api/rule-versions/${ruleId}/rollback`, {
      method: 'POST',
      body: { version: targetVersion },
    })

    toast.add({
      title: 'Regel gendannet',
      description: `Ny version: ${result.newVersion}`,
    })
    await refreshRules()
    await loadRuleVersions()
  } catch (error: any) {
    console.error('Rollback fejlede', error)
    toast.add({
      title: 'Rollback fejlede',
      description: error?.data?.message ?? 'Kunne ikke gendanne reglen. Prøv igen.',
      color: 'error',
    })
  }
}

const versionColumns: TableColumn<RuleVersionItem>[] = [
  { accessorKey: 'version', header: 'Version', size: 100 },
  { accessorKey: 'createdAt', header: 'Oprettet', size: 140 },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => {
      const v = row.original.version
      return h(
        UButton,
        {
          size: 'sm',
          color: 'primary',
          variant: 'soft',
          disabled: versionsLoading.value,
          onClick: () => rollbackRule(v),
        },
        () => 'Gendan',
      )
    },
  },
]
</script>

<template>
  <UDashboardPanel id="recovery-rules">
    <template #header>
      <UDashboardNavbar title="Rollback af regler">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            variant="ghost"
            color="neutral"
            label="Opdatér"
            :loading="rulesPending || versionsLoading"
            @click="() => { refreshRules(); loadRuleVersions(); }"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="font-medium">Vælg regel og gendan til en tidligere version</div>
              <div class="text-sm text-muted">Gendannelse opretter altid en ny version (audit-friendly).</div>
            </div>
            <UBadge
              v-if="versionsData"
              color="neutral"
              variant="subtle"
              class="whitespace-nowrap"
            >
              Nuværende: v{{ versionsData.currentVersion }}
            </UBadge>
          </div>
        </template>

        <div class="grid gap-4 md:grid-cols-3">
          <div class="md:col-span-2">
            <UFormField label="Regel">
              <USelectMenu
                v-model="selectedRuleId"
                :items="ruleOptions"
                valueKey="value"
                labelKey="label"
                placeholder="Vælg en regel"
                :loading="rulesPending"
              />
            </UFormField>
          </div>
          <div class="flex items-end">
            <UButton
              class="w-full"
              icon="i-lucide-list"
              label="Hent versioner"
              color="neutral"
              variant="soft"
              :disabled="!selectedRuleId"
              :loading="versionsLoading"
              @click="loadRuleVersions"
            />
          </div>
        </div>

        <UEmpty
          v-if="selectedRuleId && !versionsLoading && (!versionsData || !versionsData.versions.length)"
          icon="i-lucide-archive"
          title="Ingen versionshistorik"
          description="Der blev ikke fundet nogen rule_versions for den valgte regel."
          class="border border-dashed border-default rounded-lg mt-4"
        />

        <UTable
          v-else-if="versionsData"
          class="mt-4"
          :data="versionsData.versions"
          :columns="versionColumns"
          :loading="versionsLoading"
          :ui="{
            base: 'border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
            td: 'border-b border-default',
            separator: 'h-0'
          }"
        />
      </UCard>
    </template>
  </UDashboardPanel>
</template>
