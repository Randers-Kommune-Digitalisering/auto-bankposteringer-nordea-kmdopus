<script setup>
    import { ref } from 'vue'
    import Content from '@/components/Content.vue'
    import IconTable from '@/components/icons/IconTable.vue'

    const refreshPage = () => {
        location.reload(); // Reloads the current page
    };

    const isUpdating = ref(false)
    const hasUpdated = ref(false)

    const isUpdating2 = ref(false)
    const hasUpdated2 = ref(false)

    const bankaccounts = ref(null)

    const adminNavn = ref("")
    const adminAuthID = ref("")
    const adminEmail = ref("")
    const erpSystem = ref("")
    const integrationBool = ref(false)

    fetch('/api/masterdata')
        .then(response => response = response.json())
        .then(value => {
            adminNavn.value = value.admName
            adminAuthID.value = value.admID
            adminEmail.value = value.admEmail
            erpSystem.value = value.erpSystem
            integrationBool.value = value.integrationBool
        })

    function updateMasterdata()
    {
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
    }

    fetch('/api/bankaccounts')
        .then(response => response = response.json())
        .then(value => bankaccounts.value = value)


    function addBankaccount()
    {
        bankaccounts.value.push({
            "bankAccountName": "",
            "bankAccount": "",
            "statusAccount": "",
            "intermediateAccount": ""
        })
    }

    function updateBankaccounts()
    {
        console.log("Updating bank accounts")
        console.log(bankaccounts.value)

        hasUpdated2.value = false
        isUpdating2.value = true

        const url =  '/api/bankaccounts'
        
        fetch(url,
        {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bankaccounts.value)
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
            isUpdating2.value = false
            hasUpdated2.value = true
        })
    }

    function removeBankkonto(index)
    {
        bankaccounts.value.splice(index, 1)
    }

</script>

<template>

    <h2>Stamdata</h2>
    
    <Content>
        <template #icon>
            <IconTable />
        </template>
        <template #heading>Administrator</template>
        
        <table>
            <thead>
                <tr>
                    <th class="capitalize">Navn</th>
                    <th class="capitalize">Authenticator ID</th>
                    <th class="capitalize">E-mail</th>
                    <th class="capitalize">Økonomisystem</th>
                    <th class="capitalize">Integration</th>
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
            </tr>
        </table>
        <br />
        <button @click="updateMasterdata(); refreshPage()" :disabled="isUpdating">{{ isUpdating ? 'Gemmer...' : hasUpdated ? 'Ændringer gemt' : 'Gem ændringer' }}</button>
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
                    <th></th>
                </tr>
            </thead>
            <tr v-for="(value, index) in bankaccounts">
                <td><input v-model="value.bankAccountName"></input></td>
                <td><input v-model="value.bankAccount"></input></td>
                <td><input v-model="value.statusAccount"></input></td>
                <td><input v-model="value.intermediateAccount"></input></td>
                <td><button @click="removeBankkonto(index)">Slet</button></td>
            </tr>
        </table>
        <br />
        <button @click="addBankaccount()" class="blue">Tilføj</button>
        <button @click="updateBankaccounts()" :disabled="isUpdating2">{{ isUpdating2 ? 'Gemmer...' : hasUpdated2 ? 'Ændringer gemt' : 'Gem ændringer' }}</button>

    </Content>

</template>
