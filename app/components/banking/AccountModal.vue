<script setup lang="ts">
import { z } from 'zod'
import type { AccountSelectSchema } from '~/lib/db/schema/account'

type BankProvider = 'danskebank' | 'nordea' | 'bankconnect'

const props = defineProps<{
  open: boolean
  accountId: string | null
  mode?: 'observed' | 'configured'
  configuredDraft?: { provider: BankProvider; iban: string; name?: string | null; statuskonto?: string | null; artskonto?: string | null } | null
  configuredProviders?: BankProvider[]
}>()

const mode = computed(() => props.mode ?? 'observed')
const isEditObserved = computed(() => mode.value === 'observed' && props.accountId !== null)
const isConfiguredMode = computed(() => mode.value === 'configured')

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'saved'): void
}>()

const open = computed({
  get: () => props.open,
  set: v => emit('update:open', v)
})

const toast = useToast()

type AccountingDimensionDefinition = {
  id: string
  key: string
  required: boolean
  sortOrder: number
  valueRegex?: string | null
  valueRegexFlags?: string | null
}

type AccountingDimensionsResponse = {
  erpSupplier: string
  dimensions: AccountingDimensionDefinition[]
  constraints: unknown[]
}

const {
  data: accountingDimensionConfig,
  pending: accountingDimensionPending,
  error: accountingDimensionError,
  refresh: refreshAccountingDimensions,
} = await useFetch<AccountingDimensionsResponse>('/api/settings/accounting-dimensions', {
  key: 'accounting-dimensions',
  // Match RuleModal behavior: fetch eagerly (client-side) so validation is ready when modal opens.
  server: false,
})

const isAccountingDimensionConfigReady = computed(() =>
  !accountingDimensionPending.value && !accountingDimensionError.value,
)

const statuskontoDefinition = computed(() =>
  (accountingDimensionConfig.value?.dimensions ?? []).find((d) => d.key === 'statuskonto') ?? null,
)

function normalizeIban(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase()
}

const ibanSchema = z
  .string()
  .transform((v) => normalizeIban(String(v ?? '')))
  .refine((v) => {
    if (v.startsWith('DK')) return v.length === 18
    return v.length >= 15 && v.length <= 34
  }, 'Ugyldig IBAN længde')
  .refine((v) => {
    if (v.startsWith('DK')) return /^DK\d{16}$/.test(v)
    return /^[A-Z]{2}[0-9A-Z]{13,32}$/.test(v)
  }, 'Ugyldig IBAN format')

const statuskontoSchema = computed(() => {
  let schema = z
    .string()
    .trim()
    .min(1, 'Statuskonto er påkrævet')
    .max(32, 'Statuskonto er for langt')
    .refine((v) => !/\s/.test(v), 'Statuskonto må ikke indeholde mellemrum')

  const supplier = String((accountingDimensionConfig.value as any)?.erpSupplier ?? '').trim().toLowerCase()
  if (supplier === 'kmd') {
    schema = schema.refine((v) => /^905\d{5}$/.test(v), 'Statuskonto skal være artskonto i formatet 905XXXXX')
  }

  const def = statuskontoDefinition.value
  const reSource = def?.valueRegex ?? null
  if (!reSource) return schema

  let re: RegExp
  try {
    re = new RegExp(reSource, def?.valueRegexFlags ?? '')
  } catch {
    // Misconfigured regex in DB; keep UI usable but avoid false positives.
    return schema
  }

  return schema.refine((v) => re.test(v), 'Ugyldigt format for statuskonto (valideres mod ERP)')
})

const observedUpdateSchema = computed(() =>
  z.object({
    name: z.string().trim().max(80, 'Kaldenavn er for langt').optional(),
    statuskonto: statuskontoSchema.value,
  }),
)

const configuredSchema = computed(() =>
  z.object({
    provider: z.enum(['danskebank', 'nordea', 'bankconnect'], { message: 'Vælg bankudbyder' }),
    iban: ibanSchema,
    name: z.string().trim().max(80, 'Kaldenavn er for langt').optional(),
    statuskonto: statuskontoSchema.value,
  }),
)

const formSchema = computed(() => (isConfiguredMode.value ? configuredSchema.value : observedUpdateSchema.value))

type FormState = {
  name: string | undefined
  statuskonto: string | undefined
  provider: BankProvider | undefined
  iban: string | undefined
}

const state = reactive<FormState>({
  name: undefined,
  statuskonto: undefined,
  provider: undefined,
  iban: undefined,
})

function resetForm() {
  state.name = undefined
  state.statuskonto = undefined
  state.provider = undefined
  state.iban = undefined
}

function hydrateDraft(account: AccountSelectSchema) {
  state.name = account.name ?? undefined
  state.statuskonto = String((account as any).statuskonto ?? (account as any).artskonto ?? '') || undefined
}

function hydrateConfiguredDraft(draft: { provider: BankProvider; iban: string; name?: string | null; statuskonto?: string | null; artskonto?: string | null }) {
  state.provider = draft.provider
  state.iban = draft.iban
  state.name = draft.name ?? undefined
  state.statuskonto = (draft.statuskonto ?? draft.artskonto) ?? undefined
}

watch(
  () => [props.accountId, open.value] as const,
  async ([id, isOpen]) => {
    if (!isOpen) {
      resetForm()
      return
    }

    // Ensure ERP-driven validation config is available when the modal is opened.
    if (!isAccountingDimensionConfigReady.value) {
      await refreshAccountingDimensions().catch(() => {})
    }

    if (isConfiguredMode.value) {
      if (props.configuredDraft) {
        hydrateConfiguredDraft(props.configuredDraft)
      } else {
        resetForm()
      }
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
  try {
    if (!isAccountingDimensionConfigReady.value) {
      toast.add({
        title: 'Konteringsvalidering ikke klar',
        description: 'Kunne ikke hente ERP-dimensioner. Prøv igen om et øjeblik.',
        color: 'warning',
      })
      return
    }

    if (isConfiguredMode.value) {
      const payload = {
        provider: state.provider,
        iban: state.iban,
        name: state.name?.trim() || undefined,
        statuskonto: state.statuskonto?.trim() || undefined,
      }

      const result = formSchema.value.safeParse(payload)
      if (!result.success) {
        const msg = result.error.issues?.[0]?.message ?? 'Ugyldigt input'
        toast.add({ title: 'Ugyldigt input', description: msg, color: 'warning' })
        return
      }

      await $fetch('/api/banking-accounts', {
        method: 'POST',
        body: result.data,
      })

      toast.add({ title: 'Bankkonto oprettet', description: `${result.data.iban} er tilføjet til API.` })
    } else {
      if (!props.accountId) return

      const payload = {
        name: state.name?.trim() || undefined,
        statuskonto: state.statuskonto?.trim() || undefined,
      }

      const result = formSchema.value.safeParse(payload)
      if (!result.success) {
        const msg = result.error.issues?.[0]?.message ?? 'Ugyldigt input'
        toast.add({ title: 'Ugyldigt input', description: msg, color: 'warning' })
        return
      }

      await $fetch(`/api/bank-accounts/${props.accountId}`, {
        method: 'PUT',
        body: { name: result.data.name, statuskonto: result.data.statuskonto },
      })
      toast.add({ title: 'Bankkonto opdateret', description: `${props.accountId} er opdateret.` })
    }

    open.value = false
    emit('saved')
    resetForm()
  } catch (error) {
    toast.add({
      title: 'Fejl ved lagring',
      description: 'Fejl ved opdatering.',
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
          <template v-if="isConfiguredMode">
            Ny bankkonto (API)
          </template>
          <template v-else>
            {{ isEditObserved ? `Rediger bankkonto ${props.accountId}` : 'Rediger bankkonto' }}
          </template>
        </h2>
      </div>
    </template>

    <template #body>
      <UForm :schema="formSchema" :state="state" @submit="onSubmit">
        <div
          class="mt-4 p-4 rounded-md border border-default space-y-4"
        >
          <template v-if="isConfiguredMode">
            <UFormField label="Aftale" name="provider" required>
              <USelect
                v-model="state.provider"
                :items="(props.configuredProviders ?? ['nordea','danskebank','bankconnect']).map(p => ({
                  label: p === 'nordea' ? 'Nordea' : p === 'danskebank' ? 'Danske Bank' : 'Bank Connect',
                  value: p
                }))"
                labelKey="label"
                valueKey="value"
                placeholder="Vælg aftale"
                class="w-full"
              />
            </UFormField>

            <UFormField name="iban" required>
              <UiFloatingLabelInput
                v-model="state.iban"
                label="IBAN"
                required
                color="neutral"
                class="w-full"
              />
            </UFormField>
          </template>

          <UFormField name="name">
            <UiFloatingLabelInput
              v-model="state.name"
              label="Kaldenavn"
              color="neutral"
              class="w-full"
            />
          </UFormField>

          <UFormField name="statuskonto" required>
            <UiFloatingLabelInput
              v-model="state.statuskonto"
              label="Statuskonto"
              required
              color="neutral"
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
            {{ isConfiguredMode ? 'Tilføj bankkonto' : 'Opdater bankkonto' }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
