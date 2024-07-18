<script setup>
    import { ref } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    
    import Content from '@/components/Content.vue'
    import IconTable from '@/components/icons/IconTable.vue'

    const allKonteringsregler = ref(null)
    const konteringsregler = ref(null)
    
    const router = useRouter()
    const route = useRoute()

    const searchParam = route.query.search
    console.log("Current search: " + searchParam)
    
    const isSearching = ref(searchParam ? true : false)
    const searchKeyword = ref(searchParam ?? "")
    
    // Fetch regler
    fetch('/api/konteringsregler')
        .then(response => response = response.json())
        .then(value => allKonteringsregler.value = value)
        .then(value => konteringsregler.value = value)
        //.then(value => console.log(value))

    const keyMap = {
        "id": {
            "key": "id",
            "hidden": true
        },
        "ruleId": {
            "id": 8,
            "key": "ruleId",
            "hidden": true
        },
        "reference": {
            "id": 0,
            "key": "value"
        },
        "afsender": {
            "id": 2,
            "key": "value"
        }, 
        "artskonto": {
            "id": 6,
            "key": "Artskonto",
            "hidden": true
        },
        "posteringstype": {
            "id": 3,
            "key": "value",
            "hidden": true
        },
        "posteringstekst": {
            "id": 6,
            "key": "Posteringstekst",
            "hidden": true
        },
        "notat": {
            "id": 6,
            "key": "Notat"
        }
    }

    /* Example data format
        {"0":{"name":"Reference","value":"Rekvireret udb"},"1":{"name":"Advisliste"},"2":{"name":"Afsender"},"3":{"name":"Posteringstype","value":"Cap"},"4":{"name":"End-to-end-reference"},"5":{"name":"Beløb","operator":null},"6":{"Posteringstekst":"Tekst fra bank","Artskonto":"12340000","Notat":"Udbetaling"},"7":{"active":true},"8":{"ruleId":54},"9":{"exception":true}}
    */

    function toggleSearch()
    {
        isSearching.value = !isSearching.value

        if(!isSearching.value)
            search(null)
    }
    function search(keyword)
    {
        console.log("Searching for " + keyword)

        if(keyword == null)
        {
            searchKeyword.value = ""
            konteringsregler.value = allKonteringsregler.value
        }
        
        else
        {
            konteringsregler.value = searchList(allKonteringsregler.value, keyword)

            // Use vue-router to update the URL with search keyword
            router.replace({ path: '/konteringsregler', query: { search: keyword } })
        }
    }

    function searchList(list, keyword)
    {
        keyword = keyword.toLowerCase()
        keyword = keyword.trim()

        console.log("Searching in list")
        console.log(list)
        
        if(keyword == null)
            return list
        else 
            return list.filter(x => (x[keyMap.reference.id][keyMap.reference.key] != null && x[keyMap.reference.id][keyMap.reference.key].toLowerCase().includes(keyword)) || /* Reference */
                                    (x[keyMap.afsender.id][keyMap.afsender.key] != null && x[keyMap.afsender.id][keyMap.afsender.key].toLowerCase().includes(keyword)) || /* Afsender */
                                    (x[keyMap.artskonto.id][keyMap.artskonto.key] != null && x[keyMap.artskonto.id][keyMap.artskonto.key].toLowerCase().includes(keyword)) || /* Artskonto */
                                    (x[keyMap.posteringstype.id][keyMap.posteringstype.key] != null && x[keyMap.posteringstype.id][keyMap.posteringstype.key].toLowerCase().includes(keyword)) || /* Posteringstype */
                                    (x[keyMap.posteringstekst.id][keyMap.posteringstekst.key] != null && x[keyMap.posteringstekst.id][keyMap.posteringstekst.key].toLowerCase().includes(keyword)) || /* posteringstekst */
                                    (x[keyMap.notat.id][keyMap.notat.key] != null && x[keyMap.notat.id][keyMap.notat.key].toLowerCase().includes(keyword)) || /* Notat */
                                    (x[keyMap.ruleId.id][keyMap.ruleId.key].value != null && x[keyMap.ruleId.id][keyMap.ruleId.key].toLowerCase().includes(keyword)) || x.id == keyword )/* RuleID / ID */
    }

</script>

<template>

    <h2>Konteringsregler</h2>
    
    <Content>
        <template #icon>
            <IconTable />
        </template>
        <template #heading>
            Aktuelle konteringsregler
            
            <div class="float-right searchButtonDiv">
                <button :class="isSearching ? 'gray' : ''" @click="toggleSearch()">
                    {{ isSearching ? 'Luk søgning' : 'Søg i regler'}}</button>
            </div>
        </template>
        
        <span class="paragraph">
            Herunder kan de aktuelle konteringsregler ses, rettes og slettes. Vær opmærksom på at rettelser overskrives hvis der laves ændringer i <code>konteringsregler.json</code>.
        </span>
        
        <table>
            <thead>
                <tr v-if="isSearching">
                        <th :colspan="(Object.values(keyMap).filter(value => !value.hidden).length)+1">
                            <input type="text" placeholder="Søg efter regel" v-model="searchKeyword" :onchange="search(searchKeyword)" />
                        </th>
                </tr>
                <tr>
                    <th v-for="(value, key) in keyMap" :class="value.hidden ? 'hidden' : ''" class="capitalize">{{key}}</th>
                    <th></th>
                </tr>
            </thead>
            <tr v-if="konteringsregler != null" v-for="(obj, index) in konteringsregler">
                <td v-for="(value, key) in keyMap" :class="(value.hidden ? 'hidden ' : '') + (key)">{{ obj[value.id] != undefined ? (obj[value.id][value.key] ?? "") : obj[value.key] }}</td>
                <td><router-link :to="'/retkonteringsregel/' + obj[keyMap['id'].key]">
                        <button class="editButton orange" @click="">Redigér</button>
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
        transform: translateY(-0.8rem);
    }
    .editButton
    {
        font-size: 0.6em;
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        font-weight: 500;
    }
    .notat
    {
        font-size: 0.8em;
    }
</style>