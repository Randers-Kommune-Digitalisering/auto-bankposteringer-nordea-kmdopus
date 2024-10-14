<script setup>
    import { ref } from 'vue'
    import Content from '@/components/Content.vue'
    import IconTable from '@/components/icons/IconTable.vue'
    import IconCompass from '../components/icons/IconCompass.vue';
    
    const history = ref(null)
    const reconFiles = ref(null)

    const keyMap = {
        "id": {
            "key": "uid"
        },
        "dato": {
            "key": "dato"
        },
        "success":
        {
            "key": "success"
        }
    }
    
    // Læs output filer
    fetch('/api/runhistory')
        .then(response => response = response.json())
        .then(value => history.value = value)

    function restartRun(uid)
    {
        const url = '/api/restart/' + uid
       

        fetch(url)
            .then(response => {
                //restartedRunUid.value = uid
                console.log(response.status)
                restartedRunSuccess.value[uid] = response.status === 200
            })

            
    }

    //var restartedRunUid = ref(null)
    var restartedRunSuccess = ref([])

</script>

<template>

    <h2>Kørselshistorik</h2>
    
    <span class="paragraph">
        Hej
    </span>

    <Content>
        <template #icon>
            <IconTable />
        </template>
        <template #heading>Historik</template>
        
        <table>
            <thead>
                <tr>
                    <th v-for="key in Object.keys(keyMap)" class="capitalize">{{key}}</th>
                    <th>Genstart</th>
                </tr>
            </thead>
            <tr v-if="history != null && history.length > 0" v-for="obj in history">
                <td v-for="key in keyMap">{{ key.obj != null ? obj[key.obj][key.key] : obj[key.key] }}</td>
                <td><button @click="restartRun(obj[keyMap.id.key])" :class="restartedRunSuccess[obj[keyMap.id.key]] != null ? (restartedRunSuccess[obj[keyMap.id.key]] ? 'green' : 'red') : ''">
                    <IconCompass />&nbsp;{{restartedRunSuccess[obj[keyMap.id.key]] != null  ? (restartedRunSuccess ? 'Kørsel genstartet' : 'Fejl ved genstart') : 'Genstart kørsel'}}</button></td>
            </tr>
            <tr v-else>
                <td :colspan=" Object.keys(keyMap).length +1">Der er ingen kørsler at vise</td>
            </tr>
        </table>
    </Content>

</template>