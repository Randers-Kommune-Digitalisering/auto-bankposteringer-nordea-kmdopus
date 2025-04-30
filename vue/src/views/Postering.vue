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

    const errors = ref({
        artskonto: null,
        pspElement: null
    });

    // Fetch posting
    fetch(`/api/postings/${index.value}`)
        .then(response => response.json())
        .then(value => {
            posting.value = value;

            // Trigger initial validation
            validateArtskonto(posting.value?.account || '');
            validatePSPElement(posting.value?.accountSecondary || '');
            validateDependencies();
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
        "Posteringstekst": { "key": "text", "group": "Kontering" , "mutable": true },
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

    function validateArtskonto(value) {
        const regex = /^(S|9|\d)\d{7}$/; // Matches 8 characters, first can be "S", "9", or a digit
        if (!value) {
            errors.value.artskonto = 'Artskonto er påkrævet.';
        } else if (!regex.test(value)) {
            errors.value.artskonto = 'Artskonto skal være præcis 8 tegn langt og starte med "S", "9" eller et tal.';
        } else {
            errors.value.artskonto = null;
        }
    }

    function validatePSPElement(value) {
        const regex = /^X[A-Z]-\d{10}-\d{5}$/i; // Matches X[A-Z]-**********-***** (case-insensitive)
        if (!regex.test(value)) {
            errors.value.pspElement = 'PSP-element skal matche formatet X[A-Z]-**********-*****.';
        } else {
            errors.value.pspElement = null;
        }
    }

    function validateDependencies() {
        const artskonto = posting.value?.account || '';
        const pspElement = posting.value?.accountSecondary || '';

        if (artskonto[0] !== '9' && artskonto[0] !== 'S' && !pspElement) {
            errors.value.pspElement = 'PSP-element er påkrævet, når Artskonto ikke starter med "9" eller "S".';
        } else if (artskonto[0] === '9' || artskonto[0] === 'S') {
            errors.value.pspElement = null; // Clear PSP-element error if not required
        }
    }

    // Computed property to check if there are any validation errors
    const hasValidationErrors = computed(() => {
        return Object.values(errors.value).some(error => error !== null)
    })

    function updatePosting() {
        if (hasValidationErrors.value) {
            alert('Der er valideringsfejl. Ret venligst fejlene før du fortsætter.')
            return
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
                                    @input="validateArtskonto(posting[value.key]); validateDependencies()"
                                    @change="hasUpdated = false"
                                    :disabled="value.mutable === false"
                                />
                                <span v-if="errors.artskonto" class="error">{{ errors.artskonto }}</span>
                            </template>
                            <template v-else-if="key === 'PSP-element'">
                                <input
                                    type="text"
                                    placeholder="..."
                                    :id="key"
                                    v-if="posting != null && !value.hidden"
                                    v-model="posting[value.key]"
                                    @input="validatePSPElement(posting[value.key]); validateDependencies()"
                                    @change="hasUpdated = false"
                                    :disabled="value.mutable === false"
                                />
                                <span v-if="errors.pspElement" class="error">{{ errors.pspElement }}</span>
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