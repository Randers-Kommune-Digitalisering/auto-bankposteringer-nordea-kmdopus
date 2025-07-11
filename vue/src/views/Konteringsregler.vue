<script setup>
    import { ref, watch } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import { useSort } from '@/components/useSort.js'
    
    import Content from '@/components/Content.vue'
    import IconList from '@/components/icons/IconList.vue'
    import IconEdit from '@/components/icons/IconEdit.vue'
    import IconSearch from '../components/icons/IconSearch.vue'
    import IconSearchClose from '../components/icons/IconSearchClose.vue'
    import IconAdd from '../components/icons/IconAdd.vue'

    const allKonteringsregler = ref(null)
    const konteringsregler = ref(null)

    const { sortKey, sortAsc, sortList } = useSort()
    
    const router = useRouter()
    const route = useRoute()

    const type = ref(route.params.type ?? null)

    const searchParam = route.query.search
    const returnFromParam = route.query.returnfrom
    
    const isSearching = ref(searchParam ? true : false)
    const searchKeyword = ref(searchParam ?? "")

    const isReturning = ref(returnFromParam ? true : false)
    const returningFrom = ref(returnFromParam ?? null)
    
    function fetchRules() {
        konteringsregler.value = null

        fetch('/api/listkonteringsregler/' + (type.value == null ? "" : type.value))
            .then(response => response.json())
            .then(value => {
                allKonteringsregler.value = value
                konteringsregler.value = value
            })
            .then(() => handleQueryParams())
    }

    fetchRules()

    // Watch and update rules if parameter changes
    watch(() => route.params.type, (value) => {
        type.value = value
        fetchRules()
    })

    const keyMap = {
        "id": { "key": "ruleID" },
        "Reference": { "key": "reference" },
        "Afsender": { "key": "sender" }, 
        "Posteringstype": { "key": "typeDescription" },
        "Beløb 1": { "key": "amount1", "hidden": true },
        "Beløb 2": { "key": "amount2", "hidden": true },
        "Artskonto": { "key": "account", "hidden": true },
        "PSP-element": { "key": "accountSecondary", "hidden": true },
        "Posteringstekst": { "key": "text", "hidden": true },
        "Bankkonto": { "key": "relatedBankAccount", "hidden": true },
        "Notat": { "key": "note", "hidden": true },
        "Sidst anvendt": { "key": "lastUsed", "hidden": false },
    }

    watch(type, (newType) => {
        keyMap["Sidst anvendt"].hidden = newType === 'engangsregel'
        keyMap["Beløb 1"].hidden = newType !== 'engangsregel'
        keyMap["Beløb 2"].hidden = newType !== 'engangsregel'
    }, { immediate: true })
    
    function handleQueryParams() {        
        if (isSearching.value) {
            search(searchKeyword.value)
        }

        if (isReturning.value) {
            // Check if the item exists in the list before scrolling
            const itemExists = konteringsregler.value?.some(
                (item) => item?.[keyMap.id.key] === returningFrom.value
            ) || false

            if (itemExists) {
                scrollTo(returningFrom.value)
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' })
                returningFrom.value = null
            }

            isReturning.value = false
        }
    }


    function toggleSearch() {
        isSearching.value = !isSearching.value

        if(!isSearching.value)
            search(null)
        else
            setTimeout(() => document.getElementById("searchInput").focus(), 50)
    }

    function search(keyword) {
        if(allKonteringsregler.value == null)
            return

        if(keyword == null) {
            searchKeyword.value = ""
            konteringsregler.value = allKonteringsregler.value
        }
        
        else {
            konteringsregler.value = searchList(allKonteringsregler.value, keyword)

            // Use vue-router to update the URL with search keyword
            router.replace({ path: route.path, query: isReturning ? { returnfrom: route.query.returnfrom ?? returningFrom.value, search: keyword } : { search: keyword } })
        }
    }

    function searchList(list, keyword) {
        keyword = keyword.toLowerCase()
        keyword = keyword.trim()
        
        if(keyword == null)
            return list
        return list.filter(x => (x[keyMap.Reference.key] != null && x[keyMap.Reference.key].toLowerCase().includes(keyword)) ||
                                (x[keyMap.Afsender.key] != null && x[keyMap.Afsender.key].toLowerCase().includes(keyword)) ||
                                (x[keyMap.Posteringstype.key] != null && x[keyMap.Posteringstype.key].toLowerCase().includes(keyword)) ||
                                (x[keyMap.Notat.key] != null && x[keyMap.Notat.key].toLowerCase().includes(keyword)) ||
                                (x[keyMap["Beløb 1"].key] != null && x[keyMap["Beløb 1"].key].toLowerCase().includes(keyword)) ||
                                (x[keyMap["Beløb 2"].key] != null && x[keyMap["Beløb 2"].key].toLowerCase().includes(keyword)) ||
                                (x[keyMap.Bankkonto.key] != null && x[keyMap.Bankkonto.key].toLowerCase().includes(keyword)) ||
                                (x[keyMap.Artskonto.key] != null && x[keyMap.Artskonto.key].toLowerCase().includes(keyword)) ||
                                (x[keyMap["PSP-element"].key] != null && x[keyMap["PSP-element"].key].toLowerCase().includes(keyword)) ||
                                (x[keyMap.Posteringstekst.key] != null && x[keyMap.Posteringstekst.key].toLowerCase().includes(keyword)) ||
                                (x[keyMap.id.key] != null && x[keyMap.id.key] == keyword) )
    }

    function scrollTo(id) {
        setTimeout(function() {
            const item = document.getElementById(id)
            let rect = item.getBoundingClientRect()
            let calc = rect.top - (window.innerHeight - 240)

            window.scrollBy({
                left: 0, top: calc, 
                behavior: "smooth" })
        
        }, 50) // Wait ms before scrolling
    }

    function sortBy(key) {
        konteringsregler.value = sortList(konteringsregler.value, key)
    }

</script>

<template>

    <h2>Konteringsregler</h2>
    
    <Content>
        <template #icon>
            <IconList />
        </template>
        <template #heading>
            Konteringsrelger af typen: {{ type }}
        </template>

        <fieldset>           
            <div class="float-right searchButtonDiv">
                <button :class="isSearching ? 'gray' : ''" @click="toggleSearch()">
                    <template v-if="isSearching"><IconSearchClose /></template>
                    <template v-else><IconSearch /></template>
                </button>
            </div>

            <div class="float-left addButton">
                <router-link v-if="type != null" :to="'/retkonteringsregel/ny' + type">
                    <button><IconAdd /></button>
                </router-link>
            </div>

        </fieldset>
        
        <span class="paragraph">
            Herunder kan de aktuelle konteringsregler ses, rettes og slettes. Slettede regler kan ikke genoprettes.
        </span>
        
        <table>
            <thead>
                <tr v-if="isSearching">
                    <th :colspan="(Object.values(keyMap).filter(value => !value.hidden).length)+1">
                        <input
                            id="searchInput"
                            type="text"
                            placeholder="Søg efter regel"
                            v-model="searchKeyword"
                            :onchange="search(searchKeyword)"
                        />
                    </th>
                </tr>
                <tr>
                    <th
                      v-for="([key, value]) in Object.entries(keyMap)"
                      :key="key"
                      :class="(value.hidden ? 'hidden ' : '')"
                      @click="!value.hidden && sortBy(value.key)"
                      style="cursor: pointer;"
                    >
                      {{ key }}
                      <span v-if="sortKey === value.key">
                        {{ sortAsc ? '▲' : '▼' }}
                      </span>
                    </th>
                    <th>Ændr</th>
                </tr>
            </thead>
            <tr v-if="konteringsregler != null" v-for="(obj, index) in konteringsregler" :id="obj[keyMap.id.key]" :class="returningFrom == obj[keyMap.id.key] ? 'highlight' : ''">
                <td v-for="(value, key) in keyMap" :class="(value.hidden ? 'hidden ' : '') + (key)">
                    {{ obj[value.key] }}
                </td>
                
                <td><router-link :to="'/retkonteringsregel/' + obj[keyMap.id.key]">
                    <button class="editButton orange" @click="router.replace({ 
                        path: route.path,
                        query: isSearching ? { returnfrom: obj[keyMap.id.key], search: searchKeyword }
                                            : { returnfrom: obj[keyMap.id.key] }})">
                        <IconEdit />
                    </button>
                </router-link></td>
            </tr>
            <tr v-else>
                <td :colspan="(Object.values(keyMap).filter(value => !value.hidden).length)+1">Ingen regler</td>
            </tr>
        </table>
    </Content>

</template> 

<style scoped>
    .hidden {
        display:none;
    }
    td {
        font-size: 0.9em;
    }
    .searchButtonDiv {
        padding-left: 0.55rem;
    }
    .addButton {
        padding-right: 0.55rem;
    }
    .editButton {
        display: flex;
        align-items: center;
        justify-content: center;
        padding-left: 0.9rem;
        padding-right: 0.9rem;
    }
    .notat {
        font-size: 0.8em;
    }
    .highlight {
        background-color: #f0f0f0;
    }
    .id {
        font-weight: 600;
    }
    th {
        user-select: none;
    }
    th[style*="cursor: pointer;"]:hover {
        background: #f5f5f5;
    }
</style>