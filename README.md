<h1 align="center"> Bankintegration for posteringer til kommunalt økonomisystem (ØS) </h1> <br>

# Indholdsfortegnelse

- [Status](#status)
- [Introduktion](#introduktion)
- [Sådan fungerer det](#sådan-fungerer-det)
- [Diagrammer](#diagrammer)
- [Faglige ressourcer](#faglige-ressourcer)
- [Tekniske ressourcer](#tekniske-ressourcer)
- [Tech stack](#tech-stack)

# Status

![Under udvikling](https://img.shields.io/badge/Under%20udvikling-red)

### Bankintegrationer:

![Nordea](https://img.shields.io/badge/Nordea-OK-green)
![Danske Bank](https://img.shields.io/badge/Danske_Bank-Mangler-red)
![Bankdata](https://img.shields.io/badge/Bankdata-Mangler-red)
![BEC](https://img.shields.io/badge/BEC-Mangler-red)
![SDC](https://img.shields.io/badge/SDC-Mangler-red)

### Økonomisystemintegrationer:

![KMD Opus](https://img.shields.io/badge/KMD_Opus-OK-green)
![Fujitsu Prisme](https://img.shields.io/badge/Fujitsu_Prisme-Mangler-red)
![ØS Indsigt](https://img.shields.io/badge/ØS_Indsigt-Mangler-red)

### Bilagsintegration til ØS:

![KMD Opus](https://img.shields.io/badge/KMD_Opus-Mangler-red)
![Fujitsu Prisme](https://img.shields.io/badge/Fujitsu_Prisme-Mangler-red)
![ØS Indsigt](https://img.shields.io/badge/ØS_Indsigt-Mangler-red)

# Introduktion

De fleste kommunale økonomimedarbejdere koncentrerer sig primært om det kommunale økonomisystem, men al afregning med omverdnen foregår reelt på kommunernes bankkonti.
Der bør derfor være en helt tæt forbindelse mellem kommunens transaktioner og kommunens økonomisystem.
Det er desværre ikke altid tilfældet, og derfor bliver der rundt omkring i kommmunerne lavet rigtig mange manuelle bogføringer; særligt manuel bogføring af indbetalinger.
En store del af disse transaktioner følger heldigvis ofte et mønster, så der er basis for automatisering.

Projektet sørger altså for en stærkere integration mellem bankkonti og det interne økonomisystem og automatiserer bogføringen af størstedelen af kommunens transaktioner.

# Sådan fungerer det

Kommunerne udfylder stamdata og konteringsregler, som programmet bruger til at automatisere bogføringen af banktransaktioner.
En konteringsregel indeholder et sæt søgekriterier og et sæt konteringsoplysninger.
Stamdata indeholder blandt andet information om kommunens administrator/kontaktperson og bankkontooplysninger.

Programmet har planlagt kørsel dagligt kl. 5:30, hvor transaktionerne for seneste lukkede bankdag hentes.
Transaktionerne matches op mod konteringsregler og påføres kontering.
Konteringerne bliver lagt sammen i et finansbilag i csv-format.
Finansbilaget udstilles på hjemmesiden.
Der er også mulighed for at koble sig på en bilagsintegration hos leverandøren af ØS'et, så finansbilag automatisk indlæses i ØS. 

# Diagrammer

### Systemdesign
![System design](images/System%20design.svg)

### Server design
![Server design](images/Server%20design.svg)

# Faglige ressourcer

[Budget- og regnskabssystem for kommuner](https://budregn.im.dk/budget-og-regnskabssystem-for-kommuner/)

# Tekniske ressourcer

[Dokumentation for Nordea API Corporate Access Authentication](https://developer.nordeaopenbanking.com/documentation?api=Corporate%20Access%20Authorization%20API)

[Dokumentation for Nordea API Instant Reporting](https://developer.nordeaopenbanking.com/documentation?api=Instant%20Reporting%20API)

[Swagger til Instant Reporting](https://developer.nordeaopenbanking.com/files/api-docs/xs2a-business-instant_reporting-v4-swagger.yaml)

[Postman Collection til Premium API endpoints inkl Authentication](https://raw.githubusercontent.com/NordeaOB/swaggers/master/Premium%20Corporate%20Access%20Authorization%20API%20with%20Accounts%20API%20and%20Payments%20API.postman_collection.json)

# Tech stack

![](https://avatars.githubusercontent.com/u/5429470?s=36&v=4)  Programmet kører i en docker-container

![](https://avatars.githubusercontent.com/u/5375661?s=36&v=4)  Node-RED som orkestrator

![](https://avatars.githubusercontent.com/u/1529926?s=36&v=4)  Redis som bindeled til microservices

![](https://avatars.githubusercontent.com/u/1525981?s=36&v=4)  Python som microservice (konteringsforslag til umatchede posteringer)

For mere information, læs [HOW-TO](/docs/HOW-TO.md) filen.
