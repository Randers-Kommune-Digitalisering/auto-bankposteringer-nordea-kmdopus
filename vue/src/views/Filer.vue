<script setup>
import { ref } from 'vue'
import Content from '@/components/Content.vue'
import IconDoc from '@/components/icons/IconDoc.vue'
import IconDownload from '../components/icons/IconDownload.vue';

const outputFiles = ref([])
const reconFiles = ref([])
const groupedFiles = ref([])

const keyMap = {
    "bankdato": {
        "key": "groupKey"
    }
}

// Fetch and group files
Promise.all([
    fetch('/api/files').then(response => response.json()),
    fetch('/api/recon').then(response => response.json())
]).then(([output, recon]) => {
    outputFiles.value = output
    reconFiles.value = recon

    // Group files by the first 10 characters of their names
    const fileMap = new Map()

    output.forEach(file => {
        const groupKey = file.name.substring(0, 10)
        if (!fileMap.has(groupKey)) {
            fileMap.set(groupKey, { output: null, recon: null })
        }
        fileMap.get(groupKey).output = file
    })

    recon.forEach(file => {
        const groupKey = file.name.substring(0, 10)
        if (!fileMap.has(groupKey)) {
            fileMap.set(groupKey, { output: null, recon: null })
        }
        fileMap.get(groupKey).recon = file
    })

    groupedFiles.value = Array.from(fileMap.entries()).map(([key, value]) => ({
        groupKey: key,
        output: value.output,
        recon: value.recon
    }))
})
</script>

<template>

    <h2>Filbibliotek</h2>

    <Content>
        <template #icon>
            <IconDoc />
        </template>
        <template #heading>Filer</template>
        
        <table>
            <thead>
                <tr>
                    <th>Bankdato</th>
                    <th>Posteringsbilag</th>
                    <th>Afstemningsbilag</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="obj in groupedFiles" :key="obj.groupKey">
                    <td>{{ obj.groupKey }}</td>
                    <td>
                        <a v-if="obj.output" :href="'/api/filer/' + obj.output[keyMap.bankdato.key] + '/download'">
                            <button><IconDownload /></button>
                        </a>
                        <button v-else disabled><IconDownload /></button>
                    </td>
                    <td>
                        <a v-if="obj.recon" :href="'/api/filer/' + obj.recon[keyMap.bankdato.key] + '/download'">
                            <button><IconDownload /></button>
                        </a>
                        <button v-else disabled><IconDownload /></button>
                    </td>
                </tr>
            </tbody>
        </table>
    </Content>

</template>