<script setup>
    import Content from '@/components/Content.vue'
    import Status from '@/components/Status.vue'

    import IconNB from '@/components/icons/IconNB.vue'
    import IconRSS from '@/components/icons/IconRSS.vue'
    import IconCompass from '@/components/icons/IconCompass.vue'

</script>

<template>
    <h2>Fællesoffentlig Bankintegration - FOBI</h2>

    <Content>      
        Fællesoffentlig bankintegration (forkortet FOBI) er en løsning udviklet til danske kommuner, med det formål at integrere kommunenes økonomisystem med kommunens bankkonti (forkortet ØS), så manuel bogføring minimeres.
        <br>
        <br>
        FOBI matcher alle bankbevægelser med kommunens egne konteringsregler og indlæser posterne i kommunens ØS.
    </Content>

    <Content>
        <template #icon>
            <IconNB />
        </template>
        <template #heading>Inden du går i gang</template>
        For at anvende løsningen, skal du som kommune først indgå aftaler med hhv. din bank og udbyderen af dit økonomisystem om udveksling af data.
        <br>
        <br>
        Aftalen med din bank laves igennem en såkaldt <b>Open Banking-leverandør</b>.
        <br>
        Nordea og Danske Bank leverer selv deres data, mens de resterende banker i Danmark leverer data igennem virksomhederne Bankdata, BEC eller SDC.
        <br>
        Når aftalen er lavet, får du nogle koder som skal indlæses i denne løsning.
        <br>
        <br>
        En lignende aftale indgås med din <b>ØS-leverandør</b>.
        <br>
        I denne aftale er det i stedet dig der leverer data, som skal indlæses i ØS.
        <br>
        Leveringen af data foregår igennem en FTP-forbindelse. Spørg din leverandør om mulighed for tilslutning.
        <br>
        Ønsker man ikke denne tilslutning, vil FOBI i stedet oprette finansbilag til manuel indlæsning i ØS.
    </Content>

    <Content>
        <template #icon>
            <IconCompass />
        </template>
        <template #heading>Sådan bruger du FOBI</template>
        I navigationen til venstre finder du 5 faner foruden denne startside.
        <br>
        <br>
        I fanen <b>Stamdata</b> angives oplysninger om kommunens FOBI-administrator og de bankkonti, som kommunen ønske at anvende FOBI til.
        <br>
        Administratoren skal periodevis godkende at FOBI's adgang til jeres bankdata, hvilket er grunden til at disse oplysninger skal udfyldes.
        <br>
        <br>
        Konteringsregler er opdelt i 3 faner efter deres type; hhv. aktive og inaktive regler, samt undtagelser.
        <br>
        <b>Aktive regler</b> bør have brugerens fokus. Inaktivering giver brugerne mulighed for midlertidigt at inaktive regler, som ikke fungerer korrekt.
        <br>
        <b>Inaktive regler</b> benytter FOBI ikke til konteringsmatch, men brugeren har fortsat mulighed for at tilpasse reglen og evt. genaktivere den på et senere tidspunkt.
        <br>
        <b>Undtagelser</b> bruges til at tage højde for andre integrationer mellem jeres bank og ØS. Det er f.eks. ofte leverandørudbetalinger, der skal laves undtagelse for.
        <br>
        <br>
        <i>NB: Oprettelse af nye regler/undtagelser sker på de respektive faner.</i>
        <br>
        <br>
        I fanen <b>Filer</b>, vil der være logfiler som kan anvendes af den FOBI-ansvarlige til fejlsøgning.
        <br>
        Er der ikke oprettet en FTP-forbindelse, vil de finansbilag som FOBI danner være tilgængelige her med datomærkning fra bankdagen i filnavnet.
    </Content>

    <Content>
        <template #icon>
            <IconRSS />
        </template>
        <template #heading>Driftsstatus</template>
        
        <Status />
    </Content>

</template>