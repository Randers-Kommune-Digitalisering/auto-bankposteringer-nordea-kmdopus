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
        Fællesoffentlig bankintegration (FOBI) integrerer dit (ØS) og dine bankkonti for fuldautomatisk bogføring af hovedkonto 8.22.05 og semi-automatisk bogføring af bankposteringer i kommunernes kontoplan.
        <br>
        <br>
        Ved hjælp af konteringsregler matcher og bogfører FOBI bankposteringer med den ønskede kontering i kommunernes ØS.
    </Content>

    <Content>
        <template #icon>
            <IconNB />
        </template>
        <template #heading>Hvordan kommer du i gang?</template>
        For at anvende løsningen, skal du som kommune først indgå aftaler med hhv. din bank og udbyderen af dit ØS om udveksling af data.
        <br>
        <br>
        Aftalen med din bank laves igennem en såkaldt <b>Open Banking-leverandør</b>.
        <br>
        Nordea, Danske Bank og Lunar leverer selv deres data, mens de resterende banker i Danmark leverer data igennem virksomhederne Bankdata, BEC eller SDC. Det fremgår af virksomhedernes hjemmeside, hvilke banker de leverer data for.
        <br>
        Essensen af denne aftale er at du søger adgang til dine egne bankdata, og der er på nuværende tidspunkt stor forskel på hvordan leverandørerne håndterer denne ukonventionelle "manøvre".
        Spørg din Open Banking-leverandør om mulighederne for adgang til egne transaktionsoplysninger.
        <br>
        Når aftalen er lavet, får du nogle koder som skal indlejres i løsningen. Det kan din IT-afdeling hjælper med.
        <br>
        <br>
        En lignende aftale indgås med din <b>ØS-leverandør</b>.
        <br>
        I denne aftale oplyser du levarandøren at du vil levere data til indlæsning i ØS.
        <br>
        Leveringen af data foregår som regel igennem en SFTP-forbindelse. Spørg din leverandør om mulighederne for tilslutning.
        <br>
        Ønsker man <i>ikke</i> denne tilslutning, vil FOBI i stedet oprette posteringsbilag til manuel indlæsning i ØS.
        <br>
        <br>
        Hvis du på forhånd har en lang række konteringsregler, som du gerne vil indlæse i denne løsning, er der oprettet en ØS-specifik skabelon, som ligger sammen med løsningens resterende filer.
        Vejledning til indlæsning af konteringsregler vha. skabelonen findes i Node-RED og bør udføres af en IT-ansvarlig.
    </Content>

    <Content>
        <template #icon>
            <IconCompass />
        </template>
        <template #heading>Sådan bruger du FOBI</template>
        I navigationen til venstre finder du 5 faner foruden denne startside.
        <br>
        <br>
        I fanen <b>Stamdata</b> angives bl.a. oplysninger om kommunens FOBI-administrator og de bankkonti, som kommunen ønske at anvende FOBI til.
        Bankkonti oplyses pt. i formatet "IBAN minus kontrolnøgle", "bindestreg" og "valutakode", f.eks. DK20001234567890-DKK.
        <br>
        Administratoren skal kunne godkende FOBI's adgang til at hente jeres bankdata, hvilket er grunden til at disse oplysninger skal udfyldes.
        <br>
        <br>
        Konteringsregler er opdelt i 3 faner efter deres type; hhv. aktive og inaktive regler, samt undtagelser.
        <br>
        Alle regler er opdelt i transaktionsoplysninger og konteringsoplysninger. Transaktionsoplysningerne er de data der tilsammen udgøre bankposteringen.
        Da der er stor forskel bankerne imellem, hvilke transaktionsoplysninger der leveres til kunden, er der lavet 3 grupper af data, som findes i alle bankposteringer i den ene eller anden form: reference, afsender samt posteringstype.  
        Tekstfelterne til de 3 datagrupper udfyldes med en eller flere tekststrenge (seperaret med komma), som bruges til at matche ud fra.
        <br>
        <b>Aktive regler</b> er kernen af FOBI; det er disse konteringsregler der udløser en automatisk bogføring.
        <br>
        <b>Inaktive regler</b> benytter FOBI ikke til konteringsmatch, men brugeren har fortsat mulighed for at tilpasse reglen og evt. genaktivere den på et senere tidspunkt.
        <br>
        <b>Undtagelser</b> afholder bankposteringer fra at blive behandlet.
        Undtagelser bruges til at tage højde for andre integrationer mellem jeres bank og ØS. Det er f.eks. leverandørudbetalinger, der skal laves undtagelse for.
        <br>
        <br>
        <i>NB: Oprettelse af nye regler/undtagelser sker på de respektive faner.</i>
        <br>
        <br>
        Fanen <b>Filer</b> indeholder hhv. posteringsbilag og afstemningsbilag.
        Hvis man har direkte integration til kommunens ØS, vil listen med posteringsbilag være tom.
        Afstemningsbilag er en liste over de transaktioner som FOBI har hentet ind for den pågældende bogføringsdato og kan bruges til afstemning af bankkonti.
        <br>
        <br>
        <i>Kontakt evt. FOBI-udvikler Christian Skermer Leonhardt på csl@randers.dk for hjælp med at komme igang.</i>
        <br>
    </Content>

    <Content>
        <template #icon>
            <IconRSS />
        </template>
        <template #heading>Driftsstatus</template>
        
        <Status />
    </Content>

    <Content>
        <template>
            Kontakt evt. FOBI-udvikler Christian Skermer Leonhardt på csl@randers.dk for hjælp med at komme igang.
        </template>
    </Content>

</template>