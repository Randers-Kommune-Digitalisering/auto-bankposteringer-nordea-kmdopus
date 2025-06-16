<script setup>
    import { ref, computed } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import { validateDependencies, formatAccountSecondary, formatAccountTertiary, validateCPR, validateText } from '@/components/validation.js'
    import fileUpload from '@/components/fileUpload.vue'

    import Content from '@/components/Content.vue'
    import IconTable from '@/components/icons/IconTable.vue'
    import IconDelete from '@/components/icons/IconDelete.vue'
    import IconUpload from '@/components/icons/IconUpload.vue'

    const isUpdating = ref(false)
    const hasUpdated = ref(false)

    const router = useRouter()
    const route = useRoute()

    const index = ref(route.params.id)
    
    const posting = ref(null)

    const errors = ref({
        account: null,
        accountSecondary: null,
        accountTertiary: null,
        cpr: null,
        text: null
    });

    // Fetch posting
    fetch(`/api/postings/${index.value}`)
        .then(response => response.json())
        .then(value => {
            posting.value = value;
            validateText(posting.value.text, errors.value);
            validateDependencies(posting.value, errors.value);
        });

    const keyMap = {
        "Bogføringsdato": { "key": "bookingDate", "group": "Transaktionsoplysninger" , "mutable": false },
        "Konto": { "key": "bankAccount", "group": "Transaktionsoplysninger" , "mutable": false },
        "Beløb": { "key": "amount", "group": "Transaktionsoplysninger" , "mutable": false },
        "Posteringstype": { "key": "typeDescription", "group": "Transaktionsoplysninger" , "mutable": false },
        "Afsender": { "key": "sender", "group": "Transaktionsoplysninger" , "mutable": false },
        "Reference": { "key": "reference", "group": "Transaktionsoplysninger" , "mutable": false },
        "Artskonto": { "key": "account", "group": "Kontering" , "mutable": true },
        "PSP-element": { "key": "accountSecondary", "group": "Kontering" , "mutable": true },
        "Omkostningssted": { "key": "accountTertiary", "group": "Kontering", "mutable": true },
        "Posteringstekst": { "key": "text", "group": "Kontering", "mutable": true },
        "CPR": { "key": "cpr", "group": "Kontering", "mutable": true },
        "attachmentName": { "key": "attachmentName", "hidden": true, "mutable": false },
        "attachmentType": { "key": "attachmentType", "hidden": true, "mutable": false },
        "Vedhæftning": { "key": "attachmentData", "group": "Kontering", "mutable": false },
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

    // Computed property to check if there are any validation errors
    const hasValidationErrors = computed(() => {
        return Object.values(errors.value).some(error => error !== null)
    })

    function updatePosting() {
        validateDependencies(posting.value, errors.value);
        validateCPR(posting.value.cpr, errors.value);
        validateText(posting.value.text, errors.value);
        
        if (hasValidationErrors.value) {
            alert('Der er fejl i din indtastning. Ret venligst fejlene før du fortsætter.')
            return
        }

        if (posting.value.accountSecondary) {
            posting.value.accountSecondary = formatAccountSecondary(posting.value.accountSecondary);
        }

        if (posting.value.accountTertiary) {
            posting.value.accountTertiary = formatAccountTertiary(posting.value.accountTertiary);
        }
        
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
                    <button id="submit" @click="updatePosting" class="green" :disabled="isUpdating || hasValidationErrors">
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
                            <template v-if="key === 'Artskonto'">
                                <input
                                    type="text"
                                    placeholder="..."
                                    :id="key"
                                    v-if="posting != null && !value.hidden"
                                    v-model="posting[value.key]"
                                    @input="validateDependencies(posting, errors)"
                                    @change="hasUpdated = false"
                                    :disabled="value.mutable === false"
                                />
                                <span v-if="errors.account" class="error">{{ errors.account }}</span>
                            </template>

                            <template v-else-if="key === 'PSP-element'">
                                <input
                                    type="text"
                                    placeholder="..."
                                    :id="key"
                                    v-if="posting != null && !value.hidden"
                                    v-model="posting[value.key]"
                                    @input="validateDependencies(posting, errors)"
                                    @change="hasUpdated = false"
                                    :disabled="value.mutable === false"
                                />
                                <span v-if="errors.accountSecondary" class="error">{{ errors.accountSecondary }}</span>
                            </template>

                            <template v-else-if="key === 'Omkostningssted'">
                                <input
                                    type="text"
                                    placeholder="..."
                                    :id="key"
                                    v-if="posting != null && !value.hidden"
                                    v-model="posting[value.key]"
                                    @input="validateDependencies(posting, errors)"
                                    @change="hasUpdated = false"
                                    :disabled="value.mutable === false"
                                />
                                <span v-if="errors.accountTertiary" class="error">{{ errors.accountTertiary }}</span>
                            </template>

                            <template v-else-if="key === 'CPR'">
                                <input
                                    type="text"
                                    placeholder="..."
                                    :id="key"
                                    v-if="posting != null && !value.hidden"
                                    v-model="posting[value.key]"
                                    @input="validateCPR(posting[value.key], errors)"
                                    @change="hasUpdated = false"
                                    :disabled="value.mutable === false"
                                />
                                <span v-if="errors.cpr" class="error">{{ errors.cpr }}</span>
                            </template>
                            
                            <template v-else-if="key === 'Posteringstekst'">
                                <input
                                    type="text"
                                    placeholder="..."
                                    :id="key"
                                    v-if="posting != null && !value.hidden"
                                    v-model="posting[value.key]"
                                    @input="validateText(posting[value.key], errors)"
                                    @change="hasUpdated = false"
                                    :disabled="value.mutable === false"
                                />
                                <span v-if="errors.text" class="error">{{ errors.text }}</span>
                            </template>

                            <template v-else-if="key === 'Afsender' || key === 'Reference'">
                                <textarea
                                    placeholder="..."
                                    :id="key"
                                    v-if="posting != null && !value.hidden"
                                    v-model="posting[value.key]"
                                    @change="hasUpdated = false"
                                    :disabled="value.mutable === false"
                                ></textarea>
                            </template>
                            
                            <template v-else-if="key === 'Vedhæftning'">
                                <fileUpload
                                    v-model="posting.attachmentData"
                                    :fileName="posting.attachmentName"
                                    :disabled="isUpdating"
                                    @update:fileName="val => posting.attachmentName = val"
                                    @update:fileType="val => posting.attachmentType = val"
                                />
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
        margin-bottom: 3rem;
    }
    .error {
        color: red;
        font-size: 0.9em;
        margin-top: 0.2em;
    }
</style>
