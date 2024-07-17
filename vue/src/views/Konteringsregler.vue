<script setup>
    import { ref } from 'vue'
    import Content from '@/components/Content.vue'
    import IconTable from '@/components/icons/IconTable.vue'

    const konteringsregler = ref(null)
    
    // Fetch regler
    fetch('/api/konteringsregler')
        .then(response => response = response.json())
        .then(value => konteringsregler.value = value)
        .then(value => console.log(value))

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
        },/*  
        "artskonto": {
            "id": 6,
            "key": "Artskonto"
        },
        "posteringstype": {
            "id": 3,
            "key": "value"
        },
        "posteringstekst": {
            "id": 6,
            "key": "Posteringstekst"
        },*/
        "notat": {
            "id": 6,
            "key": "Notat"
        }
    }

    /* Example data format
        {"0":{"name":"Reference","value":"Rekvireret udb"},"1":{"name":"Advisliste"},"2":{"name":"Afsender"},"3":{"name":"Posteringstype","value":"Cap"},"4":{"name":"End-to-end-reference"},"5":{"name":"Beløb","operator":null},"6":{"Posteringstekst":"Tekst fra bank","Artskonto":"12340000","Notat":"Udbetaling"},"7":{"active":true},"8":{"ruleId":54},"9":{"exception":true}}
    */
</script>

<template>

    <h2>Konteringsregler</h2>
    
    <Content>
        <template #icon>
            <IconTable />
        </template>
        <template #heading>Aktuelle konteringsregler</template>

        <span class="paragraph">
            Herunder kan de aktuelle konteringsregler ses, rettes og slettes. Vær opmærksom på at rettelser overskrives hvis der laves ændringer i <code>konteringsregler.csv</code>.
        </span>
        
        <table>
            <thead>
                <tr>
                    <th v-for="(value, key) in keyMap" :class="value.hidden ? 'hidden' : ''" class="capitalize">{{key}}</th>
                    <th></th>
                </tr>
            </thead>
            <tr v-for="(obj, index) in konteringsregler">
                <td v-for="(value, key) in keyMap" :class="value.hidden ? 'hidden' : ''">{{ obj[value.id] != undefined ? (obj[value.id][value.key] ?? "") : obj[value.key] }}</td>
                <td><router-link :to="'/retkonteringsregel/' + obj[keyMap['id'].key]">
                        <button @click="">Redigér</button>
                    </router-link></td>
            </tr>
        </table>
    </Content>

</template> 

<style scoped>
    .hidden {
        display:none;
    }
</style>