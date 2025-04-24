<script setup>
    import { ref } from 'vue'
    import Content from '@/components/Content.vue'
    import IconClock from '@/components/icons/IconClock.vue'
    import IconRefresh from '@/components/icons/IconRefresh.vue'
    
    const history = ref(null)

    const keyMap = {
        "bankdato": {
            "key": "bookingDate"
        },
        "id": {
            "key": "uid"
        },
        "HTTP-kode": {
            "key": "statusCode"
        }
    }
    
    fetch('/api/runhistory')
        .then(response => response = response.json())
        .then(value => history.value = value)

    function restartRun(date)
    {
        const url = '/api/restart/' + date

        fetch(url)
            .then(response => {
                console.log(response.status)
                restartedRunSuccess.value[date] = response.status === 200
            })

            
    }

    var restartedRunSuccess = ref([])

</script>

<template>

    <h2>Kørselshistorik</h2>

    <Content>      
        HTTP-koder der starter med "2" indikerer fuldendte kørsler.
        <br>
        HTTP-koder der starter med "4" eller "5" indikerer fejlede kørsler som ikke har genereret posteringer.
        <br>
        <br>
        Når en kørsel er genstartet, skal siden efterfølgende opdateres. HTTP-koden for kørslen vil herefter være opdateret.
    </Content>
    
    <Content>
        <template #icon>
            <IconClock />
        </template>
        <template #heading>Kørsler</template>
        
        <table>
            <thead>
                <tr>
                    <th v-for="key in Object.keys(keyMap)" class="capitalize">{{key}}</th>
                    <th>Genstart</th>
                </tr>
            </thead>
            <tr v-if="history != null && history.length > 0" v-for="obj in history">
                <td v-for="key in keyMap">{{ key.obj != null ? obj[key.obj][key.key] : obj[key.key] }}</td>
                <td>
                    <button @click="restartRun(obj[keyMap.bankdato.key])" :class="restartedRunSuccess[obj[keyMap.bankdato.key]] != null ? (restartedRunSuccess[obj[keyMap.bankdato.key]] ? 'green' : 'red') : ''">
                    <IconRefresh />&nbsp;{{restartedRunSuccess[obj[keyMap.bankdato.key]] != null  ? (restartedRunSuccess ? 'Kørsel genstartet' : 'Fejl ved genstart') : 'Genstart kørsel'}}</button>
                </td>
            </tr>
            <tr v-else>
                <td :colspan=" Object.keys(keyMap).length +1">Der er ingen kørsler at vise</td>
            </tr>
        </table>
    </Content>

</template>