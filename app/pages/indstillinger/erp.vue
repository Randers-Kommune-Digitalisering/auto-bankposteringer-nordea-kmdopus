<script setup lang="ts">
interface ErpMetadataResponse {
  erpSupplier: string
  erpErrorAccount: string
  activeIntegration: boolean
  prodEnvironment: string
  municipalityCode: string
  compCode: string
  integrationId: string
  integrationFileNameMask: string
}

type AccountingDimensionDefinition = {
  id: string
  key: string
  required: boolean
  sortOrder: number
}

type AccountingDimensionsResponse = {
  erpSupplier: string
  dimensions: AccountingDimensionDefinition[]
}

const { data: erpMetadata } = await useFetch<ErpMetadataResponse>(
  '/api/settings/erp-metadata',
  {
    key: 'erp-metadata',
    default: () => ({
      erpSupplier: '',
      erpErrorAccount: '',
      activeIntegration: false,
      prodEnvironment: '',
      municipalityCode: '',
      compCode: '',
      integrationId: '',
      integrationFileNameMask: '',
    })
  }
)

const { data: accountingDimensions } = await useFetch<AccountingDimensionsResponse>(
  '/api/settings/accounting-dimensions',
  {
    key: 'accounting-dimensions-settings',
    default: () => ({ erpSupplier: '', dimensions: [] }),
  },
)

const metadataFields = computed(() => [
  { label: 'ERP Leverandør', value: erpMetadata.value?.erpSupplier ?? '—' },
  { label: 'Fejlkonto', value: erpMetadata.value?.erpErrorAccount ?? '—' },
  { label: 'Integration aktiv', value: (erpMetadata.value?.activeIntegration ?? false) ? 'Aktiv' : 'Inaktiv' },
  { label: 'Miljø', value: erpMetadata.value?.prodEnvironment ?? '—' },
  { label: 'Kommunekode', value: erpMetadata.value?.municipalityCode ?? '—' },
  { label: 'Comp kode', value: erpMetadata.value?.compCode ?? '—' },
  { label: 'Integration ID', value: erpMetadata.value?.integrationId ?? '—' },
  { label: 'Filnavn-mask', value: erpMetadata.value?.integrationFileNameMask ?? '—' },
])

const dimensionFields = computed(() => {
  const dims = accountingDimensions.value?.dimensions ?? []
  return dims.map((d) => ({
    label: `Konteringsdimension: ${d.key}`,
    value: d.required ? 'Påkrævet' : 'Valgfri',
  }))
})
</script>

<template>
  <UDashboardPanel id="settings-erp">
    <template #header>
      <UDashboardNavbar title="ERP Integration">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <section class="space-y-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">ERP metadata</p>
          <p class="text-sm text-muted">Alle værdier er hentet fra din .env fil og kan ikke redigeres i UI'et.</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="field in metadataFields"
            :key="field.label"
            class="flex flex-col gap-1"
          >
            <span class="text-xs font-semibold text-muted">{{ field.label }}</span>
            <UInput
              :model-value="field.value"
              readonly
              class="font-mono text-sm"
            />
          </div>
        </div>
      </section>

      <section class="space-y-3 mt-8">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Konteringsdimensioner</p>
          <p class="text-sm text-muted">Hentes dynamisk fra databasen for aktiv ERP leverandør.</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="field in dimensionFields"
            :key="field.label"
            class="flex flex-col gap-1"
          >
            <span class="text-xs font-semibold text-muted">{{ field.label }}</span>
            <UInput
              :model-value="field.value"
              readonly
              class="font-mono text-sm"
            />
          </div>
        </div>
      </section>
    </template>
  </UDashboardPanel>
</template>
