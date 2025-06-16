<script setup>
import { ref, computed } from 'vue'
import IconUpload from '@/components/icons/IconUpload.vue'
import IconDelete from '@/components/icons/IconDelete.vue'

const props = defineProps(['modelValue', 'fileName', 'disabled'])
const emit = defineEmits(['update:modelValue', 'update:fileName', 'update:fileType'])

const fileInput = ref(null)

const mimeTypes = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

const fileType = computed(() => props.fileName
    ? props.fileName.split('.').pop().toLowerCase()
    : null
)

const mimeType = computed(() => mimeTypes[fileType.value] || 'application/octet-stream')

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
        emit('update:fileType', file.name.split('.').pop().toLowerCase())
    }
    reader.readAsDataURL(file)
}
function removeFile() {
    emit('update:modelValue', null)
    emit('update:fileName', null)
    emit('update:fileType', null)
    if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
    <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
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
            :href="`data:${mimeType.value};base64,${modelValue}`"
            :download="fileName + (fileType.value ? '.' + fileType.value : '')"
            target="_blank"
            rel="noopener"
            style="text-decoration: underline; color: #007bff; cursor: pointer;"
        >
            {{ fileName }}
            <span v-if="fileType.value">
                .{{ fileType.value }}
            </span>
        </a>
    </span>
    <button
        v-if="fileName"
        type="button"
        @click="removeFile"
    >
        <IconDelete />
    </button>
</template>