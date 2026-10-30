<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  countRegexCaptureGroups,
  postingTextTemplateSchema,
} from '~/../engine/matching/domain/postingTextTemplate'
import type {
  PostingTextSourceField,
  PostingTextTemplate,
} from '~/../engine/matching/domain/postingTextTemplate'

type TemplatePart = PostingTextTemplate['parts'][number]
type EditorPart = { id: number; part: TemplatePart; sample: string }

const props = defineProps<{
  modelValue?: PostingTextTemplate
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PostingTextTemplate | undefined]
}>()

const isOpen = ref(false)
const parts = ref<EditorPart[]>([])
let nextPartId = 0

watch(parts, (entries) => {
  for (const entry of entries) {
    if (entry.part.type === 'extract' && entry.part.captureGroup > countRegexCaptureGroups(entry.part.pattern)) {
      entry.part.captureGroup = 0
    }
  }
}, { deep: true })

const sourceOptions: Array<{ value: PostingTextSourceField; label: string }> = [
  {
    value: 'bankMessage',
    label: 'Bankbesked (entry)',
  },
  {
    value: 'entryAdditionalInfo',
    label: 'Ntry/AddtlNtryInf',
  },
]

const legacySourceLabels: Partial<Record<PostingTextSourceField, string>> = {
  counterparty: 'Modpart (ældre skabelon)',
  txAdditionalInfo: 'TxDtls-tekst (ikke længere tilgængelig)',
  remittanceCreditorReference: 'Kreditorreference fra TxDtls (ikke længere tilgængelig)',
  remittanceUstrd: 'Remittance fra TxDtls (ikke længere tilgængelig)',
  remittanceAdditional: 'Ekstra remittance fra TxDtls (ikke længere tilgængelig)',
}

function optionsForSource(source: PostingTextSourceField) {
  const legacyLabel = legacySourceLabels[source]
  return legacyLabel
    ? [...sourceOptions, { value: source, label: legacyLabel }]
    : sourceOptions
}

const captureGroupOptions = (pattern: string) => [
  { label: 'Hele matchen', value: 0 },
  ...Array.from({ length: countRegexCaptureGroups(pattern) }, (_, index) => ({
    label: `Fangstgruppe/del ${index + 1}`,
    value: index + 1,
  })),
]

const hasCaptureGroups = (pattern: string) => countRegexCaptureGroups(pattern) > 0

const regexExamples = [
  {
    label: 'BDP',
    pattern: 'BDP-\\d{13}',
    result: 'BDP-1234567890123',
  },
  {
    label: 'KSD',
    pattern: 'KSD-\\d{4}-\\d{12}',
    result: 'KSD-2026-123456789012',
  },
]

const parsedTemplate = computed(() => postingTextTemplateSchema.safeParse({
  version: 1,
  parts: parts.value.map(entry => entry.part),
}))

const validationMessage = computed(() => parsedTemplate.value.success
  ? ''
  : parsedTemplate.value.error.issues[0]?.message ?? 'Skabelonen er ugyldig')

const preview = ref('')
const previewValidationMessage = ref('')
const previewPending = ref(false)
let previewRequestId = 0

watch(
  [isOpen, parsedTemplate, () => parts.value.map(entry => entry.sample)],
  ([builderIsOpen, parsed], _, onCleanup) => {
    const requestId = ++previewRequestId

    if (!builderIsOpen) {
      preview.value = ''
      previewValidationMessage.value = ''
      previewPending.value = false
      return
    }

    if (!parsed.success) {
      preview.value = ''
      previewValidationMessage.value = ''
      previewPending.value = false
      return
    }

    previewPending.value = true
    previewValidationMessage.value = ''

    const timeout = setTimeout(async () => {
      try {
        const response = await $fetch<{ preview: string, validationMessage: string }>('/api/rules/template-preview', {
          method: 'POST',
          body: {
            template: parsed.data,
            samples: parts.value.map(entry => entry.sample),
          },
        })

        if (requestId !== previewRequestId) return
        preview.value = response.preview
        previewValidationMessage.value = response.validationMessage
      } catch {
        if (requestId !== previewRequestId) return
        preview.value = ''
        previewValidationMessage.value = 'Forhåndsvisning kunne ikke beregnes'
      } finally {
        if (requestId === previewRequestId) previewPending.value = false
      }
    }, 250)

    onCleanup(() => clearTimeout(timeout))
  },
  { deep: true },
)

function openBuilder() {
  parts.value = (props.modelValue?.parts ?? [{ type: 'text', value: '' }]).map(part => ({
    id: nextPartId++,
    part: { ...part } as TemplatePart,
    sample: '',
  }))
  isOpen.value = true
}

function addTextPart() {
  parts.value.push({ id: nextPartId++, part: { type: 'text', value: '' }, sample: '' })
}

function addExtractPart() {
  parts.value.push({
    id: nextPartId++,
    part: {
      type: 'extract',
      source: 'entryAdditionalInfo',
      pattern: '',
      captureGroup: 0,
    },
    sample: '',
  })
}

function movePart(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= parts.value.length) return
  const [entry] = parts.value.splice(index, 1)
  if (entry) parts.value.splice(target, 0, entry)
}

function removePart(index: number) {
  parts.value.splice(index, 1)
}

function closeBuilder() {
  isOpen.value = false
}

function applyTemplate() {
  if (!parsedTemplate.value.success) return
  emit('update:modelValue', parsedTemplate.value.data)
  isOpen.value = false
}

function clearTemplate() {
  emit('update:modelValue', undefined)
  isOpen.value = false
}
</script>

<template>
  <UButton
    :label="modelValue ? 'Redigér tekst' : 'Byg tekst'"
    icon="i-lucide-text-cursor-input"
    variant="outline"
    color="neutral"
    :disabled="disabled"
    @click="openBuilder"
  />

  <UModal v-model:open="isOpen" :ui="{ content: 'sm:max-w-2xl' }">
    <template #header>
      <h2 class="text-base font-semibold">Dynamisk posteringstekst</h2>
    </template>

    <template #body>
      <div class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <UButton label="Skriv fast tekst" icon="i-lucide-plus" size="sm" variant="soft" color="neutral" @click="addTextPart" />
          <UButton label="Hent tekst fra bankfelt" icon="i-lucide-regex" size="sm" variant="soft" color="neutral" @click="addExtractPart" />
        </div>
        <p class="text-sm text-muted">
          Delene sættes sammen i rækkefølge. Mellemrum skrives som fast tekst.
        </p>

        <ol class="space-y-3">
          <li
            v-for="(entry, index) in parts"
            :key="entry.id"
            class="grid grid-cols-[1fr_auto] gap-2 rounded border border-default p-3"
          >
            <div class="min-w-0 space-y-3">
              <div class="text-xs font-medium text-muted">{{ entry.part.type === 'extract' ? `Udtræk/del ${index + 1}` : `Tekst/del ${index + 1}` }}</div>
              <template v-if="entry.part.type === 'text'">
                <UFormField label="Fast tekst i posteringsteksten">
                  <UInput v-model="entry.part.value" class="w-full" />
                </UFormField>
              </template>
              <template v-else>
                <UFormField label="CAMT-felt">
                  <USelectMenu
                    v-model="entry.part.source"
                    :items="optionsForSource(entry.part.source)"
                    label-key="label"
                    value-key="value"
                    class="w-full"
                  />
                </UFormField>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
                  <UFormField label="Regex">
                    <UInput v-model="entry.part.pattern" class="w-full font-mono" placeholder="Fx BDP\d{15}" />
                  </UFormField>
                  <UFormField v-if="hasCaptureGroups(entry.part.pattern)" label="Matchdel">
                    <USelectMenu
                      v-model="entry.part.captureGroup"
                      :items="captureGroupOptions(entry.part.pattern)"
                      label-key="label"
                      value-key="value"
                      class="w-full"
                    />
                  </UFormField>
                </div>
                <UFormField label="Prøveværdi" description="Kun til forhåndsvisning; gemmes ikke.">
                  <UTextarea v-model="entry.sample" :rows="2" class="w-full" placeholder="Kopiér feltindhold fra rå visning" />
                </UFormField>
              </template>
            </div>
            <div class="flex items-start gap-1">
              <UTooltip text="Flyt op">
                <UButton icon="i-lucide-arrow-up" size="xs" variant="ghost" color="neutral" :disabled="index === 0" @click="movePart(index, -1)" />
              </UTooltip>
              <UTooltip text="Flyt ned">
                <UButton icon="i-lucide-arrow-down" size="xs" variant="ghost" color="neutral" :disabled="index === parts.length - 1" @click="movePart(index, 1)" />
              </UTooltip>
              <UTooltip text="Fjern del">
                <UButton icon="i-lucide-trash-2" size="xs" variant="ghost" color="error" @click="removePart(index)" />
              </UTooltip>
            </div>
          </li>
        </ol>

        <section class="space-y-2 rounded border border-default p-3">
          <h3 class="text-sm font-medium text-highlighted">Regex-eksempler</h3>
          <p class="text-sm text-muted"><strong>BDP</strong> <code class="font-mono">{{ regexExamples[0]?.pattern }}</code> → <code class="font-mono">{{ regexExamples[0]?.result }}</code></p>
          <p class="text-sm text-muted"><strong>KSD</strong> <code class="font-mono">{{ regexExamples[1]?.pattern }}</code> → <code class="font-mono">{{ regexExamples[1]?.result }}</code></p>
        </section>

        <UFormField label="Resultat (maks. 50 tegn)">
          <UInput :model-value="preview" readonly class="w-full" />
          <span v-if="previewPending" class="text-xs text-muted">Beregner resultat…</span>
        </UFormField>
        <UAlert v-if="validationMessage || previewValidationMessage" color="error" variant="soft" :description="validationMessage || previewValidationMessage" />

        <div class="flex justify-between gap-2 border-t border-default pt-4">
          <UButton v-if="modelValue" label="Fjern skabelon" color="error" variant="soft" @click="clearTemplate" />
          <span v-else />
          <div class="flex gap-2">
            <UButton label="Annullér" color="neutral" variant="ghost" @click="closeBuilder" />
            <UButton label="Anvend" :disabled="!parsedTemplate.success || previewPending || !!previewValidationMessage" @click="applyTemplate" />
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>