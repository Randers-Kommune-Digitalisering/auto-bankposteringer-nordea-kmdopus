<script setup>
    import { ref, watch, computed } from 'vue'
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
    
    const konteringsregel = ref(isNewRule.value ? JSON.parse(JSON.stringify(newItem)) : null)

    const exceptionBool = ref(false)
    const activeBool = ref(false)

    if (isNewRule.value)
    {   
        if (index.value === 'nyinaktiv') konteringsregel.value.Active = false
        else if (index.value === 'nyundtagelse') konteringsregel.value.Exception = true
    } else {
        // Fetch regel
        fetch(`/api/konteringsregler/${index.value}`)
            .then(response => response.json())
            .then(value => {
                konteringsregel.value = value
                exceptionBool.value = konteringsregel.value.Exception
                activeBool.value = konteringsregel.value.Active
            })
    }

    // Watch for changes in konteringsregel to keep booleans updated
    watch(() => konteringsregel.value, newValue => {
        if (newValue) {
            exceptionBool.value = newValue.Exception
            activeBool.value = newValue.Active
        }
    })

    // Virker ikke
    console.log(exceptionBool.value)
    console.log(activeBool.value)

    const keyMap_rule = {
        "id": { "key": "RuleID", "hidden": true },
        "Reference": { "key": "Reference", "group": "Transaktionsoplysninger" },
        "Afsender": { "key": "Afsender", "group": "Transaktionsoplysninger" }, 
        "Advis": { "key": "Advisliste", "group": "Transaktionsoplysninger" },
        "Posteringstype": { "key": "Posteringstype", "group": "Transaktionsoplysninger" },
        "Beløbsregel": { "key": "Operator", "group": "Beløbsafgrænsning" },
        "Beløb 1": { "key": "Beløb1", "group": "Beløbsafgrænsning" },
        "Beløb 2": { "key": "Beløb2", "hidden": true, "group": "Beløbsafgrænsning" },
        "Artskonto": { "key": "Artskonto", "group": "Kontering" },
        "PSP-element": { "key": "PSP", "group": "Kontering" },
        "Posteringstekst": { "key": "Posteringstekst", "group": "Kontering" },
        "Notat": { "key": "Notat" }
    }

    const keyMap_exception = {
        "id": { "key": "RuleID", "hidden": true },
        "Reference": { "key": "Reference", "group": "Transaktionsoplysninger" },
        "Afsender": { "key": "Afsender", "group": "Transaktionsoplysninger" }, 
        "Advis": { "key": "Advisliste", "group": "Transaktionsoplysninger" },
        "Posteringstype": { "key": "Posteringstype", "group": "Transaktionsoplysninger" },
        "Beløbsregel": { "key": "Operator", "group": "Beløbsafgrænsning" },
        "Beløb 1": { "key": "Beløb1", "group": "Beløbsafgrænsning" },
        "Beløb 2": { "key": "Beløb2", "hidden": true, "group": "Beløbsafgrænsning" },
        "Artskonto": { "key": "Artskonto", "hidden": true, "group": "Kontering" },
        "PSP-element": { "key": "PSP", "hidden": true, "group": "Kontering" },
        "Posteringstekst": { "key": "Posteringstekst", "hidden": true, "group": "Kontering" },
        "Notat": { "key": "Notat" }
    }

    const keyMap = computed(() => (index.value === 'nyundtagelse' ? keyMap_exception : keyMap_rule))
    
    const groupedKeyMap = computed(() => {
        const groups = {}
        for (const [key, value] of Object.entries(keyMap.value)) {
            const group = value.group || 'Diverse'
            if (!groups[group]) groups[group] = {}
            groups[group][key] = value
        }
        return groups
    })

    const groupOrder = ['Transaktionsoplysninger', 'Beløbsafgrænsning', 'Kontering', 'Diverse']

    const sortedGroups = computed(() => {
        return groupOrder
            .map(groupName => ({
                name: groupName,
                fields: groupedKeyMap.value[groupName] || {}
            }))
            .filter(group => Object.keys(group.fields).length > 0)
    })

    const operatorOptions = [
        { label: 'Større end', value: '>' },
        { label: 'Mindre end', value: '<' },
        { label: 'Mellem', value: '><' },
        { label: 'Lig med', value: '==' }
    ]

    const selectedOperator = ref(operatorOptions[0].value)

    watch(selectedOperator, (newVal) => {
        konteringsregel.value.Operator = newVal
        keyMap.value["Beløb 2"].hidden = !(newVal === '><')
    })

    function updateRule()
    {
        hasUpdated.value = false
        isUpdating.value = true

        const url = isNewRule.value ? '/api/konteringsregler' : `/api/konteringsregler/${konteringsregel.value.RuleID}`
        
        fetch(url, {
            method: isNewRule.value ? 'POST' : 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(konteringsregel.value)
        })

        .then(response => {
            if (response.ok) return response.json()
            else throw new Error('Error connecting to back-end')
        })
        .then(value => {
            if(isNewRule.value) {
                isNewRule.value = false
                index.value = value.RuleID
                konteringsregel.value.RuleID = value.RuleID
                konteringsregel.value[keyMap.id.key] = value.RuleID

                router.push(`/retkonteringsregel/${value.RuleID}`)
            }
        })
        .finally(() => {
            isUpdating.value = false
            hasUpdated.value = true
            router.go(-1)
        })
    }


    const awaitingDeleteConfirmation = ref(false)
    const isDeleting = ref(false)
    
    function deleteRule() {
        if (!awaitingDeleteConfirmation.value) awaitingDeleteConfirmation.value = true
        else {
            isDeleting.value = true

            fetch(`/api/konteringsregler/${konteringsregel.value.RuleID}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            .finally(() => router.go(-1))
        }
    }

    function toggleActivation() {
        konteringsregel.value.Active = !konteringsregel.value.Active
        activeBool.value = konteringsregel.value.Active
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
                <button id="submit" @click="updateRule" :disabled="isUpdating">{{ isUpdating ? 'Gemmer ...' : hasUpdated ? 'Rettelser gemt' : isNewRule ? 'Opret regel' : 'Gem rettelser' }}</button>
                <button @click="toggleActivation" :disabled="exceptionBool.value">{{ activeBool.value ? 'Deaktivér' : 'Aktivér' }}</button>
                <button @click="deleteRule" class="red float-right" :disabled="isDeleting">{{ awaitingDeleteConfirmation ? 'Bekræft sletning' : 'Slet regel' }}</button>

                <div class="flexbox">
                    <div>
                        <input type="checkbox" v-model="konteringsregel.Active" id="isActive" />
                        <label for="isActive" class="capitalize">Aktiv</label>
                    </div>
                    <div>
                        <input type="checkbox" v-model="konteringsregel.Exception" id="isException" />
                        <label for="isException" class="capitalize">Undtagelse</label>
                    </div>
                    <div v-for="group in sortedGroups" :key="group.name">
                        <h3>{{ group.name }}</h3>
                        <div v-for="(value, key) in group.fields" :key="key" :class="value.hidden ? 'hidden' : ''">
                            <label :for="key" class="capitalize">{{ key }}</label>

                            <template v-if="key === 'Beløbsregel'">
                                <select v-model="selectedOperator">
                                    <option v-for="option in operatorOptions" :key="option.value" :value="option.value">
                                        {{ option.label }}
                                    </option>
                                </select>
                            </template>
                            <template v-else>
                                <input
                                type="text"
                                placeholder="..."
                                :id="key"
                                v-if="konteringsregel != null && !value.hidden"
                                v-model="konteringsregel[value.key]"
                                @change="hasUpdated = false"
                                :disabled="value.disabled"
                                />
                                <input
                                type="text"
                                placeholder="Indlæser..."
                                :id="key"
                                v-if="konteringsregel == null && !value.hidden"
                                disabled
                                />
                            </template>
                        </div>
                    </div>
                </div>
            </fieldset>
        </form>
    </Content>

</template>

<style scoped>
    .hidden {
        display:none;
    }
</style>