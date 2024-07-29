<script setup>
    import { ref } from 'vue'
    import Content from '@/components/Content.vue'
    import IconTable from '@/components/icons/IconTable.vue'

    const isUpdating = ref(false)
    const hasUpdated = ref(false)

    const isUpdating2 = ref(false)
    const hasUpdated2 = ref(false)

    const bankkonti = ref(null)

    const adminNavn = ref("")
    const adminAuthID = ref("")
    const adminEmail = ref("")

    fetch('/api/stamdata')
        .then(response => response = response.json())
        .then(value => {
            console.log(value)
            adminNavn.value = value.admName
            adminAuthID.value = value.admID
            adminEmail.value = value.admEmail
            console.log(adminNavn.value)
        })

    function updateStamdata()
    {
        hasUpdated.value = false
        isUpdating.value = true

        const url =  '/api/stamdata'
        
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
                "admEmail": adminEmail.value
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

    fetch('/api/bankkonti')
        .then(response => response = response.json())
        .then(value => bankkonti.value = value)


    function addBankkonto()
    {
        bankkonti.value.push({
            "Navn": "",
            "IBAN": "",
            "Statuskonto": "",
            "Mellemregningskonto": ""
        })
    }

    function updateBankkonti()
    {
        console.log("Updating bankkonti")
        console.log(bankkonti.value)

        hasUpdated2.value = false
        isUpdating2.value = true

        const url =  '/api/bankkonti'
        
        fetch(url,
        {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bankkonti.value)
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
        bankkonti.value.splice(index, 1)
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
                </tr>
            </thead>
            <tr>
                <td><input v-model="adminNavn"></input></td>
                <td><input v-model="adminAuthID"></input></td>
                <td><input v-model="adminEmail"></input></td>
            </tr>
        </table>
        <br />
        <button @click="updateStamdata()" :disabled="isUpdating">{{ isUpdating ? 'Gemmer...' : hasUpdated ? 'Ændringer gemt' : 'Gem ændringer' }}</button>
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
                    <th class="capitalize">Spejlkonto i ØS</th>     
                    <th class="capitalize">Mellemregning</th>     
                    <th></th>
                </tr>
            </thead>
            <tr v-for="(value, index) in bankkonti">
                <td><input v-model="value.Navn"></input></td>
                <td><input v-model="value.IBAN"></input></td>
                <td><input v-model="value.Statuskonto"></input></td>
                <td><input v-model="value.Mellemregningskonto"></input></td>
                <td><button @click="removeBankkonto(index)">Slet</button></td>
            </tr>
        </table>
        <br />
        <button @click="addBankkonto()" class="blue">Tilføj</button>
        <button @click="updateBankkonti()" :disabled="isUpdating2">{{ isUpdating2 ? 'Gemmer...' : hasUpdated2 ? 'Ændringer gemt' : 'Gem ændringer' }}</button>


        {{ bankkonti }}
    </Content>

</template>
