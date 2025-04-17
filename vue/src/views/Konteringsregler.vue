<script setup>
    import { ref, watch } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    
    import Content from '@/components/Content.vue'
    import IconList from '@/components/icons/IconList.vue'
    import IconEdit from '@/components/icons/IconEdit.vue'
    import IconSearch from '../components/icons/IconSearch.vue'
    import IconAdd from '../components/icons/IconAdd.vue'

    const allKonteringsregler = ref(null)
    const konteringsregler = ref(null)
    
    const router = useRouter()
    const route = useRoute()

    const type = ref(route.params.type ?? null)

    const searchParam = route.query.search
    const returnFromParam = route.query.returnfrom
    
    const isSearching = ref(searchParam ? true : false)
    const searchKeyword = ref(searchParam ?? "")

    const isReturning = ref(returnFromParam ? true : false)
    const returningFrom = ref(returnFromParam ?? null)

    console.log("returnFromParam: " + returnFromParam)
    
    // Fetch regler
    function fetchRules()
    {
        console.log("Fetching rules with type " + type.value)

        fetch('/api/listkonteringsregler/' + (type.value == null ? "" : type.value))
            .then(response => response = response.json())
            .then(value => allKonteringsregler.value = value)
            .then(value => konteringsregler.value = value)
            .then(value => handleQueryParams())
    }

    fetchRules()

    // Watch and update rules if parameter changes
    watch(() => route.params.type, (value) =>
    {
        type.value = value
        fetchRules()
    })

    const keyMap = {
        "ID": { "key": "ruleID" },
        "Reference": { "key": "reference" },
        "Afsender": { "key": "sender" }, 
        "Posteringstype": { "key": "typeDescription" },
        "Beløb 1": { "key": "amount1" },
        "Beløb 2": { "key": "amount2" },
        "Artskonto": { "key": "account", "hidden": true },
        "Posteringstekst": { "key": "text", "hidden": true },
        "Notat": { "key": "note", "hidden": true },
        "Sidst anvendt": { "key": "lastUsed"}
    }
    
    function handleQueryParams()
    {        
        if (isSearching.value) {
            search(searchKeyword.value)
        }

        if (isReturning.value) {
            // Check if the item exists in the list before scrolling
            const itemExists = konteringsregler.value?.some(
                (item) => item?.[keyMap.ID.key] === returningFrom.value
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


    function toggleSearch()
    {
        isSearching.value = !isSearching.value

        if(!isSearching.value)
            search(null)
        else
            setTimeout(() => document.getElementById("searchInput").focus(), 50)
    }

    function search(keyword)
    {
        if(allKonteringsregler.value == null)
            return

        if(keyword == null)
        {
            searchKeyword.value = ""
            konteringsregler.value = allKonteringsregler.value
        }
        
        else
        {
            konteringsregler.value = searchList(allKonteringsregler.value, keyword)

            // Use vue-router to update the URL with search keyword
            router.replace({ path: route.path, query: isReturning ? { returnfrom: route.query.returnfrom ?? returningFrom.value, search: keyword } : { search: keyword } })
        }
    }

    function searchList(list, keyword)
    {
        keyword = keyword.toLowerCase()
        keyword = keyword.trim()
        
        if(keyword == null)
            return list
        return list.filter(x => (x[keyMap.Reference.key] != null && x[keyMap.Reference.key].toLowerCase().includes(keyword)) || /* Reference */
                                (x[keyMap.Afsender.key] != null && x[keyMap.Afsender.key].toLowerCase().includes(keyword)) || /* Afsender */
                                (x[keyMap.Posteringstype.key] != null && x[keyMap.Posteringstype.key].toLowerCase().includes(keyword)) || /* Posteringstype */
                                (x[keyMap.Notat.key] != null && x[keyMap.Notat.key].toLowerCase().includes(keyword)) || /* Notat */
                                (x[keyMap.ID.key] != null && x[keyMap.ID.key] == keyword) ) /* RuleID */
    }

    function scrollTo(id)
    {
        setTimeout(function()
        {
            const item = document.getElementById(id)
            let rect = item.getBoundingClientRect()
            let calc = rect.top - (window.innerHeight - 240)

            window.scrollBy({
                left: 0, top: calc, 
                behavior: "smooth" })
        
        }, 50) // Wait ms before scrolling
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
                    <template v-if="isSearching">Luk søgning</template>
                    <template v-else><IconSearch /></template>
                </button>
            </div>

            <div class="float-left addButton">
                <router-link v-if="type != null" :to="'/retkonteringsregel/ny' + type">
                    <button @click="router.replace({  path: '/konteringsregler' })"><IconAdd /></button>
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
                            <input id="searchInput" type="text" placeholder="Søg efter regel" v-model="searchKeyword" :onchange="search(searchKeyword)" />
                        </th>
                </tr>
                <tr>
                    <th v-for="([key, value]) in Object.entries(keyMap)" :key="key" :class="(value.hidden ? 'hidden ' : '')">
                        {{ key }}
                    </th>
                    <th>Ændr</th>
                </tr>
            </thead>
            <tr v-if="konteringsregler != null" v-for="(obj, index) in konteringsregler" :id="obj[keyMap['ID'].key]" :class="returningFrom == obj[keyMap['ID'].key] ? 'highlight' : ''">
                <td v-for="(value, key) in keyMap" :class="(value.hidden ? 'hidden ' : '') + (key)">
                    {{ obj[value.key] }}
                </td>
                
                <td><router-link :to="'/retkonteringsregel/' + obj[keyMap['ID'].key]">
                    <button class="editButton orange" @click="router.replace({ 
                        path: route.path,
                        query: isSearching ? { returnfrom: obj[keyMap['ID'].key], search: searchKeyword }
                                            : { returnfrom: obj[keyMap['ID'].key] }})">
                        <IconEdit />
                    </button>
                </router-link></td>
            </tr>
            <tr v-else>
                <td :colspan="(Object.values(keyMap).filter(value => !value.hidden).length)+1">Indlæser...</td>
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
    .searchButtonDiv 
    {
        padding-left: 0.55rem;
    }
    .addButton
    {
        padding-right: 0.55rem;
    }
    .editButton
    {
        display: flex;
        align-items: center;
        justify-content: center;
        padding-left: 0.9rem;
        padding-right: 0.9rem;
    }
    .notat
    {
        font-size: 0.8em;
    }
    .highlight
    {
        background-color: #f0f0f0;
    }
    .ID
    {
        font-weight: 600;
    }
</style>