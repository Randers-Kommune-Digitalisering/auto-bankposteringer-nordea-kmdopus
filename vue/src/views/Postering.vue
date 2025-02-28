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

    // Fetch regel
    fetch(`/api/postings/${index.value}`)
        .then(response => response.json())
        .then(value => {
            posting.value = value
        })

    const keyMap = {
        "Bogføringsdato": { "key": "booking_date", "group": "Transaktionsoplysninger" },
        "Afsender": { "key": "counterparty_name", "group": "Transaktionsoplysninger" },
        "Reference": { "key": "narrative", "group": "Transaktionsoplysninger" },
        "Beløb": { "key": "amount", "group": "Transaktionsoplysninger" },
        "Artskonto": { "key": "Artskonto", "group": "Kontering" },
        "PSP-element": { "key": "PSP", "group": "Kontering" },
        "Posteringstekst": { "key": "Posteringstekst", "group": "Kontering" },
        "ID": { "key": "transaction_id", "hidden": true },
    }
    
    const groupedKeyMap = computed(() => {
        const groups = {}
        for (const [key, value] of Object.entries(keyMap.value)) {
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

    function updatePosting()
    {
        hasUpdated.value = false
        isUpdating.value = true

        const url = `/api/postings/${posting.value.ID}`
        
        fetch(url, {
            method: PUT,
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

</script>

<template>
    
    <h2>
        <span>Postering #{{posting[keyMap.id.key]}}</span>
    </h2>
    
    <Content>
        <template #icon>
            <IconTable />
        </template>
        <template #heading>{{isNewRule ? 'Opret' : 'Redigér'}} konteringsregel</template>
        
        <form @submit.prevent="">
            <fieldset>
                <div class="activeToggle">
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
                            <template>
                                <input
                                    type="text"
                                    placeholder="..."
                                    :id="key"
                                    v-if="posting != null && !value.hidden"
                                    v-model="posting[value.key]"
                                    @change="hasUpdated = false"
                                    :disabled="value.disabled"
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
    .activeToggle {
        display: flex;
        justify-content: space-between;
    }
</style>