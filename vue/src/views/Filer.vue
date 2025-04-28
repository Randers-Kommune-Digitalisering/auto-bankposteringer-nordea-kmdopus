<script setup>
import { ref } from 'vue'
import Content from '@/components/Content.vue'
import IconDoc from '@/components/icons/IconDoc.vue'
import IconDownload from '../components/icons/IconDownload.vue';

const groupedFiles = ref([])

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
                        <a v-if="obj.output" :href="'/api/files/' + obj.groupKey + '.csv/download'">
                            <button><IconDownload /></button>
                        </a>
                        <button v-else disabled><IconDownload /></button>
                    </td>
                    <td>
                        <a v-if="obj.recon" :href="'/api/files/' + obj.groupKey + '_afstem.csv/download'">
                            <button><IconDownload /></button>
                        </a>
                        <button v-else disabled><IconDownload /></button>
                    </td>
                    <td>
                        <a v-if="obj.manual" :href="'/api/files/' + obj.groupKey + '_manual.csv/download'">
                            <button><IconDownload /></button>
                        </a>
                        <button v-else disabled><IconDownload /></button>
                    </td>
                </tr>
            </tbody>
        </table>
    </Content>

</template>