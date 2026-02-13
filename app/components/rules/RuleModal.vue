<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type {
  AccountSelectSchema,
  RuleDraftSchema,
  RuleStatus,
  RuleType,
  CprType,
  MatchField,
  MatchEntry,
  MatchGate,
  MatchCategory
} from '~/lib/db/schema/index'
import {
  matchFieldOptionsByCategory,
  ruleTypeValues,
  ruleStatusValues,
  cprTypeValues,
  matchCategories,
  matchCategoryColumns,
  ruleBasicSchema,
  ruleMatchingSchema,
  ruleAccountingSchema
} from '~/lib/db/schema/index'

const props = defineProps<{
  open?: boolean
  ruleId?: number | null
}>()

const isEdit = computed(() => props.ruleId != null)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'saved'): void
}>()

const open = computed({
  get: () => props.open ?? false,
  set: v => emit('update:open', v)
})

const currentStep = ref(0)
const toast = useToast()
const formRef = ref<any>()

const steps = [
  { id: 'basic', title: 'Basis', description: 'Vælg type, status og bankkonto' },
  { id: 'match', title: 'Matching', description: 'Vælg hvilke kendetegn reglen skal matche ud fra' },
  { id: 'accounting', title: 'Kontering', description: 'Angiv oplysninger relevant for bogføringen' }
]

// --------------------
// Load rule if editing
// --------------------
const isLocked = computed(() => {
  // Hvis lockedAt eksisterer og stadig er indenfor timeout (fx 5 minutter)
  if (!state.lockedAt) return false
  const lockTime = new Date(state.lockedAt).getTime()
  const now = Date.now()
  return now - lockTime < 5 * 60 * 1000
})

function hydrateDraft(rule: RuleDraftSchema & { matches?: MatchEntry[] }) {
  Object.assign(state, {
    ...rule,
    matches: undefined
  })

  matches.value = rule.matches ?? []
}

watchEffect(async () => {
  if (!props.ruleId) return
  
  const data = await $fetch<RuleDraftSchema>(`/api/rule/${props.ruleId}`)
  
  hydrateDraft(data)
})

// ---------------
// Fetch rule tags
// ---------------
type RuleTag = { id: string; name: string }
const { data: ruleTagsData } = await useFetch<RuleTag[]>('/api/rule-tags', { key: 'ruletags' })
const ruleTagOptions = computed(() =>
  (ruleTagsData.value ?? []).map(tag => ({
    label: tag.name,
    value: tag.id
  }))
)

// ---------------------
// Match object handlers
// ---------------------
const matches = ref<MatchEntry[]>([])

function initCategoryRecord<T>(
  initial: () => T
): Record<MatchCategory, T> {
  const record = {} as Record<MatchCategory, T>
  for (const category of matchCategories) {
    record[category] = initial()
  }
  return record
}

const selectedColumns = reactive(
  initCategoryRecord<MatchField[]>(() => [])
)

const matchInputs = reactive(
  initCategoryRecord<string>(() => '')
)

const matchCategoryGates = reactive(
  initCategoryRecord<MatchGate>(() => 'OG')
)

const matchModes = reactive(
  initCategoryRecord<'Alle felter' | 'Vælg felter'>(() => 'Alle felter')
)

const addMatchEntry = (category: MatchCategory, mode: 'Alle felter' | 'Vælg felter') => {
  const value = matchInputs[category].trim()
  if (!value) return

  // Sæt gate baseret på mode
  if (mode === 'Alle felter' || (mode === 'Vælg felter' && selectedColumns[category].length > 1)) {
    matchCategoryGates[category] = 'ELLER'
  } else if (mode === 'Vælg felter' && selectedColumns[category].length === 1) {
    matchCategoryGates[category] = 'OG'
  }

  const entry: MatchEntry = {
    category,
    value,
    gate: matchCategoryGates[category],
    ...(mode === 'Vælg felter' && selectedColumns[category].length > 0 ? { fields: selectedColumns[category] } : {})
  }

  matches.value.push(entry)

  matchInputs[category] = ''
  selectedColumns[category] = []
}

const removeMatchEntry = (index: number) => {
  matches.value.splice(index, 1)
}

const getMatchesForCategory = (category: MatchCategory) => {
  return matches.value.filter(m => m.category === category)
}

const shouldShowGateToggle = (category: MatchCategory) => {
  return getMatchesForCategory(category).length > 1
}

// ------------------
// Attachment helpers
// ------------------
type AttachmentPayload = {
  names: string[]
  extensions: string[]
  base64: string[]
}
const attachments = ref<AttachmentPayload | null>(null)
const handleAttachmentUpdate = (value: AttachmentPayload | null) => {
  attachments.value = value
}

// -----------------------
// State & schema creation
// -----------------------
type RuleDraftUiState = Omit<RuleDraftSchema, 'matches' | 'currentVersionId'> & {
  matches?: MatchEntry[]
}

function createEmptyDraft(): RuleDraftUiState {
  return {
    type: 'standard' as RuleType,
    status: 'aktiv' as RuleStatus,
    lockedAt: undefined,
    relatedBankAccounts: [],
    matchAmountMin: undefined,
    matchAmountMax: undefined,
    accountingPrimaryAccount: '',
    accountingSecondaryAccount: undefined,
    accountingTertiaryAccount: undefined,
    accountingText: undefined,
    accountingCprType: 'ingen' as CprType,
    accountingCprNumber: undefined,
    accountingNotifyTo: undefined,
    accountingNote: undefined,
    accountingAttachmentName: undefined,
    accountingAttachmentFileExtension: undefined,
    accountingAttachmentData: undefined,
    ruleTags: undefined
  }
}

const state = reactive<RuleDraftUiState>(createEmptyDraft())

function resetForm() {
  Object.assign(state, createEmptyDraft())
  matches.value = []
  currentStep.value = 0
}

const stepSchema = computed(() => {
  switch (currentStep.value) {
    case 0:
      return ruleBasicSchema
    case 1:
      return ruleMatchingSchema
    case 2:
      return ruleAccountingSchema
    default:
      return ruleBasicSchema
  }
})

const ruleSubmitSchema =
  ruleBasicSchema
    .and(ruleMatchingSchema)
    .and(ruleAccountingSchema)

// ------------------------------------------
// Options to USelect og USelectMenu elements
// ------------------------------------------
type AccountOption = { label: string; value: string }
const { data: rawAccounts } = await useFetch<AccountSelectSchema[]>('/api/bank-accounts', { key: 'bankaccounts' })
const accountOptions = computed<AccountOption[]>(() =>
  (rawAccounts.value ?? []).map(acc => ({
    label: acc.id,
    value: acc.id
  }))
)

const typeOptions = computed(() =>
  Object.values(ruleTypeValues).map(value => ({
    label: typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : String(value),
    value
  })) as { label: string; value: RuleType }[]
)

const statusOptions = computed(() =>
  Object.values(ruleStatusValues).map(value => ({
    label: typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : String(value),
    value
  })) as { label: string; value: RuleStatus }[]
)

const cprTypeOptions = computed(() =>
  Object.values(cprTypeValues).map(value => ({
    label: typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : String(value),
    value
  })) as { label: string; value: CprType }[]
)

const matchCategoryOptions = matchFieldOptionsByCategory

// ---------------
// Step validation
// ---------------
const handleNext = async () => {
  const valid = await formRef.value.validate({ schema: stepSchema.value })
  if (!valid) return

  currentStep.value++
}

const handlePrev = () => {
  if (currentStep.value > 0) currentStep.value--
}

async function onSubmit(event: FormSubmitEvent<typeof ruleSubmitSchema>) { 
  state.accountingAttachmentName = attachments.value?.names ?? undefined
  state.accountingAttachmentFileExtension = attachments.value?.extensions ?? undefined
  state.accountingAttachmentData = attachments.value?.base64 ?? undefined

  const payload = {
    ...state,
    matches: matches.value,
  }

  const result = ruleSubmitSchema.safeParse(payload)
  if (!result.success) {
    console.error(result.error)
    return
  }

  console.log('Submitting form with payload:', payload)

  try {
    if (isEdit.value && props.ruleId) {
      // PUT til /api/rule/{id}
      await $fetch<RuleDraftSchema>(`/api/rule/${props.ruleId}`, {
        method: 'PUT',
        body: payload
      })
      toast.add({ title: 'Regel opdateret', description: 'Reglen er blevet opdateret.' })
    } else {
      // POST til /api/rule
      await $fetch<RuleDraftSchema>('/api/rule', {
        method: 'POST',
        body: payload
      })
      toast.add({ title: 'Regel oprettet', description: 'Den nye regel er blevet oprettet.' })
    }
    open.value = false
    emit('saved')

    // Reset
    currentStep.value = 0
    matches.value = []
    resetForm()
  } catch (error) {
    toast.add({ 
      title: 'Fejl', 
      description: isEdit.value ? 'Fejl ved opdatering.' : 'Fejl ved oprettelse.',
      color: 'error'
    })
  }
}
</script>

<template>
  <UModal v-model:open="open" :title="isEdit ? 'Rediger regel' : 'Ny regel'">
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">
          {{ isEdit ? `Rediger regel ${props.ruleId}` : 'Ny regel' }}
        </h2>
      </div>
    </template>

    <template #default>
      <UButton
        class="font-bold rounded-full"
        icon="i-lucide-plus"
        :label="'Ny regel'"
        @click="open = true"
      />
    </template>
    <template #body>
      <div v-if="isLocked" class="bg-yellow-100 dark:bg-yellow-900/30 p-2 mb-4 rounded border border-yellow-400 dark:border-yellow-700">
        Denne regel redigeres i øjeblikket af en anden bruger.
      </div>
      <UForm ref="formRef" :schema="stepSchema" :state="state" @submit="onSubmit" :disabled="isLocked">
        <UStepper v-model="currentStep" :items="steps" class="mb-6">
          <template #content="{ item }">
            <USeparator class="mb-6" />

            <!-- BASIC STEP -->
            <template v-if="item.id === 'basic'">
              <div class="grid grid-cols-1 gap-4 mt-6 mb-6 w-full max-w-full">
                <UFormField label="Regeltype" name="type" required>
                  <USelect
                    v-model="state.type as RuleType"
                    :items="typeOptions"
                    labelKey="label"
                    valueKey="value"
                    placeholder="Vælg regeltype"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Status" name="status" required>
                  <USelect
                    v-model="state.status as RuleStatus"
                    :items="statusOptions"
                    labelKey="label"
                    valueKey="value"
                    placeholder="Vælg status"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Bankkonto" name="relatedBankAccounts" required>
                  <UInputMenu
                    v-model="state.relatedBankAccounts"
                    :items="accountOptions"
                    multiple
                    labelKey="label"
                    valueKey="value"
                    placeholder="Vælg bankkonto"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Tags" name="ruleTags">
                  <UInputMenu
                    v-model="state.ruleTags"
                    :items="ruleTagOptions"
                    multiple
                    labelKey="label"
                    valueKey="value"
                    placeholder="Vælg tags"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </template>

            <!-- MATCH STEP -->
            <template v-if="item.id === 'match'">
              <!-- Beløbsgrænser -->
              <div class="flex gap-4 mt-6 mb-6">
                <UFormField label="Minimumsbeløb" name="matchAmountMin">
                  <UInputNumber
                    v-model="state.matchAmountMin"
                    placeholder="DKK"
                    :min="0"
                    currency="DKK"
                    currencyDisplay="symbol"
                    class="min-w-fit"
                  />
                </UFormField>
                <UFormField label="Maksimumsbeløb" name="matchAmountMax">
                  <UInputNumber
                    v-model="state.matchAmountMax"
                    placeholder="DKK"
                    :min="0"
                    currency="DKK"
                    currencyDisplay="symbol"
                    class="min-w-fit"
                  />
                </UFormField>
              </div>
              <div class="space-y-6">
                <div
                  v-for="category in matchCategories"
                  :key="category"
                >
                  <USeparator class="mb-4" color="primary">
                    <div class="flex content-center h-8">
                      <h3 class="font-semibold text-lg m-0">{{ category }}</h3>
                    </div>
                  </USeparator>

                  <!-- Input og knap -->
                  <template v-if="matchModes[category] === 'Alle felter'">
                    <div class="flex gap-2 mb-4">
                      <UInput
                        v-model="matchInputs[category]"
                        :placeholder="`Søg i ${category.toLowerCase()}`"
                        class="flex-1"
                      />
                      <UButton
                        icon="i-lucide-plus"
                        color="primary"
                        @click="() => addMatchEntry(category, 'Alle felter')"
                      />
                    </div>
                  </template>

                  <template v-else>
                    <div class="flex gap-2 mb-4">
                      <UInput
                        v-model="matchInputs[category]"
                        :placeholder="`Værdi for ${selectedColumns[category].length > 0 ? selectedColumns[category].join(', ') : 'valgte felter'}`"
                        class="flex-1"
                      />
                      <UButton
                        icon="i-lucide-plus"
                        color="primary"
                        @click="() => addMatchEntry(category, 'Vælg felter')"
                        :disabled="selectedColumns[category].length === 0"
                      />
                    </div>
                  </template>

                  <!-- Mode valg og feltvalg grupperet sammen -->
                  <div class="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 space-y-3">
                    <div>
                      <p class="text-xs font-medium uppercase text-gray-600 dark:text-gray-400 mb-2">Søgemetode</p>
                      <URadioGroup
                        v-model="matchModes[category]"
                        :items="['Alle felter', 'Vælg felter']"
                      />
                    </div>

                    <!-- Feltvalg - kun synlig i "Vælg felter" mode -->
                    <template v-if="matchModes[category] === 'Vælg felter'">
                      <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p class="text-xs font-medium uppercase text-gray-600 dark:text-gray-400 mb-2">Felter</p>
                        <USelectMenu
                          v-model="selectedColumns[category]"
                          :items="matchCategoryOptions[category]"
                          multiple
                          labelKey="label"
                          valueKey="value"
                          placeholder="Vælg felter"
                          class="flex-1"
                          :ui="{ content: 'min-w-fit' }"
                        />
                      </div>
                    </template>
                  </div>

                  <!-- Badge liste med gate info -->
                  <div v-if="getMatchesForCategory(category).length > 0" class="mt-4">
                    <div class="flex items-center gap-2 mb-3">
                      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Matches</p>
                      <span v-if="shouldShowGateToggle(category)" class="text-xs font-medium px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded">(OG)</span>
                    </div>
                    <div v-if="shouldShowGateToggle(category)" class="mb-3 p-2 bg-amber-50 dark:bg-amber-900/10 rounded border border-amber-200 dark:border-amber-800">
                      <p class="text-xs text-amber-700 dark:text-amber-300">Alle matches skal være opfyldt samtidigt</p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <UBadge
                        v-for="(entry, idx) in getMatchesForCategory(category)"
                        :key="idx"
                        variant="subtle"
                        color="primary"
                        class="cursor-pointer hover:opacity-75 transition pr-1"
                        @click="removeMatchEntry(matches.indexOf(entry))"
                      >
                        <div class="text-xs">
                          <div class="font-semibold">{{ entry.value }}</div>
                          <div v-if="entry.fields" class="text-gray-600 dark:text-gray-400">
                            {{ entry.fields.join(', ') }}
                          </div>
                        </div>
                        <UIcon name="i-lucide-x" class="ml-2 w-3 h-3" />
                      </UBadge>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- ACCOUNTING STEP -->
            <template v-if="item.id === 'accounting'">
              <div class="grid grid-cols-1 gap-4 mt-6 mb-6 w-full max-w-full">
                <UFormField label="Primær konto" name="accountingPrimaryAccount" required>
                  <UInput v-model="state.accountingPrimaryAccount" class="w-full" placeholder="Artskonto i Opus" />
                </UFormField>
                <UFormField label="Sekundær konto" name="accountingSecondaryAccount">
                  <UInput v-model="state.accountingSecondaryAccount" class="w-full" placeholder="PSP-element i Opus" />
                </UFormField>
                <UFormField label="Tertiær konto" name="accountingTertiaryAccount">
                  <UInput v-model="state.accountingTertiaryAccount" class="w-full" placeholder="Omkostningssted i Opus" />
                </UFormField>
                <UFormField label="Posteringstekst" name="accountingText">
                  <UInput v-model="state.accountingText" class="w-full" placeholder="Valgfri" />
                </UFormField>
                <div class="grid grid-cols-2 gap-4 mt-6 mb-6">
                  <UFormField label="CPR-type" name="accountingCprType">
                    <USelectMenu
                      v-model="state.accountingCprType as CprType"
                      :items="cprTypeOptions"
                      labelKey="label"
                      valueKey="value"
                      placeholder="Vælg CPR-type"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="CPR-nummer" name="accountingCprNumber">
                    <UInput
                      v-model="state.accountingCprNumber"
                      class="w-full"
                      :disabled="state.accountingCprType !== 'statisk'"
                    />
                  </UFormField>
                </div>
                <UFormField label="Notifikation til" name="accountingNotifyTo" class="mb-6">
                  <UInput
                    v-model="state.accountingNotifyTo"
                    type="email"
                    class="w-full"
                    placeholder="f.eks. csl@randers.dk"
                  />
                </UFormField>
                <UFormField label="Noter" name="accountingNote">
                  <UTextarea v-model="state.accountingNote" class="w-full" placeholder="Valgfri notering" />
                </UFormField>
                <div>
                  <RulesFileUpload @update="handleAttachmentUpdate" />
                </div>
              </div>
            </template>
          </template>
        </UStepper>

        <div class="flex justify-between gap-2 pt-4 border-t border-default">
          <UButton
            label="Forrige"
            variant="soft"
            color="neutral"
            @click="handlePrev"
            :disabled="currentStep === 0"
          />
          <template v-if="currentStep === steps.length - 1">
            <UButton type="submit">
              {{ isEdit ? 'Opdater regel' : 'Opret regel' }}
            </UButton>
          </template>
          <template v-else>
            <UButton label="Næste" color="primary" @click="handleNext"/>
          </template>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
