# GUIDE til Governance Report

> Dette er OS2's checkliste der skal benyttes til at belyse niveauet af et OS2 produkt.
>
> Du udfylder checklisten ved at anvende en af de følgende markeringer, under  🔽 kolonnen:
>
> ✅ - Kriteriet er opfyldt
>
> ❌ - Kriteriet er IKKE opfyldt
> 
> ➖ - Kriteriet er ikke relevant for dette produkt
> 
> ❓ - Der er tvivl om hvordan dette kriterie evalueres
>
> Hvis feltet efterlades tomt, betragtes evalueringen som ikke færdiggjort.
>
> Har du spørgsmål? [Kontakt OS2's sekretariat](https://os2.eu/kontakt), vi er her for at hjælpe.
>
> Information om OS2's produktniveauer og baggrunden herfor kan der [læses mere om her](https://governance.os2.eu).

# OS2bankintegration

Denne checkliste belyser efterlevelsen af OS2's niveaukrav for produktet.

## RELEVANS

| 🔽  | #   | Krav                                          | Beskrivelse / Dokumentation | Produktniveau | Retningslinjer                                                                                                        |
| --- | --- | --------------------------------------------- | ----------------------------| --------------| ----------------------------------------------------------------------------------------------------------------------|
|  ✅  | R1  | Løsningen skaber lokal værdi                  | Automatiserer kontering og bogføring af banktransaktioner i kommunen. Reducerer manuel bogføring, øger ensartethed og samler arbejdsgange relateret til bankbogføring. | sandkasse     | Beskriv den konkrete værdi løsningen skaber i organisationen. F.eks. økonomisk, organisatorisk eller brugerrelateret. |
|  ✅  | R2  | Løsningen er accepteret af lokal linjeledelse | Skriftlig accept pr. 24.02.2026 | 2             | Beskriv eller henvis til en formel accept fra ledelse hos initiativtagerne til løsningen.                             |
|  ✅  | R3  | Løsningen har fælles offentligt potentiale    | Beskrevet i projektets README | 2             | Redegør for hvordan løsningen kan bruges på tværs af kommuner og/eller offentlige myndigheder.                        |
|  ❓  | R4  | Ophæng til nationale strategier er til stede  |                             | 3             | Henvis til relevante strategier og forklar hvordan løsningen understøtter disse.                                      |


## FORMKRAV

| 🔽 | #   | Krav                                          | Beskrivelse / Dokumentation                                                                                                                                          | Produktniveau |
| -- | --- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| ❌ | F1  | Kildekode udvikles synligt i OS2 repository | Kode ligger pt. i eget repository. Ikke overdraget til OS2 endnu. | sandkasse |
| ✅ | F2  | Open Source licenskriterier overholdes | Projektet bruger MPL 2.0 | sandkasse |
| ✅ | F3  | Udbudsregler overholdt | Indkøb vurderes under tærskel uden klar grænseoverskridende interesse. | sandkasse |
| ✅ | F4  | Sikkerhed er indtænkt | Integration til banker sker via web service-snitflader. Credentials krypteres og gemmes i YAML-filer i privat repo. ERP-integration sker via SFTP. Adgangsstyring håndteres via fælleskommunal Context Handler. Miljøadskillelse håndteres af driftsleverandør. Der mangler pt. audit trail, revisionsspor og dokumenteret risikovurdering. | sandkasse |
| ✅ | F5  | Formål og værdi beskrevet | Udførligt beskrevet i README. | sandkasse |
| ❌ | F6  | Kode overdraget til OS2 | Ikke sket endnu. | 1 |
| ❌ | F7  | OS2 dokumentationsskabelon anvendt | Ikke implementeret endnu. | 1 |
| ❌ | F10 | OS2 kommunikationskanaler anvendt | Ingen officiel omtale endnu. | 1 |
| ❌ | F11 | Offentlig issue-tracking via OS2 | Anvender GitHub inkl. Issues, men ikke under OS2. | 1 |
| ✅ | F12 | Én version af core-kode | Én main-branch, aktiv udvikling. | 2 |
| ❌ | F13 | Præsentationsmateriale udarbejdet | Ikke formelt udarbejdet endnu. | 2 |
| ❌ | F14 | Strategisk kommunikationsmateriale | Ikke udarbejdet. | 2 |
| ❌ | F15 | Best practice for implementering dokumenteret | Ikke dokumenteret endnu. | 2 |
| ❓ | F16 | Kodestandarder dokumenteret | TypeScript, Zod, Drizzle, Nuxt følger best practice, men ikke formelt dokumenteret. | 2 |
| ❓ | F17 | Drift og vedligehold beskrevet | Containerbaseret (Docker). Planlagt drift via OS2-regi. Database er ikke replikeret. Backup/restore og robusthedsstrategi ikke dokumenteret. | 2 |
| ❓ | F18 | Rammearkitektur fulgt | Løsningen er designet efter principperne i Digitaliseringsstyrelsen's fællesoffentlige rammearkitektur med fokus på løskobling, standardiserede snitflader og containerbaseret drift. ERP-integration sker via SFTP grundet markedsvilkår. FK-ØKO snitflader fra KOMBIT er analyseret, men ikke implementeret pga. kompleksitet og finansiering. Mangler pt. formel arkitekturdokumentation, begrebsmodel, audit trail og dokumenteret driftsarkitektur. | 2 |
| ✅ | F19 | Containerformat | Løsningen er containerized med multistage Docker inkl. compose-fil til udviklingsmiljø. | 2 |
| ❌ | F20 | Uddannelsesmateriale | Ikke udarbejdet endnu. | 2 |
| ❌ | F21 | Politisk kommunikation | Ikke udarbejdet. | 3 |
| ❌ | F22 | Procesplan for driftsimplementering | Ikke udarbejdet endnu. | 3 |

## STRATEGISK SAMMENHÆNG

| 🔽 | #  | Krav                                         | Beskrivelse / Dokumentation                                                                                                | Produktniveau |
| -- | -- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------- |
| ❓  | S1 | Kobling til OS2 strategi                     | Understøtter fællesoffentlig digitalisering, genbrug og open source, men ikke formelt beskrevet i OS2-strategisk kontekst. | 1             |
| ✅  | S2 | Understøtter innovation og open source       | Designet som open source-projekt, hvor kommuner kan bidrage med matchningslogik og erfaringer.                             | 1             |
| ❓  | S3 | Kobling til OS2 mission/vision beskrevet     | Ikke formelt dokumenteret endnu.                                                                                           | 2             |
| ❌  | S4 | Vision og strategi for produktet             | Findes implicit i README, men ikke som selvstændigt strategidokument.                                                      | 2             |
| ❌  | S5 | Overensstemmelse med OS2 vision dokumenteret | Ikke dokumenteret endnu.                                                                                                   | 3             |


## GOVERNANCE

| 🔽 | #   | Krav                             | Beskrivelse / Dokumentation                           | Produktniveau |
| -- | --- | -------------------------------- | ----------------------------------------------------- | ------------- |
| ❌  | G1  | Oprettet i OS2 portefølje        | Ikke registreret endnu.                               | 1             |
| ❌  | G2  | Koordination med sekretariat     | Ikke formaliseret endnu.                              | 1             |
| ✅  | G3  | Projektleder udpeget             | Christian Leonhardt                                   | 1             |
| ❌  | G4  | Bestyrelsen orienteret           | Ikke endnu.                                           | 1             |
| ❌  | G5  | Bestyrelsen har godkendt         | Ikke endnu.                                           | 2             |
| ❌  | G6  | Styregruppe nedsat               | Ikke endnu.                                           | 2             |
| ❌  | G7  | Koordinationsgruppe              | Ikke etableret.                                       | 2             |
| ❌  | G8  | Projektmodel dokumenteret        | Arbejdes agilt, men ikke formelt dokumenteret.        | 2             |
| ❌  | G9  | Ekstern code review              | Ikke foretaget endnu.                                 | 2             |
| ❌  | G10 | Tilslutningserklæring            | Ikke udarbejdet.                                      | 2             |
| ❌  | G11 | Bestyrelsen godkendt styregruppe | Ikke relevant endnu.                                  | 3             |
| ❌  | G12 | Bestyrelsesrepræsentation        | Ikke relevant endnu.                                  | 3             |
| ❌  | G13 | Finansieringsaftale              | Ikke etableret endnu.                                 | 3             |
| ❌  | G14 | Fagligt fællesskab etableret     | Ikke etableret endnu.                                 | 3             |
