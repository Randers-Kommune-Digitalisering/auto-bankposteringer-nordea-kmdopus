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

    const index = ref(route.params.id)
    const isNewRule = ref(index.value == "nyaktiv" || index.value == "nyinaktiv" || index.value == "nyundtagelse")

    console.log("IS NEW RULE: " + isNewRule.value)
    
    const konteringsregel = ref(isNewRule.value ? JSON.parse(JSON.stringify(newItem)) : null)

    if(isNewRule)
    {   
        if(index.value == "nyinaktiv")
            konteringsregel.value.Active = false
        else if(index.value == "nyundtagelse")
            konteringsregel.value.Exception = true
    }
    
    // Fetch regel
    if(!isNewRule.value)
        fetch('/api/konteringsregler/' + index.value)
            .then(response => response = response.json())
            .then(value => konteringsregel.value = value)
            .then(value => console.log(value))

    const keyMap_rule = {
        "id": {
            "key": "RuleID",
            "hidden": true
        },
        "Advis": {
            "key": "Advisliste"
        },
        "Reference": {
            "key": "Reference"
        },
        "Afsender": {
            "key": "Afsender"
        }, 
        "Artskonto": {
            "key": "Artskonto"
        },
        "Posteringstype": {
            "key": "Posteringstype"
        },
        "Posteringstekst": {
            "key": "Posteringstekst",
            "hidden": true
        },
        "Notat": {
            "key": "Notat"
        }
    }

    const keyMap_exception = {
        "id": {
            "key": "RuleID",
            "hidden": true
        },
        "Advis": {
            "key": "Advisliste"
        },
        "Reference": {
            "key": "Reference"
        },
        "Afsender": {
            "key": "Afsender"
        }, 
        "Artskonto": {
            "key": "Artskonto",
            "hidden": true
        },
        "Posteringstype": {
            "key": "Posteringstype"
        },
        "Posteringstekst": {
            "key": "Posteringstekst",
            "hidden": true
        },
        "Notat": {
            "key": "Notat"
        }
    }

    const keyMap = index.value == 'nyundtagelse' ? keyMap_exception : keyMap_rule
    
    function updateRule()
    {
        hasUpdated.value = false
        isUpdating.value = true

        const url = isNewRule.value ? '/api/konteringsregler' : '/api/konteringsregler/' + konteringsregel.value.RuleID
        
        fetch(url,
        {
            method: isNewRule.value ? 'POST' : 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(konteringsregel.value)
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
        .then(value => {
            if(isNewRule.value)
            {
                isNewRule.value = false
                
                // Set ID's from response
                index.value = value.RuleID
                konteringsregel.value.RuleID = value.RuleID
                konteringsregel.value[keyMap.id.key] = value.RuleID

                router.push('/retkonteringsregel/' + value.RuleID)
            }
        })
        .finally(() => {
            isUpdating.value = false
            hasUpdated.value = true
        })
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

            fetch('/api/konteringsregler/' + konteringsregel.value.RuleID,
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
        <span v-if="isNewRule">Ny konteringsregel</span>
        <span v-else>Konteringsregel #{{konteringsregel[keyMap.id.key]}}</span>
    </h2>
    <h2 v-else>Indlæser...</h2>
    
    <Content>
        <template #icon>
            <IconTable />
        </template>
        <template #heading>{{isNewRule ? 'Opret' : 'Redigér'}} konteringsregel</template>
        
        <form @submit.prevent="">
            <fieldset>
                <div class="flexbox">
                    <div v-for="(value, key) in keyMap" :class="value.hidden ? 'hidden' : ''">
                        <label :for="key" class="capitalize">{{key}}</label>
                        <input type="text" placeholder="..." :id="key" v-if="konteringsregel != null && !value.hidden" v-model="konteringsregel[value.key]" @change="hasUpdated = false" :disabled="value.disabled">
                        <input type="text" placeholder="Indlæser..." :id="key" v-if="konteringsregel == null && !value.hidden" disabled="true">
                    </div>
                </div>

                <button id="submit" @click="updateRule" :disabled="isUpdating">{{ isUpdating ? 'Gemmer ...' : hasUpdated ? 'Rettelser gemt' : isNewRule ? 'Opret regel' : 'Gem rettelser' }}</button>
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