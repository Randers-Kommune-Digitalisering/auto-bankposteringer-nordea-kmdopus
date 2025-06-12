<script setup>
    import Content from '@/components/Content.vue'
    import Status from '@/components/Status.vue'
    import IconDocText from '../components/icons/IconDocText.vue'
    import IconNB from '@/components/icons/IconNB.vue'
    import IconRSS from '@/components/icons/IconRSS.vue'
    import IconCompass from '@/components/icons/IconCompass.vue'

</script>

<template>
    <h2>Fællesoffentlig Bankintegration</h2>

    <Content>      
        Fællesoffentlig bankintegration (<b>FOBI</b>) integrerer dit økonomisystem (ØS) og dine bankkonti for fuldautomatisk bogføring af hovedkonto 8.22.05 og semi-automatisk bogføring af bankposteringer i kommunernes kontoplan.
        <br>
        <br>
        Ved hjælp af generiske konteringsregler matcher og bogfører FOBI bankposteringer med den ønskede kontering i kommunernes ØS.
    </Content>

    <Content>
        <template #icon>
            <IconCompass />
        </template>
        <template #heading>Sådan bruger du FOBI</template>
        I navigationen til venstre finder du 8 faner foruden denne startside.
        <br>
        <br>
        I fanen <b>Stamdata</b> angives bl.a. oplysninger om kommunens FOBI-administrator og de bankkonti, som kommunen ønske at anvende FOBI til.
        Bankkonti oplyses pt. i formatet "IBAN minus kontrolnøgle" + "bindestreg" + "valutakode", f.eks. DK20001234567890-DKK.
        <br>
        Administratoren skal kunne godkende FOBI's adgang til at hente jeres bankdata, hvilket er grunden til at disse oplysninger skal udfyldes.
        <br>
        <br>
        <b>Konteringsregler</b> er opdelt i 4 faner efter deres type; hhv. aktive regler, inaktive regler, engangsregler samt undtagelser.
        <br>
        <b>Aktive regler</b> er regler som afspejler et mønster for tilbagevendende bankposteringer.
        Disse regler benyttes af FOBI til automatisk konteringsmatch og bør tildeles størst opmærksomhed.
        <br>
        <b>Inaktive regler</b> benytter FOBI ikke til konteringsmatch, men brugeren har fortsat mulighed for at tilpasse reglen og evt. genaktivere den på et senere tidspunkt.
        Man kan f.eks. oprette en inaktiv regel hvis man har en idé til en aktiv konteringsregel, men stadig er usikker på hvad felterne skal udfyldes med.
        <br>
        <b>Engangsregler</b> er regler som slettes efter de matches med en bankpostering. Disse regler anvendes til enkeltstående bankposteringer.
        <br>
        <b>Undtagelser</b> afholder bankposteringer fra at blive behandlet og bruges til at tage højde for andre integrationer til de tilmeldte bankkonti.
        Det er bl.a. leverandørudbetalinger, der skal laves undtagelse for.
        <br>
        <br>
        Oprettelse af nye regler/undtagelser sker på de respektive faner.
        <br>
        <br>
        Alle regler er opdelt i transaktionsoplysninger og konteringsoplysninger.
        <br>
        <b>Transaktionsoplysninger</b> er de data der tilsammen udgøre bankposteringen.
        Der er lavet 3 grupper af data, som findes i alle bankposteringer i den ene eller anden form: reference, afsender samt posteringstype.
        <b>Reference</b> omfatter alle tilgængelige fritekstfelter i bankposteringen.
        <b>Posteringstype</b> er defineret af banken og kan være f.eks. "overførsel", "bgs" eller "cap".
        <b>Afsender</b> giver sig selv.
        Felterne til de 3 datagrupper udfyldes med en eller flere tekststrenge (seperaret med komma), som bruges til at matche ud fra.
        Felterne kan også være tomme, hvis man ikke ønsker at begrænse på pågældende felt.
        Det kan f.eks. være indbetalinger af KSD fra andre kommuner, hvor afsender varierer (og feltet derfor skal være tomt), men referencen altid idneholder "KSD-".
        <br>
        <b>Konteringsoplysninger</b> er de data der skal bruges til at danne en postering i ØS.
        Der er validering på alle felter i konteringsoplysninger, så der ikke dannes ugyldige posteringer i ØS.
        <br>
        <br>
        Fanen <b>Filer</b> indeholder hhv. posteringsbilag, afstemningsbilag og manuelle posteringer.
        <br>
        <b>Posteringsbilag</b> er de bilag som FOBI har dannet for de bankposteringer, der er blevet behandlet af løsningen. Svarer til en "kørsel", som omtalt i andre faner.
        Hvis man har direkte integration til kommunens ØS, bør posteringsbilagene kun bruges som backup ifm. fejl.
        <br>
        <b>Afstemningsbilag</b> er en liste over de transaktioner som FOBI har hentet ind for den pågældende bogføringsdato og kan bruges til afstemning af bankkonti.
        <br>
        <b>Manuelle posteringer</b> er de posteringer som FOBI ikke har kunnet matche med en konteringsregel og som er blevet behandlet manuelt af brugeren.
        Hvis man har direkte integration til kommunens ØS, bør de manuelle posteringer kun bruges som backup ifm. fejl.
        <br>
        <br>
        Fanen <b>Kørselshistorik</b> viser en liste over tidligere kørsler.
        En kørsel er indlæsningen af bankposteringer for en given dato, for alle tilmeldte konti.
        Fejl ifm. kørsler håndteres fra denne fane.
        <br>
        <b>Åbne posteringer</b> er de bankposteringer som FOBI ikke har kunnet matche med en konteringsregel og som endnu ikke er blevet behandlet manuelt af brugeren.
        Posteringerne skal behandles manuelt fra denne fane.
        Der er validering på alle konteringsfelter i de åbne posteringer, så der ikke dannes ugyldige posteringer i ØS.
        <br>
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
        <br>
        <br>
        <i>Kontakt evt. FOBI-udvikler Christian Skermer Leonhardt på csl@randers.dk for hjælp med at komme igang.</i>
        <br>
    </Content>

    <Content>
        <template #icon>
            <IconDocText />
        </template>
        <template #heading>Dokumentation</template>
        Læs mere om løsningen og find kildekoden på 
        <a href="https://github.com/randerskommune/auto-bankposteringer-nordea-kmdopus" target="_blank" rel="noopener">GitHub</a>.
    </Content>

    <Content>
        <template #icon>
            <IconRSS />
        </template>
        <template #heading>Driftsstatus</template>
        
        <Status />
    </Content>

</template>