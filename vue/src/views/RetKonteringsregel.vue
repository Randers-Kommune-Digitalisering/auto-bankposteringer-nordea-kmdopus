<script setup>
    import { ref, watch, computed } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import { validateDependencies, formatAccountSecondary, formatAccountTertiary, formatAmount, validateText, validateCPR } from '@/components/validation.js'
    import Content from '@/components/Content.vue'
    import IconTable from '@/components/icons/IconTable.vue'
    import IconDelete from '../components/icons/IconDelete.vue'
    import IconSave from '../components/icons/IconSave.vue'
    import newItem from '@/assets/newItem.json'

    const router = useRouter()
    const route = useRoute()
    const index = ref(route.params.id)

    const isUpdating = ref(false)
    const hasUpdated = ref(false)

    const awaitingDeleteConfirmation = ref(false)
    const isDeleting = ref(false)

    const isNewRule = ref(
        index.value === 'nyaktiv' || 
        index.value === 'nyinaktiv' || 
        index.value === 'nyundtagelse' || 
        index.value === 'nyengangsregel'
    )
    
    const konteringsregel = ref(isNewRule.value ? JSON.parse(JSON.stringify(newItem)) : null)

    const bankaccounts = ref([])
    const bankAccountOptions = ref([])

    const cprMode = ref("Ingen");

    const errors = ref({
        account: null,
        accountSecondary: null,
        accountTertiary: null,
        text: null,
        cpr: null
    });

    fetch('/api/bankaccounts')
        .then(response => response.json())
        .then(value => {
            bankaccounts.value = value
            bankAccountOptions.value = [
                { label: 'Alle', value: null },
                ...value.map(account => ({
                    label: `${account.bankAccountName}`,
                    value: account.bankAccount
                }))
            ]
        })

    const operatorOptions = [
        { label: 'Større end', value: '>' },
        { label: 'Mindre end', value: '<' },
        { label: 'Mellem', value: '><' },
        { label: 'Lig med', value: '==' }
    ]

    const cprModeOptions = [
        { label: 'Ingen', value: 'Ingen' },
        { label: 'Scan fra transaktion', value: 'Scan fra transaktion' },
        { label: 'Statisk', value: 'Statisk' }
    ];

    const selectedOperator = ref(isNewRule.value ? null : operatorOptions[0].value)
    const selectedBankaccount = ref(null)

    const keyMap_rule = {
        "id": { "key": "ruleID", "hidden": true },
        "Tilknyttet bankkonto": { "key": "relatedBankAccount", "group": "Transaktionsoplysninger" },
        "Reference": { "key": "reference", "group": "Transaktionsoplysninger" },
        "Afsender": { "key": "sender", "group": "Transaktionsoplysninger" }, 
        "Posteringstype": { "key": "typeDescription", "group": "Transaktionsoplysninger" },
        "Beløbsregel": { "key": "operator", "group": "Beløbsafgrænsning" },
        "Beløb 1": { "key": "amount1", "group": "Beløbsafgrænsning" },
        "Beløb 2": { "key": "amount2", "hidden": true, "group": "Beløbsafgrænsning" },
        "Artskonto": { "key": "account", "group": "Kontering" },
        "PSP-element": { "key": "accountSecondary", "group": "Kontering" },
        "Omkostningssted": { "key": "accountTertiary", "group": "Kontering" },
        "Posteringstekst": { "key": "text", "group": "Kontering" },
        "CPR-bogføring": { "key": "postWithCPR", "group": "Kontering" },
        "CPR": { "key": "cpr", "hidden": true, "group": "Kontering" },
        "Notat": { "key": "note" },
        "activeBool": { "key": "activeBool", "hidden": true }
    }

    const keyMap_exception = {
        "id": { "key": "ruleID", "hidden": true },
        "Tilknyttet bankkonto": { "key": "relatedBankAccount", "group": "Transaktionsoplysninger" },
        "Reference": { "key": "reference", "group": "Transaktionsoplysninger" },
        "Afsender": { "key": "sender", "group": "Transaktionsoplysninger" }, 
        "Posteringstype": { "key": "Posteringstype", "group": "Transaktionsoplysninger" },
        "Beløbsregel": { "key": "operator", "group": "Beløbsafgrænsning" },
        "Beløb 1": { "key": "amount1", "group": "Beløbsafgrænsning" },
        "Beløb 2": { "key": "amount2", "group": "Beløbsafgrænsning" },
        "Artskonto": { "key": "account", "hidden": true, "group": "Kontering" },
        "PSP-element": { "key": "accountSecondary", "hidden": true, "group": "Kontering" },
        "Omkostningssted": { "key": "accountTertiary", "hidden": true, "group": "Kontering" },
        "Posteringstekst": { "key": "text", "hidden": true, "group": "Kontering" },
        "Notat": { "key": "Notat" }
    }

    if (isNewRule.value) {   
        if (index.value === 'nyinaktiv') konteringsregel.value.activeBool = false
        else if (index.value === 'nyundtagelse') konteringsregel.value.exceptionBool = true
        else if (index.value === 'nyengangsregel') konteringsregel.value.tempBool = true
        validateDependencies(konteringsregel.value, errors.value);
        validateText(konteringsregel.value.text, errors.value);
    } else {
        fetch(`/api/konteringsregler/${index.value}`)
            .then(response => response.json())
            .then(value => {
                konteringsregel.value = value
                selectedBankaccount.value = konteringsregel.value.relatedBankAccount
                selectedOperator.value = konteringsregel.value.operator
                validateDependencies(konteringsregel.value, errors.value);
                validateText(konteringsregel.value.text, errors.value);

                // Force cprMode and trigger validation
                if (konteringsregel.value.postWithCPR) {
                    cprMode.value = 'Scan fra transaktion';
                } else if (konteringsregel.value.cpr) {
                    cprMode.value = 'Statisk';
                    validateCPR(konteringsregel.value.cpr, errors.value);
                } else {
                    cprMode.value = 'Ingen';
                }
            })
    }
        
    const keyMap = computed(() => {
        if (index.value === 'nyundtagelse') return keyMap_exception
        return keyMap_rule
    })

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
            .filter(group => {
                // Exclude "Kontering" group if exceptionBool is true
                if (konteringsregel.value?.exceptionBool && group.name === 'Kontering') {
                    return false;
                }
                return Object.keys(group.fields).length > 0;
            });
    });

    watch(selectedOperator, (newValue) => {
        konteringsregel.value.operator = newValue
        const map = index.value === 'nyundtagelse' ? keyMap_exception : keyMap_rule;
        map["Beløb 2"].hidden = !(newValue === '><')
    })

    watch(bankAccountOptions, (newVal) => {
        if (newVal.length > 0) {
            selectedBankaccount.value = newVal[0].value
        }
    })

    watch(selectedBankaccount, (newValue) => {
        konteringsregel.value.relatedBankAccount = newValue
    })

    watch(() => konteringsregel.value.cpr, (val) => {
        if (cprMode.value === 'Statisk') {
            if (!val || val.trim() === '') {
                errors.value.cpr = 'CPR skal angives i statisk tilstand';
            } else {
                validateCPR(val, errors.value);
            }
        } else {
            errors.value.cpr = null;
        }
    });

    watch(cprMode, (mode) => {
        const map = index.value === 'nyundtagelse' ? keyMap_exception : keyMap_rule;
        map["CPR"].hidden = !(mode === 'Statisk');
        konteringsregel.value.postWithCPR = (mode === 'Scan fra transaktion');
        // Immediately validate CPR when switching to Statisk
        if (mode === 'Statisk') {
            if (!konteringsregel.value.cpr || konteringsregel.value.cpr.trim() === '') {
                errors.value.cpr = 'CPR skal angives i statisk tilstand';
            } else {
                validateCPR(konteringsregel.value.cpr, errors.value);
            }
        } else {
            errors.value.cpr = null;
        }
    });

    const hasValidationErrors = computed(() => {
        return Object.values(errors.value).some(error => error !== null)
    })

    function updateRule() {
        validateDependencies(konteringsregel.value, errors.value);
        validateText(konteringsregel.value.text, errors.value);
        
        // Only block update if rule is active and there are validation errors
        if (konteringsregel.value.activeBool && hasValidationErrors.value) {
            alert('Der er valideringsfejl. Ret venligst fejlene før du fortsætter.');
            return;
        }

        if (cprMode.value !== 'Statisk') {
            konteringsregel.value.cpr = null;
        }

        if (konteringsregel.value.accountSecondary) {
            konteringsregel.value.accountSecondary = formatAccountSecondary(konteringsregel.value.accountSecondary);
        }

        if (konteringsregel.value.accountTertiary) {
            konteringsregel.value.accountTertiary = formatAccountTertiary(konteringsregel.value.accountTertiary);
        }

        if (konteringsregel.value.amount1) {
            konteringsregel.value.amount1 = formatAmount(konteringsregel.value.amount1);
        }

        if (konteringsregel.value.amount2) {
            konteringsregel.value.amount2 = formatAmount(konteringsregel.value.amount2);
        }
        
        isUpdating.value = true
        cprMode.value = 'Ingen'

        const url = isNewRule.value ? '/api/konteringsregler' : `/api/konteringsregler/${konteringsregel.value.ruleID}`
        
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
                index.value = value.ruleID
                konteringsregel.value.ruleID = value.ruleID
            }
        })

        .finally(() => {
            router.push(`/retkonteringsregel/${konteringsregel.value.ruleID}`)
            isUpdating.value = false
            hasUpdated.value = true
            router.go(-1)
        })
    }
    
    function deleteRule() {
        if (!awaitingDeleteConfirmation.value) awaitingDeleteConfirmation.value = true
        else {
            isDeleting.value = true

            fetch(`/api/konteringsregler/${konteringsregel.value.ruleID}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            .finally(() => {
                isDeleting.value = false
                router.go(-1)
            })
        }
    }

    function toggleActiveAndGoBack() {
        konteringsregel.value.activeBool = !konteringsregel.value.activeBool;
        updateRule();
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
                <div class="activeToggle">
                    <button @click="deleteRule" class="red float-right" :disabled="isDeleting">
                        <template v-if="awaitingDeleteConfirmation">Bekræft sletning</template>
                        <template v-else><IconDelete /></template>
                    </button>

                    <button v-if="konteringsregel != null"
                        @click="toggleActiveAndGoBack"
                        :class="isUpdating ? 'blue' : konteringsregel.activeBool ? 'red' : 'green'"
                        :disabled="konteringsregel.exceptionBool || konteringsregel.tempBool || (!konteringsregel.activeBool && hasValidationErrors)">
                        <template v-if="isUpdating">Gemmer ...</template>
                        <template v-else>{{ konteringsregel.activeBool ? 'Deaktivér' : 'Aktivér' }}</template>
                    </button>

                    <button
                        id="submit"
                        @click="updateRule"
                        class="green"
                        :disabled="isUpdating || !konteringsregel.exceptionBool && konteringsregel.activeBool && hasValidationErrors"
                    >
                        <IconSave />
                    </button>

                </div>

                <div class="flexbox">
                    <div v-for="group in sortedGroups" :key="group.name">
                        <h3>{{ group.name }}</h3>
                        <div v-for="(value, key) in group.fields" :key="key" :class="value.hidden ? 'hidden' : ''">
                            <label :for="key">{{ key }}</label>

                            <template v-if="key === 'Artskonto'">
                                <input
                                    type="text"
                                    placeholder="..."
                                    :id="key"
                                    v-model="konteringsregel[value.key]"
                                    @input="validateDependencies(konteringsregel, errors)"
                                />
                                <span v-if="errors.account" class="error">{{ errors.account }}</span>
                            </template>

                            <template v-else-if="key === 'PSP-element'">
                                <input
                                    type="text"
                                    placeholder="..."
                                    :id="key"
                                    v-model="konteringsregel[value.key]"
                                    @input="validateDependencies(konteringsregel, errors)"
                                />
                                <span v-if="errors.accountSecondary" class="error">{{ errors.accountSecondary }}</span>
                            </template>

                            <template v-else-if="key === 'Omkostningssted'">
                                <input
                                    type="text"
                                    placeholder="..."
                                    :id="key"
                                    v-model="konteringsregel[value.key]"
                                    @input="validateDependencies(konteringsregel, errors)"
                                />
                                <span v-if="errors.accountTertiary" class="error">{{ errors.accountTertiary }}</span>
                            </template>
                            
                            <template v-else-if="key === 'CPR-bogføring'">
                                <select id="cprMode" v-model="cprMode">
                                    <option v-for="option in cprModeOptions" :key="option.value" :value="option.value">
                                        {{ option.label }}
                                    </option>
                                </select>
                            </template>

                            <template v-else-if="key === 'CPR'">
                                <input
                                    type="text"
                                    placeholder="..."
                                    :id="key"
                                    v-model="konteringsregel[value.key]"
                                />
                                <span v-if="errors.cpr" class="error">{{ errors.cpr }}</span>
                            </template>

                            <template v-else-if="key === 'Posteringstekst'">
                                <input
                                    type="text"
                                    placeholder="..."
                                    :id="key"
                                    v-model="konteringsregel[value.key]"
                                    @input="validateText(konteringsregel[value.key], errors)"
                                />
                                <span v-if="errors.text" class="error">{{ errors.text }}</span>
                            </template>
                            
                            <template v-else-if="key === 'Beløbsregel'">
                                <select v-model="selectedOperator">
                                    <option v-for="option in operatorOptions" :key="option.value" :value="option.value">
                                        {{ option.label }}
                                    </option>
                                </select>
                            </template>

                            <template v-else-if="key === 'Tilknyttet bankkonto'">
                                <select v-model="selectedBankaccount">
                                    <option v-for="option in bankAccountOptions" :key="option.value" :value="option.value">
                                        {{ option.label }}
                                    </option>
                                </select>
                            </template>
                            
                            <template v-else>
                                <input
                                    type="text"
                                    placeholder="..."
                                    :id="key"
                                    v-model="konteringsregel[value.key]"
                                    @change="hasUpdated = false"
                                    :disabled="value.disabled || value.hidden"
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
        margin-bottom: 3rem;
    }
    .error {
        color: red;
        font-size: 0.9em;
        margin-top: 0.2em;
    }
</style>