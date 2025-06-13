<script setup>
import { ref } from 'vue'
import IconUpload from '@/components/icons/IconUpload.vue'
import IconDelete from '@/components/icons/IconDelete.vue'

const props = defineProps(['modelValue', 'fileName', 'disabled'])
const emit = defineEmits(['update:modelValue', 'update:fileName'])

const fileInput = ref(null)

function triggerFileInput() {
    fileInput.value && fileInput.value.click()
}

function onFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = function(ev) {
        emit('update:modelValue', ev.target.result.split(',')[1])
        emit('update:fileName', file.name.replace(/\.[^/.]+$/, ""))
    }
    reader.readAsDataURL(file)
}
function removeFile() {
    emit('update:modelValue', null)
    emit('update:fileName', null)
    if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
    <input
        type="file"
        accept="application/pdf"
        ref="fileInput"
        style="display: none;"
        @change="onFileChange"
        :disabled="disabled"
    />
    <button
        v-if="!fileName"
        type="button"
        @click="triggerFileInput"
        :disabled="disabled"
    >
        <IconUpload />
    </button>
    <span v-if="fileName">
        <a
            v-if="modelValue"
            :href="`data:application/pdf;base64,${modelValue}`"
            :download="fileName + '.pdf'"
            target="_blank"
            rel="noopener"
            style="text-decoration: underline; color: #007bff; cursor: pointer;"
        >
            {{ fileName }}.pdf
        </a>
        <span v-else>
            {{ fileName }}.pdf
        </span>
    </span>
    <button
        v-if="fileName"
        type="button"
        @click="removeFile"
    >
        <IconDelete />
    </button>
</template>