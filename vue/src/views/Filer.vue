<script setup>
import { ref } from 'vue'
import Content from '@/components/Content.vue'
import IconDoc from '@/components/icons/IconDoc.vue'
import IconDownload from '../components/icons/IconDownload.vue';

const groupedFiles = ref([])
const downloadedFiles = ref(new Set(JSON.parse(localStorage.getItem('downloadedFiles') || '[]')))

// Fetch and group files
fetch('/api/files')
    .then(response => response.json())
    .then((files) => {
        const fileMap = new Map()

        // Group files by the first 10 characters of their names
        files.forEach(file => {
            const groupKey = file.name.substring(0, 10)
            if (!fileMap.has(groupKey)) {
                fileMap.set(groupKey, { output: null, recon: null, manual: null })
            }
            if (file.name.endsWith('_manual.csv')) {
                fileMap.get(groupKey).manual = file
            } else if (file.name.endsWith('_afstem.csv')) {
                fileMap.get(groupKey).recon = file
            } else {
                fileMap.get(groupKey).output = file
            }
        })

        groupedFiles.value = Array.from(fileMap.entries()).map(([key, value]) => ({
            groupKey: key,
            output: value.output,
            recon: value.recon,
            manual: value.manual
        }))
    })

function markAsDownloaded(groupKey) {
    downloadedFiles.value.add(groupKey)
    localStorage.setItem('downloadedFiles', JSON.stringify(Array.from(downloadedFiles.value)))
}

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
                    <th>Manuelle posteringer</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="obj in groupedFiles" :key="obj.groupKey">
                    <td>{{ obj.groupKey }}</td>
                    <td>
                        <a v-if="obj.output" :href="'/api/files/' + obj.groupKey + '.csv/download'" @click="markAsDownloaded(obj.groupKey)">
                            <button :class="{ downloaded: downloadedFiles.has(obj.groupKey) }"><IconDownload /></button>
                        </a>
                        <button v-else disabled><IconDownload /></button>
                    </td>
                    <td>
                        <a v-if="obj.recon" :href="'/api/files/' + obj.groupKey + '_afstem.csv/download'" @click="markAsDownloaded(obj.groupKey + '_afstem')">
                            <button :class="{ downloaded: downloadedFiles.has(obj.groupKey + '_afstem') }"><IconDownload /></button>
                        </a>
                        <button v-else disabled><IconDownload /></button>
                    </td>
                    <td>
                        <a v-if="obj.manual" :href="'/api/files/' + obj.groupKey + '_manual.csv/download'" @click="markAsDownloaded(obj.groupKey + '_manual')">
                            <button :class="{ downloaded: downloadedFiles.has(obj.groupKey + '_manual') }"><IconDownload /></button>
                        </a>
                        <button v-else disabled><IconDownload /></button>
                    </td>
                </tr>
            </tbody>
        </table>
    </Content>
</template>

<style scoped>
    button.downloaded {
        background-color: var(--randers-color-light) !important;
    }
</style>