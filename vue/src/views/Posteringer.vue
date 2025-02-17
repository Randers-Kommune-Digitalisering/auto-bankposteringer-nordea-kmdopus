
<script setup>
    import { ref, watch } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    
    import Content from '@/components/Content.vue'
    import IconList from '@/components/icons/IconList.vue'
    import IconEdit from '@/components/icons/IconEdit.vue'
    import IconSearch from '../components/icons/IconSearch.vue'

    const allPostings = ref(null)
    const postings = ref(null)
    
    const router = useRouter()
    const route = useRoute()

    const searchParam = route.query.search
    const returnFromParam = route.query.returnfrom
    
    const isSearching = ref(searchParam ? true : false)
    const searchKeyword = ref(searchParam ?? "")

    const isReturning = ref(returnFromParam ? true : false)
    const returningFrom = ref(returnFromParam ?? null)
    
    // Fetch regler
    function fetchPostings()
    {
        fetch('/api/postings/')
            .then(response => response = response.json())
            .then(value => allPostings.value = value)
            .then(value => postings.value = value)
            .then(value => handleQueryParams())
    }

    fetchPostings()

    // Watch and update rules if parameter changes
    watch(() => route.params.type, (value) =>
    {
        type.value = value
        fetchPostings()
    })


    const keyMap = {
        "Bogføringsdato": { "key": "booking_date" },
        "Afsender": { "key": "counterparty_name" }, 
        "Reference": { "key": "narrative" },
        "Beløb": { "key": "amount" },
        "ID": { "key": "transaction_id", "hidden": true }
    }
    
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
        if(allPostings.value == null)
            return

        if(keyword == null)
        {
            searchKeyword.value = ""
            postings.value = allPostings.value
        }
        
        else
        {
            postings.value = searchList(allPostings.value, keyword)

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
        return list.filter(x => (x[keyMap.Reference.key] != null && x[keyMap.Reference.key].toLowerCase().includes(keyword)) ||
                                (x[keyMap.Afsender.key] != null && x[keyMap.Afsender.key].toLowerCase().includes(keyword)) ||
                                (x[keyMap.Beløb.key] != null && x[keyMap.Beløb.key].toLowerCase().includes(keyword)) ||
                                (x[keyMap.Bogføringsdato.key] != null && x[keyMap.Bogføringsdato.key] == keyword) )
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

    <h2>Posteringer</h2>
    
    <Content>
        <template #icon>
            <IconList />
        </template>
        <template #heading>
            Posteringer til manuel behandling
        </template>

        <fieldset>           
            <div class="float-right searchButtonDiv">
                <button :class="isSearching ? 'gray' : ''" @click="toggleSearch()">
                    <template v-if="isSearching">Luk søgning</template>
                    <template v-else><IconSearch /></template>
                </button>
            </div>
        </fieldset>
        
        <span class="paragraph">
            Herunder håndteres de posteringer som ikke er matchet med en regel og som derfor manuelt skal bogføres. 
        </span>
        
        <table>
            <thead>
                <tr v-if="isSearching">
                        <th :colspan="(Object.values(keyMap).filter(value => !value.hidden).length)+1">
                            <input id="searchInput" type="text" placeholder="Søg efter postering" v-model="searchKeyword" :onchange="search(searchKeyword)" />
                        </th>
                </tr>
                <tr>
                    <th v-for="([key, value]) in Object.entries(keyMap)" :key="key" :class="(value.hidden ? 'hidden ' : '')">
                        {{ key }}
                    </th>
                    <th>Ændr</th>
                </tr>
            </thead>
            <tr v-if="postings != null" v-for="(obj, index) in postings" :id="obj[keyMap['ID'].key]" :class="returningFrom == obj[keyMap['ID'].key] ? 'highlight' : ''">
                <td v-for="(value, key) in keyMap" :class="(value.hidden ? 'hidden ' : '') + (key)">
                    {{ obj[value.key] }}
                </td>
                
                <td><router-link :to="'/posting/' + obj[keyMap['ID'].key]">
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