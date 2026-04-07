<script setup lang="ts">
import { z } from 'zod'
import type { AccountSelectSchema } from '~/lib/db/schema/account'

const props = defineProps<{
  open: boolean
  accountId: string | null
}>()

const isEdit = computed(() => props.accountId !== null)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'saved'): void
}>()

const open = computed({
  get: () => props.open,
  set: v => emit('update:open', v)
})

const toast = useToast()

const baseSchema = z.object({
  id: z.string().min(1, 'Bankkonto-id er påkrævet'),
  name: z.string().trim().max(80, 'Kaldenavn er for langt').optional(),
  provider: z.enum(['danskebank', 'nordea', 'bankconnect'], { message: 'Vælg bankudbyder' }),
  statusAccount: z.preprocess((value) => {
    if (typeof value === 'string' && value.trim() !== '') return Number(value)
    return value
  }, z.number('Statuskonto er påkrævet').int('Skal være et helt tal'))
})

const updateSchema = baseSchema
  .pick({ statusAccount: true, name: true })
  .extend({ provider: baseSchema.shape.provider.optional() })
const formSchema = computed(() => (isEdit.value ? updateSchema : baseSchema))

type FormState = {
  id: string | undefined
  name: string | undefined
  provider: 'danskebank' | 'nordea' | 'bankconnect' | undefined
  statusAccount: string | undefined
}

const state = reactive<FormState>({
  id: undefined,
  name: undefined,
  provider: undefined,
  statusAccount: undefined
})

function resetForm() {
  state.id = undefined
  state.name = undefined
  state.provider = undefined
  state.statusAccount = undefined
}

function hydrateDraft(account: AccountSelectSchema) {
  state.id = account.id
  state.name = account.name ?? undefined
  state.provider = account.provider
  state.statusAccount = String(account.statusAccount)
}

watch(
  () => [props.accountId, open.value] as const,
  async ([id, isOpen]) => {
    if (!isOpen) {
      resetForm()
      return
    }

    if (!id) {
      resetForm()
      return
    }

    try {
      const data = await $fetch<AccountSelectSchema>(`/api/bank-accounts/${id}`)
      hydrateDraft(data)
    } catch (err) {
      console.error('Fejl ved hentning af konto', err)
      resetForm()
    }
  },
  { immediate: true }
)

async function onSubmit() {
  const payload = {
    id: state.id?.trim(),
    name: state.name?.trim() || undefined,
    provider: state.provider,
    statusAccount: Number(state.statusAccount)
  }

  const result = formSchema.value.safeParse(payload)
  if (!result.success) {
    console.error(result.error)
    return
  }
  
  try {
    if (isEdit.value && props.accountId) {
      await $fetch(`/api/bank-accounts/${props.accountId}`, {
        method: 'PUT',
        body: { statusAccount: payload.statusAccount, name: payload.name }
      })
      toast.add({ title: 'Bankkonto opdateret', description: `${props.accountId} er opdateret.` })
    } else {
      await $fetch('/api/bank-accounts', {
        method: 'POST',
        body: payload
      })
      toast.add({ title: 'Bankkonto oprettet', description: `${payload.id} er oprettet.` })
    }

    open.value = false
    emit('saved')
    resetForm()
  } catch (error) {
    toast.add({
      title: 'Fejl ved lagring',
      description: isEdit.value ? 'Fejl ved opdatering.' : 'Fejl ved oprettelse.',
      color: 'error'
    })
  }
}
</script>

<template>
  <UModal v-model:open="open">
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">
          {{ isEdit ? `Rediger bankkonto ${props.accountId}` : 'Ny bankkonto' }}
        </h2>
      </div>
    </template>

    <template #body>
      <UForm :schema="formSchema" :state="state" @submit="onSubmit">
        <div
          class="mt-4 p-4 rounded-md border border-default space-y-4"
        >

          <UFormField label="Bankudbyder" name="provider" required>
            <USelect
              v-model="state.provider"
              :disabled="isEdit"
              :items="[
                { label: 'Danske Bank', value: 'danskebank' },
                { label: 'Nordea', value: 'nordea' },
                { label: 'Bank Connect', value: 'bankconnect' }
              ]"
              labelKey="label"
              valueKey="value"
              placeholder="Vælg bankudbyder"
              class="w-full"
            />
          </UFormField>

          <UFormField name="id" required>
            <UiFloatingLabelInput
              v-model="state.id"
              :disabled="isEdit"
              label="Bankkonto"
              required
              color="neutral"
              class="w-full"
            />
          </UFormField>

          <UFormField name="name">
            <UiFloatingLabelInput
              v-model="state.name"
              label="Kaldenavn"
              color="neutral"
              class="w-full"
            />
          </UFormField>

          <UFormField name="statusAccount" required>
            <UiFloatingLabelInput
              v-model="state.statusAccount"
              label="Statuskonto"
              required
              color="neutral"
              type="number"
              :format-options="{
                maximumFractionDigits: 0,
                useGrouping: false
              }"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- FOOTER -->
        <div class="flex justify-between gap-2 pt-4 mt-6 border-t border-default">
          <UButton
            label="Annuller"
            variant="soft"
            color="neutral"
            @click="open = false"
          />

          <UButton
            type="submit"
            color="primary"
          >
            {{ isEdit ? 'Opdater bankkonto' : 'Opret bankkonto' }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
