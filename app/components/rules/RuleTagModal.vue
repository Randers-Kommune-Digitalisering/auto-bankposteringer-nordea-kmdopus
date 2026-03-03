<script setup lang="ts">
import { z } from 'zod'
import type { RuleTagSelectSchema } from '~/lib/db/schema/ruleTag'

const props = defineProps<{
  open: boolean
  tagId: string | null
}>()

const isEdit = computed(() => props.tagId !== null)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'saved'): void
}>()

const open = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v)
})

const toast = useToast()

const createSchema = z.object({
  id: z.string().min(1, 'Tag-id er påkrævet')
})

const renameSchema = z.object({
  id: z.string().min(1, 'Tag-id er påkrævet'),
  newId: z.string().min(1, 'Nyt tag-id er påkrævet')
})

const formSchema = computed(() => (isEdit.value ? renameSchema : createSchema))

type FormState = {
  id: string | undefined
  newId: string | undefined
}

const state = reactive<FormState>({
  id: undefined,
  newId: undefined
})

function resetForm() {
  state.id = undefined
  state.newId = undefined
}

function hydrateDraft(tag: RuleTagSelectSchema) {
  state.id = tag.id
  state.newId = tag.id
}

watch(
  () => [props.tagId, open.value] as const,
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
      const data = await $fetch<RuleTagSelectSchema>(`/api/rule-tags/${id}`)
      hydrateDraft(data)
    } catch (err) {
      console.error('Fejl ved hentning af ruletag', err)
      resetForm()
    }
  },
  { immediate: true }
)

async function onSubmit() {
  const id = state.id?.trim()
  const newId = state.newId?.trim()

  if (isEdit.value) {
    const result = renameSchema.safeParse({ id, newId })
    if (!result.success) {
      console.error(result.error)
      return
    }

    try {
      await $fetch(`/api/rule-tags/${props.tagId}`, {
        method: 'PUT',
        body: { id: result.data.newId }
      })

      toast.add({
        title: 'Tag opdateret',
        description: `${props.tagId} er opdateret.`
      })

      open.value = false
      emit('saved')
      resetForm()
    } catch (error: any) {
      toast.add({
        title: 'Fejl ved lagring',
        description: error?.statusMessage ?? 'Fejl ved opdatering.',
        color: 'error'
      })
    }

    return
  }

  const result = createSchema.safeParse({ id })
  if (!result.success) {
    console.error(result.error)
    return
  }

  try {
    await $fetch('/api/rule-tags', {
      method: 'POST',
      body: { id: result.data.id }
    })

    toast.add({
      title: 'Tag oprettet',
      description: `${result.data.id} er oprettet.`
    })

    open.value = false
    emit('saved')
    resetForm()
  } catch (error: any) {
    toast.add({
      title: 'Fejl ved lagring',
      description: error?.statusMessage ?? 'Fejl ved oprettelse.',
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
          {{ isEdit ? `Rediger tag ${props.tagId}` : 'Nyt tag' }}
        </h2>
      </div>
    </template>

    <template #body>
      <UForm :schema="formSchema" :state="state" @submit="onSubmit">
        <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 space-y-4">
          <UFormField label="Tag" name="id" required>
            <UInput
              v-model="state.id"
              :disabled="isEdit"
              placeholder="fx Indløsningaftale"
              class="w-full"
            />
          </UFormField>

          <UFormField v-if="isEdit" label="Nyt tag" name="newId" required>
            <UInput
              v-model="state.newId"
              placeholder="fx Indløsningaftale"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="flex justify-between gap-2 pt-4 mt-6 border-t border-default">
          <UButton
            label="Annuller"
            variant="soft"
            color="neutral"
            @click="open = false"
          />

          <UButton type="submit" color="primary">
            {{ isEdit ? 'Opdater tag' : 'Opret tag' }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
