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

    const index = route.params.id
    
    // Fetch regel
    fetch('/api/konteringsregler/' + index)
        .then(response => response = response.json())
        .then(value => konteringsregel.value = value)
        .then(value => console.log(value))

        const keyMap = {
        "id": {
            "key": "id",
            "hidden": true
        },
        "ruleId": {
            "id": 8,
            "key": "ruleId",
            "hidden": true
        },
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
        
        fetch('/api/konteringsregler/' + konteringsregel.value.id,
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
    const isDeleting = ref(false)
    
    function deleteRule()
    {
        if(!awaitingDeleteConfirmation.value)
            awaitingDeleteConfirmation.value = true

        else
        {
            isDeleting.value = true
            
            fetch('/api/konteringsregler/' + konteringsregel.value.id,
            {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            .finally(response =>
                router.push('/konteringsregler')
            )
        }
        /*
        
        
            .then(hasUpdated.value = true)
            .then(isUpdating.value = false)*/
    }


</script>

<template>

    <h2 v-if="konteringsregel != null">Konteringsregel #{{konteringsregel[keyMap.ruleId.id][keyMap.ruleId.key]}}</h2>
    <h2 v-else>Indlæser...</h2>
    
    <Content>
        <template #icon>
            <IconTable />
        </template>
        <template #heading>Redigér konteringsregel</template>
        
        <form @submit.prevent="">
            <fieldset>
                <div class="flexbox">
                    <div v-for="(value, key) in keyMap">
                        <label :for="key" class="capitalize" v-if="!value.hidden">{{key}}</label>
                        <input type="text" placeholder="..." :id="key" v-if="konteringsregel != null && !value.hidden" v-model="konteringsregel[value.id][value.key]" :disabled="value.disabled">
                    </div>
                </div>

                <button id="submit" @click="updateRule" :disabled="isUpdating">{{ isUpdating ? 'Gemmer' : hasUpdated ? 'Rettelser gemt' : 'Gem rettelser' }}</button>
                <button @click="deleteRule" class="red float-right" :disabled="isDeleting">{{ awaitingDeleteConfirmation ? 'Bekræft sletning' : 'Slet regel' }}</button>
                
            </fieldset>
        </form>
    </Content>

</template>

<style scoped>
    .hidden {
        display:none;
    }
</style>