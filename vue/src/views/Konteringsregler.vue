
<script setup>
    import { ref, watch } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    
    import Content from '@/components/Content.vue'
    import IconTable from '@/components/icons/IconTable.vue'

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
            "key": "Posteringstype",
            "hidden": true
        },
        "Posteringstekst": {
            "key": "Posteringstekst",
            "hidden": true
        },
        "Notat": {
            "key": "Notat"
        }
    }

    /* Example data format
        {"0":{"name":"Reference","value":"Rekvireret udb"},"1":{"name":"Advisliste"},"2":{"name":"Afsender"},"3":{"name":"Posteringstype","value":"Cap"},"4":{"name":"End-to-end-reference"},"5":{"name":"Beløb","operator":null},"6":{"Posteringstekst":"Tekst fra bank","Artskonto":"12340000","Notat":"Udbetaling"},"7":{"active":true},"8":{"ruleId":54},"9":{"exception":true}}
    */
    
    function handleQueryParams()
    {        
        if(isSearching.value)
        {
            search(searchKeyword.value)
        }

        if(isReturning.value)
        {
            scrollTo(returningFrom.value)
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
                                (x[keyMap.Advis.key] != null && x[keyMap.Advis.key].toLowerCase().includes(keyword)) || /* Advis */
                                (x[keyMap.Notat.key] != null && x[keyMap.Notat.key].toLowerCase().includes(keyword)) || /* Notat */
                                (x[keyMap.id.key] != null && x[keyMap.id.key] == keyword) ) /* RuleID */
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
            <IconTable />
        </template>
        <template #heading>
            Aktuelle konteringsregler test: {{returningFrom}}
            
            <div class="float-right searchButtonDiv">
                <button :class="isSearching ? 'gray' : ''" @click="toggleSearch()">
                    {{ isSearching ? 'Luk søgning' : 'Søg i regler'}}</button>
            </div>

            <div class="float-right searchButtonDiv">
                <router-link v-if="type != null" :to="'/retkonteringsregel/ny' + type">
                    <button @click="router.replace({  path: '/konteringsregler' })">{{ type == 'undtagelse' ? 'Tilføj undtagelse' : 'Tilføj regel'}}</button>
                </router-link>
            </div>

        </template>
        
        <span class="paragraph">
            Herunder kan de aktuelle konteringsregler ses, rettes og slettes. Vær opmærksom på at rettelser overskrives hvis der laves ændringer i <code>konteringsregler.json</code>.
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
                    <th></th>
                </tr>
            </thead>
            <tr v-if="konteringsregler != null" v-for="(obj, index) in konteringsregler" :id="obj[keyMap['id'].key]" :class="returningFrom == obj[keyMap['id'].key] ? 'highlight' : ''">
                <td v-for="(value, key) in keyMap" :class="(value.hidden ? 'hidden ' : '') + (key)">
                    {{ obj[value.key] }}
                </td>
                
                <td><router-link :to="'/retkonteringsregel/' + obj[keyMap['id'].key]">
                        <button class="editButton orange" @click="router.replace({  path: route.path,
                                                                                    query: isSearching ? { returnfrom: obj[keyMap['id'].key], search: searchKeyword }
                                                                                                       : { returnfrom: obj[keyMap['id'].key] }})">Redigér</button>
                </router-link></td>
                    
            </tr>
            <tr v-else>
                <td :colspan="(Object.values(keyMap).filter(value => !value.hidden).length)+1">Indlæser ....</td>
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
        padding-right: 0.55rem;
        transform: translateY(-0.8rem);
    }
    .editButton, 
    .addButton
    {
        font-size: 0.6em;
        font-weight: 500;
    }
    .addButton
    {
        padding-left: 0.55rem;
        padding-right: 0.55rem;
    }
    .editButton
    {
        
        padding-left: 0.5rem;
        padding-right: 0.5rem;
    }
    .notat
    {
        font-size: 0.8em;
    }
    .highlight
    {
        background-color: #f0f0f0;
    }
</style>