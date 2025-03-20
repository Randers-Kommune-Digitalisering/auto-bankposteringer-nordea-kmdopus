<script setup>
    import { ref } from 'vue'
    import Content from '@/components/Content.vue'
    import IconDoc from '@/components/icons/IconDoc.vue'
    import IconDownload from '../components/icons/IconDownload.vue';
    
    const outputFiles = ref(null)
    const reconFiles = ref(null)

    const keyMap = {
        "filnavn": {
            "key": "name"
        },
        "oprettelsestidspunkt":
        {
            "obj": "stat",
            "key": "created"
        },
        "størrelse":
        {
            "obj": "stat",
            "key": "size"
        }
    }
    
    // Læs output filer
    fetch('/api/files')
        .then(response => response = response.json())
        .then(value => outputFiles.value = value)

    // Læs afstemningsfiler
    fetch('/api/recon')
    .then(response => response = response.json())
    .then(value => reconFiles.value = value)

</script>

<template>

    <h2>Filbibliotek</h2>

    <Content>
        <template #icon>
            <IconDoc />
        </template>
        <template #heading>Posteringsbilag</template>

        <span class="paragraph">
            Bankdatoen fremgår af filnavnet
        </span>
        
        <table>
            <thead>
                <tr>
                    <th v-for="key in Object.keys(keyMap)" class="capitalize">{{key}}</th>
                    <th>Download</th>
                </tr>
            </thead>
            <tr v-for="obj in outputFiles">
                <td v-for="key in keyMap">{{ key.obj != null ? obj[key.obj][key.key] : obj[key.key] }}</td>
                <td><a :href="'/api/filer/' + obj[keyMap.filnavn.key] + '/download'"><button @click=""><IconDownload /></button></a></td>
            </tr>
        </table>
    </Content>

    <Content>
        <template #icon>
            <IconDoc />
        </template>
        <template #heading>Afstemningsbilag</template>
        
        <table>
            <thead>
                <tr>
                    <th v-for="key in Object.keys(keyMap)" class="capitalize">{{key}}</th>
                    <th>Download</th>
                </tr>
            </thead>
            <tr v-for="obj in reconFiles">
                <td v-for="key in keyMap">{{ key.obj != null ? obj[key.obj][key.key] : obj[key.key] }}</td>
                <td><a :href="'/api/filer/' + obj[keyMap.filnavn.key] + '/download'"><button @click=""><IconDownload /></button></a></td>
            </tr>
        </table>
    </Content>
    
</template>