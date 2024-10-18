<script setup>
    import { ref, onMounted, onUnmounted } from 'vue'
    import eventBus from '@/eventBus.js'
    import Content from '@/components/Content.vue'
    import IconTable from '@/components/icons/IconTable.vue'
    import IconAdd from '../components/icons/IconAdd.vue'
    import IconDelete from '../components/icons/IconDelete.vue'
    import IconSave from '../components/icons/IconSave.vue'
    import IconProfile from '@/components/icons/IconProfile.vue'
    import IconRefresh from '@/components/icons/IconRefresh.vue'

    const isUpdating = ref(false)
    const hasUpdated = ref(false)
    const isUpdating2 = ref(false)
    const hasUpdated2 = ref(false)
    const isUpdating3 = ref(false)

    const bankaccounts = ref(null)

    const adminNavn = ref("")
    const adminAuthID = ref("")
    const adminEmail = ref("")
    const erpSystem = ref("")
    const integrationBool = ref(false)

    const authStatus = ref("")

    // Retreive updates to auth status
    onMounted(() => {
        const ws = new WebSocket('/api/wss/authstatus');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            authStatus.value = data.status; // Update status in your Vue app
        };

        onUnmounted(() => {
            ws.close(); // Clean up when the component is destroyed
        });
    });

    fetch('/api/masterdata')
        .then(response => response = response.json())
        .then(value => {
            adminNavn.value = value.admName
            adminAuthID.value = value.admID
            adminEmail.value = value.admEmail
            erpSystem.value = value.erpSystem
            integrationBool.value = value.integrationBool
        })

    function updateMasterdata() {
        hasUpdated.value = false
        isUpdating.value = true

        const url =  '/api/masterdata'
        
        fetch(url,
        {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "admName": adminNavn.value,
                "admID": adminAuthID.value,
                "admEmail": adminEmail.value,
                "erpSystem": erpSystem.value,
                "integrationBool": integrationBool.value 
            })
        })

        .then(response => {
            if(response.ok)
            {
                var value = response.json()
                return value
            }
            else
                throw new Error('Error connecting to back-end')
        })

        .finally(() => {
            isUpdating.value = false
            hasUpdated.value = true
        })

        // Emit an event to notify other components
        eventBus.emit('integrationToggled', integrationBool.value);
    }

    fetch('/api/bankaccounts')
        .then(response => response = response.json())
        .then(value => bankaccounts.value = value)

    function addBankaccount() {
        bankaccounts.value.push({
            "bankAccountName": "",
            "bankAccount": "",
            "statusAccount": "",
            "intermediateAccount": ""
        })
    }

    function updateBankaccounts() {
        console.log("Updating bank accounts")
        console.log(bankaccounts.value)

        hasUpdated2.value = false
        isUpdating2.value = true
        
        fetch('/api/bankaccounts', {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bankaccounts.value)
        })
        .then(response => {
            if (response.ok) {
                var value = response.json()
                return value
            }
            else throw new Error('Error connecting to back-end')
        })
        .finally(() => {
            isUpdating2.value = false
            hasUpdated2.value = true
        })
    }

    function removeBankaccount(index) {
        bankaccounts.value.splice(index, 1)
    }

    function pollForStatus(url, interval, maxRetries, onError, onComplete) {
        let retries = 0;

        const poll = () => {
            fetch(url)
                .then(response => {
                    if (response.status === 202 && retries < maxRetries) {
                        console.log('Still processing, status 202, retrying...');
                        retries++;
                        setTimeout(poll, interval); // Retry after specified interval
                    }
                    else if (response.status === 200) {
                        console.log('Authentication successful');
                    } else {
                        throw new Error(`Error: Status ${response.status}`);
                    }
                })
                .catch(error => {
                    console.error(error);
                    onError(error);
                })
        };

        poll(); // Start polling
        onComplete();
    }

    function restartAuth() {
        isUpdating3.value = true;

        pollForStatus(
            '/api/reauth',
            2000, // Poll every 2 seconds
            60,   // Max retries
            (error) => { // onError
                console.error(error);
            },
            () => { // onComplete
                isUpdating3.value = false;
            }
        );
    }

</script>

<template>

    <h2>Stamdata</h2>
    
    <Content>
        <template #icon>
            <IconProfile />
        </template>
        <template #heading>Opsætning</template>
        
        <table>
            <thead>
                <tr>
                    <th>Navn</th>
                    <th>Authenticator ID</th>
                    <th>E-mail</th>
                    <th>Økonomisystem</th>
                    <th>FTP til ØS</th>
                    <th>Autorisation</th>
                    <th>Genstart autorisation</th>
                </tr>
            </thead>
            <tr>
                <td><input v-model="adminNavn"></input></td>
                <td><input v-model="adminAuthID"></input></td>
                <td><input v-model="adminEmail"></input></td>
                <td><select v-model="erpSystem">
                    <option>KMD Opus</option>
                    <option>Fujitsu Prisme</option>
                    <option>ØS Indsigt</option>
                </select></td>
                <td><input type="checkbox" v-model="integrationBool"></td>
                <td><span>{{ authStatus ? authStatus : 'Inaktiv' }}</span></td>
                <td>
                    <button @click="restartAuth()" :disabled="isUpdating3"><IconRefresh /></button>
                </td>
            </tr>
        </table>
        <br />
        <button @click="updateMasterdata()" :disabled="isUpdating">
            <template v-if="isUpdating">Gemmer...</template>
            <template v-if="hasUpdated">Ændringer gemt</template>
            <template v-else><IconSave /></template>
        </button>
    </Content>

    <Content>
        <template #icon>
            <IconTable />
        </template>
        <template #heading>Bankkonti</template>
        
        <table>
            <thead>
                <tr>
                    <th class="capitalize">Navn</th>
                    <th class="capitalize">IBAN</th>
                    <th class="capitalize">Statuskonto</th>     
                    <th class="capitalize">Mellemregning</th>     
                    <th class="capitalize">Slet</th>
                </tr>
            </thead>
            <tr v-for="(value, index) in bankaccounts">
                <td><input v-model="value.bankAccountName"></input></td>
                <td><input v-model="value.bankAccount"></input></td>
                <td><input v-model="value.statusAccount"></input></td>
                <td><input v-model="value.intermediateAccount"></input></td>
                <td><button @click="removeBankaccount(index)"><IconDelete /></button></td>
            </tr>
        </table>
        <br />
        <button @click="addBankaccount()" class="blue"><IconAdd /></button>
        <button @click="updateBankaccounts()" :disabled="isUpdating2">
            <template v-if="isUpdating2">Gemmer...</template>
            <template v-if="hasUpdated2">Ændringer gemt</template>
            <template v-else><IconSave /></template>
        </button>
    </Content>
</template>
