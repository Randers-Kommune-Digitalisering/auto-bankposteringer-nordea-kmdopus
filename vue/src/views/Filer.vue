<script setup>
    import { ref } from 'vue'
    import Content from '@/components/Content.vue'
    import IconTable from '@/components/icons/IconTable.vue'

    const outputFiles = ref(null)
    const logFiles = ref(null)

    const keyMap = {
        "filnavn": {
            "key": "name"
        },
        "tidsstempel":
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

</script>

<template>

    <h2>Filbibliotek</h2>
    
    <Content>
        <template #icon>
            <IconTable />
        </template>
        <template #heading>Omposteringsbilag</template>

        <span class="paragraph">
            Bogføringsdatoen fremgår af filnavnet
        </span>
        
        <table>
            <thead>
                <tr>
                    <th v-for="key in Object.keys(keyMap)" class="capitalize">{{key}}</th>
                    <th></th>
                </tr>
            </thead>
            <tr v-for="obj in outputFiles">
                <td v-for="key in keyMap">{{ key.obj != null ? obj[key.obj][key.key] : obj[key.key] }}</td>
                <td><a :href="'/api/filer/' + obj[keyMap.filnavn.key] + '/download'"><button @click="">Download</button></a></td>
            </tr>
        </table>
    </Content>
    
</template>