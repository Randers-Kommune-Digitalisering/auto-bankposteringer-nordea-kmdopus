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
        Fællesoffentlig bankintegration (FOBI) integrerer kommunernes økonomisystem (ØS) og bankkonti for fuldautomatisk bogføring af hovedkonto 8.22.05 og semi-automatisk bogføring af bankposteringer i kommunernes kontoplan.
        <br>
        <br>
        Ved hjælp af brugeroprettede konteringsregler matcher og bogfører FOBI bankposteringer med den ønskede kontering i kommunernes ØS.
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
        Nordea og Danske Bank leverer selv deres data, mens de resterende banker i Danmark leverer data igennem virksomhederne Bankdata, BEC eller SDC. Det fremgår af virksomhedernes hjemmeside, hvilke banker de leverer data for.
        <br>
        Essensen af denne aftale er at du søger adgang til dine egne bankdata, og der er på nuværende tidspunkt stor forskel på hvordan leverandørerne håndterer denne ukonventionelle "manøvre".
        Spørg din dataleverandør om mulighederne for adgang til egne transaktionsoplysninger.
        <br>
        Når aftalen er lavet, får du nogle koder som skal angives i løsningens bagvedliggende filer.
        <br>
        <br>
        En lignende aftale indgås med din <b>ØS-leverandør</b>.
        <br>
        I denne aftale er det er du som kommune leverandør af data, som skal indlæses i ØS.
        <br>
        Leveringen af data foregår igennem en FTP-forbindelse. Spørg din leverandør om mulighederne for tilslutning.
        <br>
        Ønsker man <i>ikke</i> denne tilslutning, vil FOBI i stedet oprette finansbilag til manuel indlæsning i ØS.
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
        <br>
        Administratoren skal periodevis godkende FOBI's adgang til at hente jeres bankdata, hvilket er grunden til at disse oplysninger skal udfyldes.
        <br>
        <br>
        Konteringsregler er opdelt i 3 faner efter deres type; hhv. aktive og inaktive regler, samt undtagelser.
        <br>
        Alle regler er opdelt i transaktionsoplysninger og konteringsoplysninger. Transaktionsoplysningerne er de data der tilsammen udgøre bankposteringen.
        Da der er stor forskel bankerne imellem, hvilke felter der leveres til kunden, er der lavet 4 grupper af data, som findes i alle bankposteringer i den ene eller anden form: reference, afsender, advis (sekundære tekstfelter) samt posteringstype.  
        <br>
        <b>Aktive regler</b> er kernen af FOBI; det er disse konteringsregler der kan udløser en automatisk bogføring.
        <br>
        <b>Inaktive regler</b> benytter FOBI ikke til konteringsmatch, men brugeren har fortsat mulighed for at tilpasse reglen og evt. genaktivere den på et senere tidspunkt.
        <br>
        <b>Undtagelser</b> afholder bankposteringer fra at blive behandlet. Undtagelser bruges til at tage højde for andre integrationer mellem jeres bank og ØS. Det er f.eks. leverandørudbetalinger, der skal laves undtagelse for.
        <br>
        <br>
        <i>NB: Oprettelse af nye regler/undtagelser sker på de respektive faner.</i>
        <br>
        <br>
        Fanen <b>Filer</b>, vil kun være synlig hvis man ikke har en direkte integration til ØS.
        Fanen vil i så fald indeholde de finansbilag som du som kommune manuelt skal indlæse i ØS, afgrænset efter lukkede bankdatoer.
    </Content>

    <Content>
        <template #icon>
            <IconRSS />
        </template>
        <template #heading>Driftsstatus</template>
        Løsningen benytter udviklingsmiljøet Node-RED til at håndtere back-end-funktionaliteter.
        
        <Status />
    </Content>

    <Content>
        <template>
            Kontakt evt. FOBI-udvikler Christian Skermer Leonhardt på csl@randers.dk for hjælp med at komme igang.
        </template>
    </Content>

</template>