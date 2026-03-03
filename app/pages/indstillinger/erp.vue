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
  primaryAccountLabel: string
  secondaryAccountLabel: string
  tertiaryAccountLabel: string
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
      primaryAccountLabel: '',
      secondaryAccountLabel: '',
      tertiaryAccountLabel: ''
    })
  }
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
  { label: 'Primær konto label', value: erpMetadata.value?.primaryAccountLabel ?? '—' },
  { label: 'Sekundær konto label', value: erpMetadata.value?.secondaryAccountLabel ?? '—' },
  { label: 'Tertiær konto label', value: erpMetadata.value?.tertiaryAccountLabel ?? '—' }
])
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
    </template>
  </UDashboardPanel>
</template>
