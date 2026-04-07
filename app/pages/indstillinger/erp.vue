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
  constraints: Array<{
    id: string
    ifKey: string
    kind: string
    members: string[]
  }>
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
    default: () => ({ erpSupplier: '', dimensions: [], constraints: [] }),
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

const constraintFields = computed(() => {
  const constraints = accountingDimensions.value?.constraints ?? []

  return constraints.map((c) => {
    const members = (c.members ?? []).join(' / ')
    const prefix = c.kind === 'requires_any_of'
      ? 'skal mindst én af'
      : c.kind === 'requires_exactly_one_of'
        ? 'skal præcist én af'
        : 'skal også'

    return {
      label: `Regel: ${c.ifKey}`,
      value: `Når '${c.ifKey}' er udfyldt, ${prefix} [${members}] være udfyldt`,
    }
  })
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
          <p class="text-sm text-muted">Alle værdier er gemt som miljøvariabler og kan ikke redigeres her.</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="field in metadataFields"
            :key="field.label"
            class="flex flex-col gap-1"
          >
            <UiFloatingLabelInput
              :model-value="field.value"
              :label="field.label"
              readonly
              color="neutral"
              class="font-mono text-sm"
            />
          </div>
        </div>
      </section>
    </template>
  </UDashboardPanel>
</template>
