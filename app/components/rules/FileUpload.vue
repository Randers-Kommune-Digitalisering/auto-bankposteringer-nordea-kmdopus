<!-- Den her fil konverterer filer til base64, som passer til KMD Postering Ind -->

<script setup lang="ts">
type AttachmentPayload = {
  names: string[]
  extensions: string[]
  base64: string[]
}

const emit = defineEmits<{
  (e: 'update', value: AttachmentPayload | null): void
}>()

const files = ref<File[] | null>(null)

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Invalid FileReader result'))
        return
      }

      const commaIndex = reader.result.indexOf(',')
      if (commaIndex === -1) {
        reject(new Error('Invalid base64 format'))
        return
      }

      resolve(reader.result.slice(commaIndex + 1))
    }

    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

watch(files, async (newFiles) => {
  if (!newFiles || newFiles.length === 0) {
    emit('update', null)
    return
  }

  try {
    const base64List = await Promise.all(
      newFiles.map(fileToBase64)
    )

    emit('update', {
      names: newFiles.map(f => f.name),
      extensions: newFiles.map(f => f.name.split('.').pop() ?? ''),
      base64: base64List
    })
  } catch (err) {
    console.error('File conversion failed', err)
    emit('update', null)
  }
})
</script>

<template>
  <UFileUpload
    v-model="files"
    icon="i-lucide-paperclip"
    label="Vedhæft bilag"
    description="PDF, Excel, billeder m.m."
    layout="list"
    multiple
    :interactive="false"
    class="w-full min-h-32"
  >
    <template #actions="{ open }">
      <UButton
        label="Vælg filer"
        icon="i-lucide-upload"
        color="neutral"
        variant="outline"
        @click="open()"
      />
    </template>

    <template #files-bottom="{ removeFile, files }">
      <UButton
        v-if="files?.length"
        label="Fjern alle filer"
        color="neutral"
        variant="soft"
        @click="removeFile()"
      />
    </template>
  </UFileUpload>
</template>
