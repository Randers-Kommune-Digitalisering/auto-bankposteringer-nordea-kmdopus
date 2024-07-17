<script setup>
    import { ref } from 'vue'
    import { useRouter, useRoute } from 'vue-router'

    import Content from '@/components/Content.vue'
    import IconTable from '@/components/icons/IconTable.vue'

    const konteringsregel = ref(null)
    const isUpdating = ref(false)
    const hasUpdated = ref(false)

    const router = useRouter()
    const route = useRoute()
    const id = route.params.id
    console.log("Rule ID: " + id)
    
    // Fetch regel
    fetch('/api/konteringsregler/' + id)
        .then(response => response = response.json())
        .then(value => konteringsregel.value = value)
        .then(value => console.log(value))

        const keyMap = {
        "reference": {
            "id": 0,
            "key": "value"
        },
        "afsender": {
            "id": 2,
            "key": "value"
        }, 
        "artskonto": {
            "id": 6,
            "key": "Artskonto"
        },
        "posteringstype": {
            "id": 3,
            "key": "value"
        },
        "posteringstekst": {
            "id": 6,
            "key": "Posteringstekst"
        },
        "notat": {
            "id": 6,
            "key": "Notat"
        }
    }

    /* Example data format
        {"0":{"name":"Reference","value":"Rekvireret udb"},"1":{"name":"Advisliste"},"2":{"name":"Afsender"},"3":{"name":"Posteringstype","value":"Cap"},"4":{"name":"End-to-end-reference"},"5":{"name":"Beløb","operator":null},"6":{"Posteringstekst":"Tekst fra bank","Artskonto":"12340000","Notat":"Udbetaling"},"7":{"active":true},"8":{"ruleId":54},"9":{"exception":true}}
    */
    
    function updateRule()
    {
        isUpdating.value = true
        
        fetch('/api/konteringsregler/' + id,
        {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(konteringsregel.value)
        })

            .then(hasUpdated.value = true)
            .then(isUpdating.value = false)
    }


    const awaitingDeleteConfirmation = ref(false)
    
    function deleteRule()
    {
        if(!awaitingDeleteConfirmation.value)
            awaitingDeleteConfirmation.value = true

        else
        {
            fetch('/api/konteringsregler/' + id,
            {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(konteringsregel.value)
            })
            .then( 
                router.push('/konteringsregler')
            )
        }
        /*
        
        
            .then(hasUpdated.value = true)
            .then(isUpdating.value = false)*/
    }


</script>

<template>

    <h2>Konteringsregel #{{id}}</h2>
    
    <Content>
        <template #icon>
            <IconTable />
        </template>
        <template #heading>Redigér konteringsregel</template>
        
        <form @submit.prevent="">
            <fieldset>
                <div class="flexbox">
                    <div v-if="konteringsregel != null" v-for="key in Object.keys(keyMap)">
                        <label :for="key" class="capitalize">{{key}}</label>
                        <input type="text" placeholder="..." :id="key" v-model="(konteringsregel[keyMap[key].id])[keyMap[key].key]" :disabled="keyMap[key].disabled">
                    </div>
                </div>

                <button id="submit" @click="updateRule" :disabled="isUpdating">{{ isUpdating ? 'Gemmer' : hasUpdated ? 'Rettelser gemt' : 'Gem rettelser' }}</button>
                <button @click="deleteRule" class="red float-right">{{ awaitingDeleteConfirmation ? 'Bekræft sletning' : 'Slet regel' }}</button>
                
            </fieldset>
        </form>
    </Content>

</template>
<style scoped>
#submit
{
    margin-left: 1rem;
}
</style>