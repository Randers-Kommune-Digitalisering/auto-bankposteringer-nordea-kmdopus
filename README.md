<h1 align="center"> Fællesoffentlig bankintegration (FOBI) </h1> <br>

# Indholdsfortegnelse

- [Status](#status)
- [Introduktion](#introduktion)
- [Sådan fungerer det](#sådan-fungerer-det)
- [Sådan kommer du i gang](#sådan-kommer-du-i-gang)
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

Fællesoffentlig bankintegration (FOBI) integrerer kommunernes økonomisystem (ØS) og bankkonti for fuldautomatisk bogføring af hovedkonto 8.22.05 og semi-automatisk bogføring af bankposteringer i kommunernes kontoplan.

Ved hjælp af brugeroprettede konteringsregler matcher og bogfører FOBI bankposteringer med den ønskede kontering i kommunernes ØS.

# Sådan fungerer det

Kommunerne udfylder egne stamdata og konteringsregler, som programmet bruger til at automatisere bogføringen af banktransaktioner.
En konteringsregel indeholder et sæt søgekriterier og et sæt konteringsoplysninger.
Stamdata indeholder blandt andet information om kommunens administrator/kontaktperson og bankkontooplysninger.

FOBI har planlagt kørsel dagligt kl. 5:30, hvor transaktionerne for seneste lukkede bankdag hentes.
Transaktionerne matches med konteringsregler og påføres kontering.
Konteringerne samles i et finansbilag i csv-format eller leveres direkte til ØS via en bilagsintegration (FTP-forbindelse).

# Sådan kommer du i gang

1. Installér docker på dit system
2. Klon dette repository til en projektmappe på dit system
3. Navigér til projektmappen og kør kommandoen `docker-compose up --build` for initialisere og starte alle komponenter
4. Gå til back-end udviklermiljøet Node-RED på adressen `http://localhost:1880`
5. Gå til adressen `http://localhost:3000` for at se front-end
6. Udfyld konfigurationen på første fane i Node-RED
7. Følg vejledningen på forsiden af front-enden

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

![](https://avatars.githubusercontent.com/u/5429470?s=36&v=4)  Serveren kører i en docker-container

![](https://avatars.githubusercontent.com/u/5375661?s=36&v=4)  Node-RED som orkestrator

![](https://avatars.githubusercontent.com/u/6128107?s=36&v=4)  Vue som front-end framework

![](https://avatars.githubusercontent.com/u/1529926?s=36&v=4)  Redis som bindeled til microservices (ikke i brug)

![](https://avatars.githubusercontent.com/u/1525981?s=36&v=4)  Python som microservice (konteringsforslag til umatchede posteringer) (ikke i brug)
