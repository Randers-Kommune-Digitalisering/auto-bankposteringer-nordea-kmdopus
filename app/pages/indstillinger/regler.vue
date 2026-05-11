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

type RuleImportError = {
  row: number
  field?: string
  message: string
}

type RuleImportResponseSuccess = {
  success: true
  dryRun: boolean
  totalRows: number
  importedCount?: number
  ruleIds?: number[]
}

type RuleImportResponseFail = {
  success: false
  totalRows: number
  errors: RuleImportError[]
}

type RuleImportResponse = RuleImportResponseSuccess | RuleImportResponseFail

const toast = useToast()
const UButton = resolveComponent('UButton')

// ----------------
// Rollback section
// ----------------
const { data: rules, pending: rulesPending, refresh: refreshRules } = await useFetch<RuleListDto[]>('/api/rules', {
  key: 'rules',
  method: 'GET',
  deep: true,
  transform: (v) => Array.isArray(v) ? v.slice() : [],
  default: () => [],
})

const ruleOptions = computed(() =>
  (rules.value ?? []).map((r) => ({
    value: r.id,
    label: `#${r.id} · ${r.status} · ${r.type}`,
  })),
)

const selectedRuleId = ref<number | undefined>(undefined)
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

// -------------------
// Bulk import (CSV)
// -------------------
const csvFiles = ref<File | null>(null)
const csvText = ref<string | null>(null)
const importLoading = ref(false)
const validateLoading = ref(false)
const lastValidation = ref<RuleImportResponse | null>(null)

watch(csvFiles, async (file) => {
  lastValidation.value = null
  csvText.value = null
  if (!file) return
  csvText.value = await file.text()
})

const canValidate = computed(() => Boolean(csvText.value?.trim().length))
const hasErrors = computed(() => lastValidation.value?.success === false)
const validatedOk = computed(() => lastValidation.value?.success === true && lastValidation.value.dryRun)

async function validateCsv() {
  if (!csvText.value) return
  validateLoading.value = true
  try {
    lastValidation.value = await $fetch<RuleImportResponse>('/api/rules/import?dryRun=1', {
      method: 'POST',
      body: { csv: csvText.value },
    })

    if (lastValidation.value.success) {
      toast.add({
        title: 'CSV valideret',
        description: `Rækker: ${lastValidation.value.totalRows}`,
      })
    }
  } catch (error: any) {
    console.error('Validering fejlede', error)
    toast.add({
      title: 'Validering fejlede',
      description: error?.data?.message ?? 'Kunne ikke validere filen. Prøv igen.',
      color: 'error',
    })
  } finally {
    validateLoading.value = false
  }
}

async function importCsv() {
  if (!csvText.value) return
  importLoading.value = true
  try {
    const res = await $fetch<RuleImportResponse>('/api/rules/import', {
      method: 'POST',
      body: { csv: csvText.value },
    })
    lastValidation.value = res

    if (res.success) {
      toast.add({
        title: 'Regler importeret',
        description: `Importerede: ${res.importedCount ?? 0}`,
      })
      await refreshRules()
    } else {
      toast.add({
        title: 'Import fejlede',
        description: `Der er ${res.errors.length} fejl i CSV'en`,
        color: 'error',
      })
    }
  } catch (error: any) {
    console.error('Import fejlede', error)
    toast.add({
      title: 'Import fejlede',
      description: error?.data?.message ?? 'Kunne ikke importere filen. Prøv igen.',
      color: 'error',
    })
  } finally {
    importLoading.value = false
  }
}

const errorPreview = computed(() => {
  const v = lastValidation.value
  if (!v || v.success) return []
  return v.errors.slice(0, 25)
})

const importErrorsTableKey = computed(() => errorPreview.value.map((e) => `${e.row}:${e.field ?? ''}:${e.message}`).join('|'))

const versionsTableKey = computed(() => (versionsData.value?.versions ?? []).map((v) => String(v.version)).join('|'))
</script>

<template>
  <UDashboardPanel id="settings-rules">
    <template #header>
      <UDashboardNavbar title="Regeladministration">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="solar:refresh-bold-duotone"
            variant="ghost"
            color="primary"
            label="Opdater"
            :loading="rulesPending || versionsLoading || validateLoading || importLoading"
            @click="() => { refreshRules(); loadRuleVersions(); }"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid gap-6">
        <UCard>
          <template #header>
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="font-medium">Masseindlæsning af regler (CSV)</div>
                <div class="text-sm text-muted space-y-3 max-w-2xl">
                  <p>Download skabelon, udfyld og upload. Eksport giver en CSV, der kan uploades igen (roundtrip).</p>

                  <details class="rounded-md border border-default bg-elevated/25 p-3">
                    <summary class="cursor-pointer select-none font-medium text-foreground">Multiværdier (flere værdier i én celle)</summary>
                    <div class="mt-2 space-y-2">
                      <ul class="list-disc pl-5 space-y-1">
                        <li>Brug <span class="font-mono">&amp;</span> til flere værdier: <span class="font-mono">a &amp; b &amp; c</span> (anbefalet).</li>
                        <li><span class="font-mono">,</span> og <span class="font-mono">|</span> accepteres også (legacy), men vi anbefaler <span class="font-mono">&amp;</span>.</li>
                        <li>Escape separatorer inde i en værdi: <span class="font-mono">\&amp;</span>, <span class="font-mono">\,</span>, <span class="font-mono">\|</span>.</li>
                        <li>Literal backslash: skriv <span class="font-mono">\\</span>.</li>
                      </ul>
                    </div>
                  </details>

                  <details class="rounded-md border border-default bg-elevated/25 p-3">
                    <summary class="cursor-pointer select-none font-medium text-foreground">Operatorer (eq, ilike, …)</summary>
                    <div class="mt-2 space-y-2">
                      <ul class="list-disc pl-5 space-y-1">
                        <li><span class="font-mono">eq</span> = eksakt match (standard).</li>
                        <li><span class="font-mono">ilike</span> = “indeholder” (case-insensitive).</li>
                        <li><span class="font-mono">matchOperator</span> bruges som standard for <span class="font-mono">matchReferences</span>/<span class="font-mono">matchCounterparties</span>/<span class="font-mono">matchClassification</span>.</li>
                        <li>I avancerede <span class="font-mono">field_*</span>-kolonner kan du vælge operator pr. værdi med prefix: <span class="font-mono">eq:123</span>, <span class="font-mono">ilike:randers</span> (osv.).</li>
                      </ul>
                    </div>
                  </details>

                  <details class="rounded-md border border-default bg-elevated/25 p-3">
                    <summary class="cursor-pointer select-none font-medium text-foreground">Skabeloner og eksport</summary>
                    <div class="mt-2 space-y-2">
                      <ul class="list-disc pl-5 space-y-1">
                        <li>CSV bruger semikolon (<span class="font-mono">;</span>) som kolonne-separator.</li>
                        <li><span class="font-mono">dim_*</span> er ERP-dimensioner (fx <span class="font-mono">dim_artskonto</span>).</li>
                        <li>Udvidet skabelon tilføjer <span class="font-mono">field_*</span> for feltspecifik matching.</li>
                        <li>Eksport bruger udvidet format, så <span class="font-mono">matchReferences</span>/<span class="font-mono">matchCounterparties</span>/<span class="font-mono">matchClassification</span> kan godt være tomme selv om reglen matcher.</li>
                      </ul>
                    </div>
                  </details>
                </div>
              </div>
              <div class="flex flex-col items-stretch gap-2 min-w-64">
                <UButton
                  icon="solar:clipboard-list-bold-duotone"
                  color="neutral"
                  variant="soft"
                  label="Skabelon"
                  to="/api/rules/template"
                  target="_blank"
                />
                <UButton
                  icon="solar:clipboard-add-bold-duotone"
                  color="neutral"
                  variant="soft"
                  label="Udvidet skabelon"
                  to="/api/rules/template?variant=advanced"
                  target="_blank"
                />
                <UButton
                  icon="solar:download-bold-duotone"
                  color="primary"
                  variant="soft"
                  label="Download alle regler"
                  to="/api/rules/export?variant=advanced"
                  target="_blank"
                />
              </div>
            </div>
          </template>

          <div class="grid gap-4">
            <UFileUpload
              v-model="csvFiles"
              icon="solar:upload-bold-duotone"
              label="Upload CSV"
              description=".csv"
              layout="list"
              :multiple="false"
              accept=".csv,text/csv"
              class="w-full min-h-28"
            />

            <div class="flex flex-wrap gap-2">
              <UButton
                icon="solar:shield-check-bold-duotone"
                label="Kontrollér fil"
                color="primary"
                variant="soft"
                :disabled="!canValidate"
                :loading="validateLoading"
                @click="validateCsv"
              />
              <UButton
                icon="solar:database-bold-duotone"
                label="Importér"
                color="primary"
                :disabled="!validatedOk || hasErrors"
                :loading="importLoading"
                @click="importCsv"
              />
            </div>

            <UAlert
              v-if="lastValidation && lastValidation.success"
              color="success"
              variant="soft"
              title="CSV er OK"
              :description="`Valideret ${lastValidation.totalRows} række(r).`"
            />

            <UAlert
              v-else-if="lastValidation && !lastValidation.success"
              color="error"
              variant="soft"
              title="CSV har fejl"
              :description="`Fejl fundet: ${lastValidation.errors.length}. Viser de første ${errorPreview.length}.`"
            />

            <UTable
              v-if="errorPreview.length"
              :key="importErrorsTableKey"
              :data="errorPreview"
              :columns="[
                { accessorKey: 'row', header: 'Række' },
                { accessorKey: 'field', header: 'Felt' },
                { accessorKey: 'message', header: 'Fejl' },
              ]"
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
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="font-medium">Rollback af regler</div>
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
                icon="solar:list-bold-duotone"
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
            icon="solar:archive-bold-duotone"
            title="Ingen versionshistorik"
            description="Der blev ikke fundet nogen rule_versions for den valgte regel."
            class="border border-dashed border-default rounded-lg mt-4"
          />

          <UTable
            v-else-if="versionsData"
            :key="versionsTableKey"
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
      </div>
    </template>
  </UDashboardPanel>
</template>
