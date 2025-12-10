<script setup>
import { ref, computed } from 'vue'
import IconUpload from '@/components/icons/IconUpload.vue'
import IconDelete from '@/components/icons/IconDelete.vue'

const props = defineProps(['modelValue', 'fileName', 'disabled'])
const emit = defineEmits(['update:modelValue', 'update:fileName', 'update:fileType'])

const fileInput = ref(null)

const fileType = computed(() => props.fileName
    ? props.fileName.split('.').pop().toLowerCase()
    : null
)

function triggerFileInput() {
    fileInput.value && fileInput.value.click()
}

const objectURL = computed(() => {
    if (props.modelValue instanceof File) {
        return URL.createObjectURL(props.modelValue)
    }
    return null
})

function onFileChange(e) {
    const file = e.target.files[0]
    if (!file) return

    const extension = file.name.split('.').pop().toLowerCase()
    const allowed = ['pdf','jpg','jpeg','png','doc','docx','xls','xlsx','msg']

    if (!allowed.includes(extension)) {
        alert('Filtypen er ikke tilladt')
        e.target.value = ''
        return
    }

    emit('update:modelValue', file)
    emit('update:fileName', file.name)
    emit('update:fileType', extension)
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
            :href="objectURL"
            :download="fileName"
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