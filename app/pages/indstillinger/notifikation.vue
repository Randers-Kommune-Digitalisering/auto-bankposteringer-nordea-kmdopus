<script setup lang="ts">
const toast = useToast()

const placeholders = {
  amount: '{{amount}}',
  bookingDate: '{{bookingDate}}',
  counterpart: '{{counterpart}}',
  allDimensions: '{{all_dimensions}}',
  postingText: '{{postingText}}',
}

type TemplateResponse = { mailTemplate: string; adminEmail: string | null }

const { data, refresh } = await useFetch<TemplateResponse, Error, TemplateResponse>('/api/settings/notification-template', {
  key: 'notification-template',
  default: (): TemplateResponse => ({ mailTemplate: '', adminEmail: null }),
})

const state = reactive({
  mailTemplate: data.value?.mailTemplate ?? '',
  adminEmail: data.value?.adminEmail ?? '',
})

watchEffect(() => {
  if (data.value?.mailTemplate != null) {
    state.mailTemplate = data.value.mailTemplate
  }
  if (data.value?.adminEmail != null) {
    state.adminEmail = data.value.adminEmail ?? ''
  }
})

async function save() {
  const res: any = await $fetch('/api/settings/notification-template', {
    method: 'PUT',
    body: { mailTemplate: state.mailTemplate, adminEmail: state.adminEmail },
  })

  if (!res?.ok) {
    toast.add({ title: 'Kunne ikke gemme skabelon', color: 'error' })
    return
  }

  toast.add({ title: 'Skabelon gemt', color: 'success' })
  await refresh()
}
</script>

<template>
  <UDashboardPanel id="settings-notification">
    <template #header>
      <UDashboardNavbar title="Notifikation">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <section class="space-y-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Administrator e-mail</p>
          <p class="text-sm text-muted">Bruges til systempåmindelser (fx certifikater der udløber snart).</p>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <UiFloatingLabelInput
            v-model="state.adminEmail"
            label="E-mail"
            size="sm"
            color="neutral"
            class="w-full"
          />
        </div>

        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">E-mail skabelon</p>
          <p class="text-sm text-muted">
            Brug placeholders:
            <span class="font-mono" v-text="placeholders.amount" />,
            <span class="font-mono" v-text="placeholders.counterpart" />,
            <span class="font-mono" v-text="placeholders.postingText" />,
            <span class="font-mono" v-text="placeholders.bookingDate" />,
            og
            <span class="font-mono" v-text="placeholders.allDimensions" />.
          </p>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <UTextarea
            v-model="state.mailTemplate"
            autoresize
            class="lg:col-span-2"
          />
        </div>

        <div class="flex gap-2">
          <UButton @click="save">Gem</UButton>
        </div>
      </section>
    </template>
  </UDashboardPanel>
</template>
