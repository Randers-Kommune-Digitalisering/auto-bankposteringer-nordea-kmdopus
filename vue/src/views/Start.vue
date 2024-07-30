<script setup>
    import Content from '@/components/Content.vue'
    import Status from '@/components/Status.vue'

    import IconHome from '@/components/icons/IconHome.vue'
    import IconRSS from '@/components/icons/IconRSS.vue'

</script>

<template>
    <h2>Fællesoffentlig Bankintegration</h2>

    <Content>      
        Fællesoffentlig bankintegration (forkortet FOBI) er en løsning udviklet til danske kommuner, som har til formål at integrere bankposteringer i kommunernes økonomisystemer (forkortet ØS), så manuel bogføring reduceres mest muligt.
        
        Hver bankdag henter FOBI den seneste bankdags bankposteringer, matcher dem op mod kommunens konteringsregler, påfører kontering og indlæser posteringerne i kommunens ØS.
    </Content>

    <Content>
        <template #icon>
            <IconHome />
        </template>
        <template #heading>Sådan, det ser ud til at køre!</template>
        
        Du har nu succesfuldt startet et nyt projekt med <a href="https://github.com/Randers-Kommune-Digitalisering/node-red-vue-template" target="_blank" rel="noopener">Randers Kommune's Node-RED + Vue template</a>.
    </Content>

    <Content>
        <template #icon>
            <IconRSS />
        </template>
        <template #heading>Status på opsætning</template>
        
        <Status />
    </Content>

</template>