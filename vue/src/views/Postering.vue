<script setup>
    import { ref, computed } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import Content from '@/components/Content.vue'
    import IconTable from '@/components/icons/IconTable.vue'

    const isUpdating = ref(false)
    const hasUpdated = ref(false)

    const router = useRouter()
    const route = useRoute()

    const index = ref(route.params.id)
    
    const posting = ref(null)

    // Fetch posting
    fetch(`/api/postings/${index.value}`)
        .then(response => response.json())
        .then(value => {
            posting.value = value
        })

    const keyMap = {
        "Bogføringsdato": { "key": "bookingDate", "group": "Transaktionsoplysninger" , "mutable": false },
        "Konto": { "key": "bankAccount", "group": "Transaktionsoplysninger" , "mutable": false },
        "Beløb": { "key": "amount", "group": "Transaktionsoplysninger" , "mutable": false },
        "Posteringstype": { "key": "typeDescription", "group": "Transaktionsoplysninger" , "mutable": false },
        "Afsender": { "key": "counterpartyName", "group": "Transaktionsoplysninger" , "mutable": false },
        "Reference": { "key": "narrative", "group": "Transaktionsoplysninger" , "mutable": false },
        "Artskonto": { "key": "Artskonto", "group": "Kontering" , "mutable": true },
        "PSP-element": { "key": "PSP", "group": "Kontering" , "mutable": true },
        "Posteringstekst": { "key": "Posteringstekst", "group": "Kontering" , "mutable": true },
        "CPR": { "key": "cpr", "group": "Kontering" , "mutable": true },
        "ID": { "key": "transactionID", "hidden": true , "mutable": false },
    }
    
    const groupedKeyMap = computed(() => {
        const groups = {}
        for (const [key, value] of Object.entries(keyMap)) {
            const group = value.group || 'Diverse'
            if (!groups[group]) groups[group] = {}
            groups[group][key] = value
        }
        return groups
    })

    const groupOrder = ['Transaktionsoplysninger', 'Kontering']

    const sortedGroups = computed(() => {
        return groupOrder
            .map(groupName => ({
                name: groupName,
                fields: groupedKeyMap.value[groupName] || {}
            }))
            .filter(group => Object.keys(group.fields).length > 0)
    })

    function updatePosting() {
        hasUpdated.value = false
        isUpdating.value = true

        const url = `/api/postings/${posting.value.transactionID}`
        
        fetch(url, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(posting.value)
        })

        .then(response => {
            if (response.ok) return response.json()
            else throw new Error('Error connecting to back-end')
        })
        .finally(() => {
            isUpdating.value = false
            hasUpdated.value = true
            router.go(-1)
        })
    }

    console.log(sortedGroups)

</script>

<template>
    <h2 v-if="posting != null">
        <span>Postering #{{ posting.transactionID }}</span>
    </h2>
    <h2 v-else>Indlæser...</h2>

    <Content>
        <template #icon>
            <IconTable />
        </template>
        <template #heading>Redigér postering</template>
        
        <form @submit.prevent="">
            <fieldset>
                <div class="bookPosting">
                    <button id="submit" @click="updatePosting" class="green" :disabled="isUpdating">
                        <template v-if="isUpdating">Danner bilag ...</template>
                        <template v-else-if="hasUpdated">Bilag dannet</template>
                        <template v-else>Bogfør</template>
                    </button>
                </div>

                <div class="flexbox">
                    <div v-for="group in sortedGroups" :key="group.name">
                        <h3>{{ group.name }}</h3>
                        <div v-for="(value, key) in group.fields" :key="key" :class="value.hidden ? 'hidden' : ''">
                            <label :for="key" class="capitalize">{{ key }}</label>
                            <template v-if="key === 'Afsender' || key === 'Reference'">
                                <textarea
                                    placeholder="..."
                                    :id="key"
                                    v-if="posting != null && !value.hidden"
                                    v-model="posting[value.key]"
                                    @change="hasUpdated = false"
                                    :disabled="value.mutable === false"
                                ></textarea>
                            </template>
                            <template v-else>
                                <input
                                    type="text"
                                    placeholder="..."
                                    :id="key"
                                    v-if="posting != null && !value.hidden"
                                    v-model="posting[value.key]"
                                    @change="hasUpdated = false"
                                    :disabled="value.mutable === false"
                                />
                                <input
                                    type="text"
                                    placeholder="Indlæser..."
                                    :id="key"
                                    v-if="posting == null && !value.hidden"
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
    .bookPosting {
        display: flex;
        justify-content: center;
    }
</style>