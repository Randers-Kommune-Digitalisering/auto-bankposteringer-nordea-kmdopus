<script setup>
    import { ref } from 'vue'
    import { useRouter, useRoute } from 'vue-router'

    import Content from '@/components/Content.vue'
    import IconTable from '@/components/icons/IconTable.vue'
    import newItem from '@/assets/newItem.json'

    const isUpdating = ref(false)
    const hasUpdated = ref(false)

    const router = useRouter()
    const route = useRoute()

    const index = route.params.id
    const isNewRule = index == "new"
    
    const konteringsregel = ref(isNewRule ? JSON.parse(JSON.stringify(newItem)) : null)
    
    // Fetch regel
    if(!isNewRule)
        fetch('/api/konteringsregler/' + index)
            .then(response => response = response.json())
            .then(value => konteringsregel.value = value)

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
        hasUpdated.value = false
        isUpdating.value = true

        const url = isNewRule ? '/api/konteringsregler' : '/api/konteringsregler/' + konteringsregel.value.id
        console.log(url)
        
        fetch(url,
        {
            method: isNewRule ? 'POST' : 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(konteringsregel.value)
        })

        .then(response => isUpdating.value = false)
        .then(response => hasUpdated.value = true)
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

    <h2 v-if="konteringsregel != null">
        <span v-if="index == 'new'">Ny konteringsregel</span>
        <span v-else>Konteringsregel #{{konteringsregel[keyMap.ruleId.id][keyMap.ruleId.key]}}</span>
    </h2>
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
                        <input type="text" placeholder="..." :id="key" v-if="konteringsregel != null && !value.hidden" v-model="konteringsregel[value.id][value.key]" @change="hasUpdated = false" :disabled="value.disabled">
                        <input type="text" placeholder="Indlæser ..." :id="key" v-if="konteringsregel == null && !value.hidden" disabled="true">
                    </div>
                </div>

                <button id="submit" @click="updateRule" :disabled="isUpdating">{{ isUpdating ? 'Gemmer ...' : hasUpdated ? 'Rettelser gemt' : 'Gem rettelser' }}</button>
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