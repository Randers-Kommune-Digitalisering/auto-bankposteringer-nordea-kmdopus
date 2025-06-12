<script setup>
    import { ref } from 'vue'
    import Content from '@/components/Content.vue'
    import IconClock from '@/components/icons/IconClock.vue'
    import IconRefresh from '@/components/icons/IconRefresh.vue'
    import IconDelete from '@/components/icons/IconDelete.vue'

    const history = ref(null)

    const restartedRunSuccess = ref([])
    const restartedManualSuccess = ref([])
    const removedManualSuccess = ref([])

    const keyMap = {
        "bankdato": { "key": "bookingDate" },
        "id": { "key": "uid" },
        "HTTP-kode": { "key": "statusCode" }
    }
    
    fetch('/api/runhistory')
        .then(response => response = response.json())
        .then(value => history.value = value)

    function restartRun(date, id) {
        if (!confirm('Er du sikker på, at du vil genstarte kørsel for ' + date + '?')) {
            return;
        }
        const url = `/api/restart/${date}?id=${id}`;
        fetch(url)
            .then(response => {
                console.log(response.status);
                restartedRunSuccess.value[date] = response.status === 200;
            });
    }

    function restartManualPostings(date) {
        if (!confirm('Er du sikker på, at du vil genstarte manuelle posteringer for ' + date + '?')) {
            return;
        }
        const url = `/api/remake/${date}`;
        fetch(url)
            .then(response => {
                console.log(response.status);
                restartedManualSuccess.value[date] = response.status === 200;
            });
    }

    function removeManualPostings(date) {
        if (!confirm('Er du sikker på, at du vil fjerne manuelle posteringer for ' + date + '?')) {
            return;
        }
        const url = `/api/remove/${date}`;
        fetch(url)
            .then(response => {
                console.log(response.status);
                removedManualSuccess.value[date] = response.status === 200;
            });
    }

</script>

<template>

    <h2>Kørselshistorik</h2>

    <Content>      
        Her finder du en liste over tidligere kørsler.
        <br>
        En kørsel er indlæsningen af bankposteringer for en given dato, for alle tilmeldte konti.
        <br>
        <br>
        HTTP-koder der starter med "2" indikerer fuldendte kørsler.
        <br>
        Genstarter man en fuldendt kørsel, dannes der ikke manuelle posteringer. Der er således risiko for tabte bankposteringer.
        <br>
        Man har mulighed for at genstarte manuelle posteringer, hvor der omvendt opstår risiko for dublet-posteringer.
        <br>
        Genstart af fuldendte kørsler skal derfor kun bruges i forbindelse med problemer med filudvekslingen med økonomisystemet.
        <br>
        <br>
        HTTP-koder der starter med "4" eller "5" indikerer fejlede kørsler, som ikke har genereret posteringer.
        <br>
        Fejlede kørsler skal genstartes og vil generere manuelle posteringer som en almindelig kørsel.
        <br>
        <br>
        Når en kørsel er genstartet, skal siden efterfølgende opdateres. HTTP-koden for kørslen vil herefter være opdateret.
        <br>
        <br>
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
                    <th>Genstart kørsel</th>
                    <th>Gendan åbne poster</th>
                    <th>Fjern åbne poster</th>
                </tr>
            </thead>
            <tr v-if="history != null && history.length > 0" v-for="obj in history">
                <td v-for="key in keyMap">{{ key.obj != null ? obj[key.obj][key.key] : obj[key.key] }}</td>
            <td>
                <button 
                    @click="restartRun(obj[keyMap.bankdato.key], obj[keyMap.id.key])" 
                    :class="restartedRunSuccess[obj[keyMap.bankdato.key]] != null ? (restartedRunSuccess[obj[keyMap.bankdato.key]] ? 'green' : 'red') : ''"
                >
                    <IconRefresh />
                </button>
            </td>
            <td>
                <button
                    @click="restartManualPostings(obj[keyMap.bankdato.key])"
                    :class="restartedManualSuccess[obj[keyMap.bankdato.key]] != null ? (restartedManualSuccess[obj[keyMap.bankdato.key]] ? 'green' : 'red') : ''"
                >
                    <IconRefresh />
                </button>
            </td>
            <td>
                <button
                    @click="removeManualPostings(obj[keyMap.bankdato.key])"
                    :class="removedManualSuccess[obj[keyMap.bankdato.key]] != null ? (removedManualSuccess[obj[keyMap.bankdato.key]] ? 'green' : 'red') : ''"
                >
                    <IconDelete />
                </button>
            </td>
            </tr>
            <tr v-else>
                <td :colspan=" Object.keys(keyMap).length +3">Der er ingen kørsler at vise</td>
            </tr>
        </table>
    </Content>

</template>