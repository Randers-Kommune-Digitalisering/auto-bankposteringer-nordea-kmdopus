<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { parseDate, today } from '@internationalized/date'
import { nextTick, watch } from 'vue'
import type {
  AccountSelectSchema,
} from '~/lib/db/schema/account'
import type { RuleDraftSchema, MatchEntry, MatchGate } from '~/lib/db/schema/rule'
import type { RuleStatus, RuleType, CprType } from '~/lib/db/schema/enums'
import type { MatchField, MatchCategory } from '~/lib/rules/match-config'
import { ruleTypeValues, ruleStatusValues, cprTypeValues } from '~/lib/db/schema/enums'
import { matchFieldOptionsByCategory, matchCategories, matchCategoryColumns } from '~/lib/rules/match-config'
import { ruleBasicSchema, ruleMatchingSchema, ruleAccountingSchema } from '~/lib/db/schema/rule'
import { DEFAULT_TIME_ZONE } from '~/lib/timeZone'
import { accountingDimensionFormatHint } from '~/lib/presenters/accountingDimensionFormatHints'

const props = defineProps<{
  open?: boolean
  ruleId?: number | null
}>()

const isEdit = computed(() => props.ruleId != null)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'saved'): void
}>()

// -----------------------
// Unsaved changes handling
// -----------------------
type RuleSnapshot = {
  type: RuleType
  status: RuleStatus
  activeFrom?: string
  activeTo?: string
  relatedBankAccounts: string[]
  ruleTags?: string[]
  matchAmountMin?: number
  matchAmountMax?: number
  matches: MatchEntry[]
  accountingDimensions: Array<{ key: string; value: string }>
  accountingText?: string
  accountingCprType: CprType
  accountingCprNumber?: string
  accountingNotifyTo?: string
  accountingNote?: string
  attachments?: {
    names: string[]
    extensions: string[]
    base64: string[]
  } | null
}

const savedSnapshot = ref<string | null>(null)
const bypassUnsavedPromptOnce = ref(false)

function normalizeDateOnly(value: unknown): string | undefined {
  if (!value) return undefined
  const d = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString().slice(0, 10)
}

function buildRuleSnapshot(): RuleSnapshot {
  return {
    type: state.type as RuleType,
    status: state.status as RuleStatus,
    activeFrom: normalizeDateOnly(state.activeFrom as any),
    activeTo: normalizeDateOnly(state.activeTo as any),
    relatedBankAccounts: (state.relatedBankAccounts ?? []).slice().sort(),
    ruleTags: (state.ruleTags ?? []).slice().sort(),
    matchAmountMin: state.matchAmountMin,
    matchAmountMax: state.matchAmountMax,
    matches: (matches.value ?? []).map(m => ({ ...m, fields: m.fields?.slice() })),
    accountingDimensions: (state.accountingDimensions ?? [])
      .slice()
      .map(d => ({ key: d.key, value: d.value }))
      .sort((a, b) => a.key.localeCompare(b.key)),
    accountingText: state.accountingText,
    accountingCprType: state.accountingCprType as CprType,
    accountingCprNumber: state.accountingCprNumber,
    accountingNotifyTo: state.accountingNotifyTo,
    accountingNote: state.accountingNote,
    attachments: attachments.value,
  }
}

const currentSnapshot = computed(() => JSON.stringify(buildRuleSnapshot()))

const hasUnsavedChanges = computed(() => {
  if (!open.value) return false
  if (!savedSnapshot.value) return false
  return savedSnapshot.value !== currentSnapshot.value
})

const open = computed({
  get: () => props.open ?? false,
  set: (value: boolean) => {
    const wasOpen = props.open ?? false
    if (!value && wasOpen && hasUnsavedChanges.value && !bypassUnsavedPromptOnce.value) {
      if (process.client) {
        const ok = window.confirm(
          'Du har ændringer, som ikke er gemt\n\nVil du lukke uden at gemme?',
        )
        if (!ok) return
      }
    }
    bypassUnsavedPromptOnce.value = false
    emit('update:open', value)
  },
})

const currentStep = ref(0)
const toast = useToast()
const formRef = ref<any>()

const timeZone = DEFAULT_TIME_ZONE

const steps = [
  { id: 'basic', title: 'Basis', description: 'Vælg type, status og bankkonto' },
  { id: 'match', title: 'Matching', description: 'Vælg hvilke kendetegn reglen skal matche ud fra' },
  { id: 'accounting', title: 'Kontering', description: 'Angiv oplysninger relevant for bogføringen' }
]

// -----------------------
// State (declared early)
// -----------------------
type RuleDraftUiState = Omit<RuleDraftSchema, 'matches' | 'currentVersionId'> & {
  matches?: MatchEntry[]
}

function createEmptyDraft(): RuleDraftUiState {
  return {
    type: 'standard' as RuleType,
    status: 'aktiv' as RuleStatus,
    lockedAt: undefined,
    activeFrom: undefined,
    activeTo: undefined,
    relatedBankAccounts: [],
    matchAmountMin: undefined,
    matchAmountMax: undefined,
    accountingDimensions: [],
    accountingText: undefined,
    accountingCprType: 'ingen' as CprType,
    accountingCprNumber: undefined,
    accountingNotifyTo: undefined,
    accountingNote: undefined,
    accountingAttachmentName: undefined,
    accountingAttachmentFileExtension: undefined,
    accountingAttachmentData: undefined,
    ruleTags: undefined,
  }
}

const state = reactive<RuleDraftUiState>(createEmptyDraft())

// -------------------------
// Active period (date range)
// -------------------------
type TimeLimitMode = 'Ikke tidsbegrænset' | 'Tidsbegrænset'

const shouldShowTimeLimit = computed(() => state.type === 'standard' && state.status === 'aktiv')

const timeLimitMode = ref<TimeLimitMode>('Ikke tidsbegrænset')

const timeLimitOptions = [
  { label: 'Nej', value: 'Ikke tidsbegrænset' },
  { label: 'Ja', value: 'Tidsbegrænset' },
]

const activePeriodRange = ref<any>(null)

function normalizeDateToNoon(d: Date) {
  d.setHours(12, 0, 0, 0)
  return d
}

function dateToCalendarDateValue(d: Date): any {
  // We store DATEs; using ISO date avoids timezone surprises.
  return parseDate(d.toISOString().slice(0, 10))
}

watchEffect(() => {
  // If time limitation is not applicable, always clear
  if (!shouldShowTimeLimit.value) {
    timeLimitMode.value = 'Ikke tidsbegrænset'
    activePeriodRange.value = null
    state.activeFrom = undefined
    state.activeTo = undefined
    return
  }

  // Mode -> state
  if (timeLimitMode.value === 'Ikke tidsbegrænset') {
    activePeriodRange.value = null
    state.activeFrom = undefined
    state.activeTo = undefined
    return
  }

  // Ensure the picker has a default range when enabling
  if (!activePeriodRange.value?.start || !activePeriodRange.value?.end) {
    const endDefault = today(timeZone)
    activePeriodRange.value = { start: endDefault, end: endDefault }
  }

  if (activePeriodRange.value?.start && activePeriodRange.value?.end) {
    state.activeFrom = normalizeDateToNoon(activePeriodRange.value.start.toDate(timeZone))
    state.activeTo = normalizeDateToNoon(activePeriodRange.value.end.toDate(timeZone))
  }
})

// ---------------------
// Match object handlers
// ---------------------
const matches = ref<MatchEntry[]>([])

// ----------------------
// Accounting dimensions
// ----------------------
type AccountingDimensionDefinition = {
  id: string
  key: string
  required: boolean
  sortOrder: number
  valueRegex?: string | null
  valueRegexFlags?: string | null
}

type AccountingDimensionConstraint = {
  id: string
  ifKey: string
  kind: 'requires_any_of' | 'requires_all_of' | 'requires_exactly_one_of' | 'forbids_any_of'
  members: string[]
  ifValueRegex?: string | null
}

type AccountingDimensionsResponse = {
  erpSupplier: string
  dimensions: AccountingDimensionDefinition[]
  constraints: AccountingDimensionConstraint[]
}

const {
  data: accountingDimensionConfig,
  pending: accountingDimensionPending,
  error: accountingDimensionError,
  refresh: refreshAccountingDimensions,
} = await useFetch<AccountingDimensionsResponse>(
  '/api/settings/accounting-dimensions',
  {
    key: 'accounting-dimensions',
    server: false,
    default: () => ({ erpSupplier: '', dimensions: [], constraints: [] }),
  },
)

const isAccountingDimensionConfigReady = computed(() =>
  !accountingDimensionPending.value && !accountingDimensionError.value,
)

const accountingDimensionDefinitions = computed<AccountingDimensionDefinition[]>(
  () => accountingDimensionConfig.value?.dimensions ?? [],
)

const accountingDimensionConstraints = computed<AccountingDimensionConstraint[]>(
  () => accountingDimensionConfig.value?.constraints ?? [],
)

const dimensionLabel = (key: string) => key.charAt(0).toUpperCase() + key.slice(1)

function constraintLabel(key: string) {
  return dimensionLabel(key)
}

const accountingDimensionValues = reactive<Record<string, string>>({})

function syncAccountingDimensionsToState() {
  state.accountingDimensions = Object.entries(accountingDimensionValues)
    .map(([key, value]) => ({ key, value: value.trim() }))
    .filter(entry => entry.value.length > 0)
}

watchEffect(() => {
  for (const def of accountingDimensionDefinitions.value) {
    if (accountingDimensionValues[def.key] == null) {
      accountingDimensionValues[def.key] = ''
    }
  }
  syncAccountingDimensionsToState()
})

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

watch(
  () => open.value,
  async (isOpen) => {
    if (!isOpen) {
      savedSnapshot.value = null
      bypassUnsavedPromptOnce.value = false
      return
    }

    // Always refresh dimension config when opening.
    if (process.client) {
      try {
        await refreshAccountingDimensions()
      } catch {
        // Error is exposed via accountingDimensionError
      }
    }

    // When opening in create mode, the current in-memory state might be stale.
    if (!props.ruleId) {
      resetForm()
    }

    await nextTick()
    savedSnapshot.value = currentSnapshot.value
  },
)

function hydrateDraft(rule: RuleDraftSchema & { matches?: MatchEntry[] }) {
  Object.assign(state, {
    ...rule,
    matches: undefined
  })

  // Normalize date fields from API (may come back as strings)
  if (state.activeFrom && !(state.activeFrom instanceof Date)) {
    state.activeFrom = new Date(state.activeFrom as any)
  }
  if (state.activeTo && !(state.activeTo instanceof Date)) {
    state.activeTo = new Date(state.activeTo as any)
  }

  if (state.type === 'standard' && state.status === 'aktiv' && state.activeFrom && state.activeTo) {
    timeLimitMode.value = 'Tidsbegrænset'
    activePeriodRange.value = {
      start: dateToCalendarDateValue(normalizeDateToNoon(new Date(state.activeFrom as any))),
      end: dateToCalendarDateValue(normalizeDateToNoon(new Date(state.activeTo as any))),
    }
  } else {
    timeLimitMode.value = 'Ikke tidsbegrænset'
    activePeriodRange.value = null
  }

  for (const key of Object.keys(accountingDimensionValues)) {
    delete accountingDimensionValues[key]
  }
  for (const def of accountingDimensionDefinitions.value) {
    accountingDimensionValues[def.key] = ''
  }
  for (const dim of rule.accountingDimensions ?? []) {
    accountingDimensionValues[dim.key] = dim.value
  }
  syncAccountingDimensionsToState()

  matches.value = rule.matches ?? []

  if (open.value) {
    void nextTick().then(() => {
      savedSnapshot.value = currentSnapshot.value
    })
  }
}

watchEffect(async () => {
  if (!props.ruleId) return
  
  const data = await $fetch<RuleDraftSchema>(`/api/rule/${props.ruleId}`)
  
  hydrateDraft(data)
})

// ---------------
// Fetch rule tags
// ---------------
type RuleTag = { id: string }
const { data: ruleTagsData } = await useFetch<RuleTag[]>('/api/rule-tags', { key: 'rule-tags' })
const ruleTagOptions = computed(() =>
  (ruleTagsData.value ?? []).map(tag => ({
    label: tag.id,
    value: tag.id
  }))
)

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

type MatchOperatorUi = 'eq' | 'ilike' | 'regex'

const matchOperators = reactive(
  initCategoryRecord<MatchOperatorUi>(() => 'eq')
)

const matchOperatorItemsByCategory = computed(() => {
  const base = [
    { label: 'Eksakt', value: 'eq' as const },
    { label: 'Indeholder', value: 'ilike' as const },
  ]
  const withRegex = [
    ...base,
    { label: 'Regex', value: 'regex' as const },
  ]

  const record = {} as Record<MatchCategory, Array<{ label: string; value: MatchOperatorUi }>>
  for (const category of matchCategories) {
    record[category] = (category === 'Fritekst' || category === 'Part')
      ? withRegex
      : base
  }
  return record
})

function matchOperatorLabel(value?: string | null): string {
  if (value === 'ilike') return 'Indeholder'
  if (value === 'regex') return 'Regex'
  return 'Eksakt'
}

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
    operator: matchOperators[category],
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
// Schema creation
// -----------------------
function resetForm() {
  Object.assign(state, createEmptyDraft())
  matches.value = []
  timeLimitMode.value = 'Ikke tidsbegrænset'
  activePeriodRange.value = null
  for (const key of Object.keys(accountingDimensionValues)) {
    delete accountingDimensionValues[key]
  }
  for (const def of accountingDimensionDefinitions.value) {
    accountingDimensionValues[def.key] = ''
  }
  currentStep.value = 0
}

const stepSchema = computed(() => {
  switch (currentStep.value) {
    case 0:
      return ruleBasicSchema
    case 1:
      return ruleMatchingSchema
    case 2:
      return ruleAccountingSchemaWithUiValidation.value
    default:
      return ruleBasicSchema
  }
})

const ruleAccountingSchemaWithUiValidation = computed(() =>
  ruleAccountingSchema.superRefine((data, ctx) => {
    const defs = accountingDimensionDefinitions.value
    if (!defs.length) return

    const dimensions = data.accountingDimensions ?? []

    const defByKey = new Map(defs.map(d => [d.key, d] as const))

    // Format validation per dimension (data-driven)
    for (const d of dimensions) {
      const def = defByKey.get(d.key)
      if (!def?.valueRegex) continue
      const flags = def.valueRegexFlags ?? ''
      try {
        const re = new RegExp(def.valueRegex, flags)
        if (!re.test(String(d.value ?? '').trim())) {
          const hint = accountingDimensionFormatHint(def.key)
          ctx.addIssue({
            code: 'custom',
            message: `${dimensionLabel(def.key)} har ugyldigt format` + (hint ? ` (${hint})` : ''),
            path: ['accountingDimensions', def.key],
          })
        }
      } catch {
        ctx.addIssue({
          code: 'custom',
          message: `Ugyldig regex for konteringsdimension '${def.key}': ${def.valueRegex}`,
          path: ['accountingDimensions', def.key],
        })
      }
    }

    for (const def of defs) {
      if (!def.required) continue
      const hasValue = dimensions.some((d) => d.key === def.key && String(d.value ?? '').trim().length > 0)
      if (!hasValue) {
        ctx.addIssue({
          code: 'custom',
          message: `${dimensionLabel(def.key)} er påkrævet`,
          path: ['accountingDimensions', def.key],
        })
      }
    }

    // ERP dimension constraints (same semantics as backend)
    const valueByKey = new Map(
      dimensions
        .map((d) => [d.key, String(d.value ?? '').trim()] as const)
        .filter(([, v]) => v.length > 0),
    )
    const keys = new Set(valueByKey.keys())
    const constraintsByIfKey = new Map<string, AccountingDimensionConstraint[]>()
    for (const c of accountingDimensionConstraints.value) {
      const bucket = constraintsByIfKey.get(c.ifKey) ?? []
      bucket.push(c)
      constraintsByIfKey.set(c.ifKey, bucket)
    }

    for (const [ifKey, group] of constraintsByIfKey.entries()) {
      if (!keys.has(ifKey)) continue

      const v = valueByKey.get(ifKey) ?? ''

      const regexConstraints = group.filter(c => (c.ifValueRegex ?? null) != null)
      let matchingRegex: AccountingDimensionConstraint[] = []

      for (const c of regexConstraints) {
        try {
          const re = new RegExp(c.ifValueRegex as string)
          if (re.test(v)) matchingRegex.push(c)
        } catch {
          ctx.addIssue({
            code: 'custom',
            message: `Ugyldig regex i konteringsconstraint: ${c.ifValueRegex}`,
            path: ['accountingDimensions', ifKey],
          })
          matchingRegex = []
          break
        }
      }

      const applicable = matchingRegex.length
        ? matchingRegex
        : group.filter(c => (c.ifValueRegex ?? null) == null)

      for (const c of applicable) {

        if (c.kind === 'requires_any_of') {
          const ok = c.members.some(m => keys.has(m))
          if (!ok) {
            for (const member of c.members) {
              ctx.addIssue({
                code: 'custom',
                message: `Udfyld mindst én af: ${c.members.map(constraintLabel).join(' / ')} (når ${constraintLabel(c.ifKey)} er udfyldt)`,
                path: ['accountingDimensions', member],
              })
            }
          }
          continue
        }

        if (c.kind === 'requires_all_of') {
          const missing = c.members.filter(m => !keys.has(m))
          if (missing.length) {
            for (const member of missing) {
              ctx.addIssue({
                code: 'custom',
                message: `Udfyld også ${constraintLabel(member)} (når ${constraintLabel(c.ifKey)} er udfyldt)`,
                path: ['accountingDimensions', member],
              })
            }
          }
          continue
        }

        if (c.kind === 'requires_exactly_one_of') {
          const present = c.members.filter(m => keys.has(m))
          if (present.length === 0) {
            for (const member of c.members) {
              ctx.addIssue({
                code: 'custom',
                message: `Udfyld enten ${constraintLabel(c.members[0] ?? '')} eller ${constraintLabel(c.members[1] ?? '')} (ikke begge)`,
                path: ['accountingDimensions', member],
              })
            }
          } else if (present.length > 1) {
            for (const member of present) {
              ctx.addIssue({
                code: 'custom',
                message: `Udfyld kun ét af felterne: ${c.members.map(constraintLabel).join(' / ')}`,
                path: ['accountingDimensions', member],
              })
            }
          }
        }

        if (c.kind === 'forbids_any_of') {
          const present = c.members.filter(m => keys.has(m))
          if (present.length) {
            for (const member of present) {
              ctx.addIssue({
                code: 'custom',
                message: `${constraintLabel(member)} må ikke udfyldes sammen med ${constraintLabel(c.ifKey)}`,
                path: ['accountingDimensions', member],
              })
            }
          }
        }
      }
    }
  }),
)

const ruleSubmitSchema = computed(() =>
  ruleBasicSchema
    .and(ruleMatchingSchema)
    .and(ruleAccountingSchemaWithUiValidation.value),
)

// ------------------------------------------
// Options to USelect og USelectMenu elements
// ------------------------------------------
type AccountOption = { label: string; value: string }
const { data: rawAccounts } = await useFetch<AccountSelectSchema[]>('/api/bank-accounts', {
  key: 'bank-accounts',
  default: () => ([]),
})
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
  if (currentStep.value === 1 && !isAccountingDimensionConfigReady.value) {
    toast.add({
      title: 'Kan ikke fortsætte',
      description: accountingDimensionError.value
        ? 'Konteringsdimensioner kunne ikke indlæses'
        : 'Konteringsdimensioner indlæses stadig…',
      color: 'error',
    })
    return
  }

  const valid = await formRef.value.validate({ schema: stepSchema.value })
  if (!valid) return

  currentStep.value++
}

const handlePrev = () => {
  if (currentStep.value > 0) currentStep.value--
}

async function onSubmit(_event?: FormSubmitEvent<any>) {
  if (!isAccountingDimensionConfigReady.value) {
    toast.add({
      title: 'Kan ikke gemme endnu',
      description: accountingDimensionError.value
        ? 'Konteringsdimensioner kunne ikke indlæses'
        : 'Konteringsdimensioner indlæses stadig…',
      color: 'error',
    })
    return
  }

  state.accountingAttachmentName = attachments.value?.names ?? undefined
  state.accountingAttachmentFileExtension = attachments.value?.extensions ?? undefined
  state.accountingAttachmentData = attachments.value?.base64 ?? undefined

  syncAccountingDimensionsToState()

  const payload = {
    ...state,
    matches: matches.value,
  }

  const result = ruleSubmitSchema.value.safeParse(payload)
  if (!result.success) {
    console.error(result.error)
    return
  }

  console.log('Submitting form with payload:', payload)

  function apiErrorToString(error: unknown): string {
    if (!error) return 'Uventet fejl'
    if (typeof error === 'string') return error
    if (typeof error === 'object') {
      const anyErr = error as any
      if (Array.isArray(anyErr.issues)) {
        const msgs = anyErr.issues.map((i: any) => i?.message).filter(Boolean)
        if (msgs.length) return msgs.join('; ')
      }
      if (typeof anyErr.message === 'string' && anyErr.message.trim()) return anyErr.message
      try {
        return JSON.stringify(anyErr)
      } catch {
        return 'Uventet fejl'
      }
    }
    return String(error)
  }

  try {
    if (isEdit.value && props.ruleId) {
      // PUT til /api/rule/{id}
      const response = await $fetch<{ success: boolean; error?: unknown }>(`/api/rule/${props.ruleId}`, {
        method: 'PUT',
        body: payload
      })

      if (!response?.success) {
        throw new Error(apiErrorToString(response?.error))
      }
      toast.add({ title: 'Regel opdateret', description: 'Reglen er blevet opdateret' })
    } else {
      // POST til /api/rule
      const response = await $fetch<{ success: boolean; error?: unknown }>(`/api/rule`, {
        method: 'POST',
        body: payload
      })

      if (!response?.success) {
        throw new Error(apiErrorToString(response?.error))
      }
      toast.add({ title: 'Regel oprettet', description: 'Den nye regel er blevet oprettet' })
    }

    await refreshNuxtData('rules')

    // Close without prompting, then reset.
    bypassUnsavedPromptOnce.value = true
    open.value = false
    emit('saved')

    // Reset
    currentStep.value = 0
    matches.value = []
    resetForm()
    savedSnapshot.value = null
  } catch (error) {
    const message = apiErrorToString((error as any)?.data?.message ?? (error as any)?.message ?? error)
    toast.add({ 
      title: 'Fejl', 
      description: message || (isEdit.value ? 'Fejl ved opdatering' : 'Fejl ved oprettelse'),
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
          {{ isEdit ? `Rediger regel ${props.ruleId}` : 'Ny regel' }}
        </h2>
      </div>
    </template>

    <template #body>
      <div v-if="isLocked" class="bg-yellow-100 dark:bg-yellow-900/30 p-2 mb-4 rounded border border-yellow-400 dark:border-yellow-700">
        Denne regel redigeres i øjeblikket af en anden bruger.
      </div>

      <div
        v-if="(state.accountingNote ?? '').trim().length > 0"
        class="mb-4 rounded-md border border-default bg-default px-3 py-2 text-sm border-l-4 border-l-primary/60"
      >
        <span class="font-semibold text-default">Noter:</span>
        <span class="ml-2 text-muted whitespace-pre-wrap">{{ state.accountingNote }}</span>
      </div>
      <UForm ref="formRef" :schema="stepSchema" :state="state" @submit="onSubmit" :disabled="isLocked">
        <UStepper v-model="currentStep" :items="steps" class="mb-6">
          <template #content="{ item }">
            <USeparator class="mb-6" />

            <!-- BASIC STEP -->
            <template v-if="item.id === 'basic'">
              <UCard variant="soft" :ui="{ body: 'space-y-4 p-4' }" class="w-full mt-6 mb-6">
                <div class="grid grid-cols-1 gap-4 w-full max-w-full">
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

                  <template v-if="shouldShowTimeLimit">
                    <UFormField label="Tidsbegrænsning" name="activeTo">
                      <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 space-y-3">
                        <div>
                          <p class="text-xs font-medium uppercase text-gray-600 dark:text-gray-400 mb-2">Begræns aktiv periode?</p>
                          <URadioGroup
                            v-model="timeLimitMode"
                            :items="timeLimitOptions"
                          />
                        </div>

                        <div v-if="timeLimitMode === 'Tidsbegrænset'" class="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <p class="text-xs font-medium uppercase text-gray-600 dark:text-gray-400 mb-2">Periode</p>
                          <FiltersDateRangePicker
                            v-model="activePeriodRange"
                            :reset-value="null"
                            :time-zone="timeZone"
                          />
                          <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            Reglen gælder i den valgte periode og bliver automatisk sat til inaktiv efter sidste dag.
                          </p>
                        </div>
                      </div>
                    </UFormField>
                  </template>

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
              </UCard>
            </template>

            <!-- MATCH STEP -->
            <template v-if="item.id === 'match'">
              <UCard variant="soft" :ui="{ body: 'space-y-6 p-4' }" class="w-full mt-6 mb-6">
                <!-- Beløbsgrænser -->
                <div class="flex gap-4">
                  <UFormField label="Minimumsbeløb" name="matchAmountMin">
                    <UInputNumber
                      v-model="state.matchAmountMin"
                      placeholder="DKK"
                      :min="0"
                      :step="0.01"
                      :format-options="{ maximumFractionDigits: 2 }"
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
                      :step="0.01"
                      :format-options="{ maximumFractionDigits: 2 }"
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
                      <USelectMenu
                        v-model="matchOperators[category]"
                        :items="matchOperatorItemsByCategory[category]"
                        class="min-w-fit"
                        labelKey="label"
                        valueKey="value"
                      />
                      <UiFloatingLabelInput
                        v-model="matchInputs[category]"
                        :label="`Søg i ${category.toLowerCase()}`"
                        color="neutral"
                        class="flex-1"
                      />
                      <UButton
                        icon="solar:add-circle-bold-duotone"
                        color="primary"
                        @click="() => addMatchEntry(category, 'Alle felter')"
                      />
                    </div>
                  </template>

                  <template v-else>
                    <div class="flex gap-2 mb-4">
                      <USelectMenu
                        v-model="matchOperators[category]"
                        :items="matchOperatorItemsByCategory[category]"
                        class="min-w-fit"
                        labelKey="label"
                        valueKey="value"
                      />
                      <UiFloatingLabelInput
                        v-model="matchInputs[category]"
                        :label="`Værdi for ${selectedColumns[category].length > 0 ? selectedColumns[category].join(', ') : 'valgte felter'}`"
                        color="neutral"
                        class="flex-1"
                      />
                      <UButton
                        icon="solar:add-circle-bold-duotone"
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
                          <div class="text-gray-600 dark:text-gray-400">{{ matchOperatorLabel(entry.operator) }}</div>
                          <div v-if="entry.fields" class="text-gray-600 dark:text-gray-400">
                            {{ entry.fields.join(', ') }}
                          </div>
                        </div>
                        <UIcon name="solar:close-circle-bold-duotone" class="ml-2 w-3 h-3" />
                      </UBadge>
                    </div>
                  </div>
                </div>
                </div>
              </UCard>
            </template>

            <!-- ACCOUNTING STEP -->
            <template v-if="item.id === 'accounting'">
              <UCard variant="soft" :ui="{ body: 'space-y-4 p-4' }" class="w-full mt-6 mb-6">
                <div class="grid grid-cols-1 gap-4 w-full max-w-full">
                  <UAlert
                    v-if="accountingDimensionError"
                    variant="soft"
                    color="error"
                    title="Konteringsdimensioner"
                    description="Kunne ikke indlæse konteringsdimensioner. Prøv at åbne modal'en igen."
                  />
                  <div v-else-if="accountingDimensionPending" class="flex justify-center py-2">
                    <USkeleton class="h-6 w-56" />
                  </div>
                  <UAlert
                    v-else-if="isAccountingDimensionConfigReady && accountingDimensionDefinitions.length === 0"
                    variant="soft"
                    color="neutral"
                    title="Konteringsdimensioner"
                    description="Der er ingen konteringsdimensioner konfigureret for den aktive ERP-integration."
                  />
                  <UFormField
                    v-for="def in accountingDimensionDefinitions"
                    :key="def.id"
                    :name="`accountingDimensions.${def.key}`"
                    :required="def.required"
                  >
                    <UiFloatingLabelInput
                      v-model="accountingDimensionValues[def.key]"
                      class="w-full"
                      :label="dimensionLabel(def.key)"
                      color="neutral"
                    />
                  </UFormField>
                  <UFormField name="accountingText">
                    <UiFloatingLabelInput v-model="state.accountingText" class="w-full" label="Posteringstekst" color="neutral" />
                  </UFormField>
                  <div class="grid grid-cols-2 gap-4 mt-2 items-end">
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
                    <UFormField name="accountingCprNumber">
                      <UiFloatingLabelInput
                        v-model="state.accountingCprNumber"
                        class="w-full"
                        label="CPR-nummer"
                        color="neutral"
                        :disabled="state.accountingCprType !== 'statisk'"
                      />
                    </UFormField>
                  </div>
                  <UFormField name="accountingNotifyTo">
                    <UiFloatingLabelInput
                      v-model="state.accountingNotifyTo"
                      type="email"
                      class="w-full"
                      label="Notifikation til"
                      color="neutral"
                    />
                  </UFormField>
                  <UFormField label="Noter" name="accountingNote">
                    <UTextarea v-model="state.accountingNote" class="w-full" placeholder="Valgfri notering" />
                  </UFormField>
                  <div>
                    <RulesFileUpload @update="handleAttachmentUpdate" />
                  </div>
                </div>
              </UCard>
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
