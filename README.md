<h1 align="center"> Fællesoffentlig bankintegration (FOBI) </h1> <br>

# Indholdsfortegnelse

- [Status](#status)
- [Introduktion](#introduktion)
- [Sådan fungerer det](#sådan-fungerer-det)
- [Teknisk implementering](#teknisk-implementering)
- [Sådan kommer du i gang](#sådan-kommer-du-i-gang)
- [Nye features](#nye-features)
- [Diagrammer](#diagrammer)
- [Faglige ressourcer](#faglige-ressourcer)
- [Tekniske ressourcer](#tekniske-ressourcer)
- [Tech stack](#tech-stack)

# Status

![Hosting status](https://img.shields.io/badge/I_test-lightgreen)

### Bankintegrationer:

![Nordea](https://img.shields.io/badge/Nordea-green)
![Danske Bank](https://img.shields.io/badge/Danske_Bank-grey)
![Lunar](https://img.shields.io/badge/Lunar-grey)
![Bankdata](https://img.shields.io/badge/Bankdata-grey)
![BEC](https://img.shields.io/badge/BEC-grey)
![SDC](https://img.shields.io/badge/SDC-grey)

### Økonomisystemintegrationer:

![KMD Opus](https://img.shields.io/badge/KMD_Opus-green)
![Fujitsu Prisme](https://img.shields.io/badge/Fujitsu_Prisme-grey)
![ØS Indsigt](https://img.shields.io/badge/ØS_Indsigt-grey)

# Introduktion

Fællesoffentlig bankintegration (FOBI) integrerer kommunernes økonomisystem (ØS) og bankkonti for fuldautomatisk bogføring af hovedkonto 8.22.05 og semi-automatisk bogføring af bankposteringer i kommunernes kontoplan.

Ved hjælp af brugeroprettede konteringsregler matcher og bogfører FOBI bankposteringer med den ønskede kontering i kommunernes ØS.

# Sådan fungerer det

Kommunerne udfylder egne stamdata og konteringsregler, som programmet bruger til at automatisere bogføringen af banktransaktioner.
En konteringsregel indeholder et sæt søgekriterier og et sæt konteringsoplysninger.
Stamdata indeholder blandt andet information om kommunens administrator/kontaktperson og bankkontooplysninger.

FOBI har planlagt kørsel dagligt kl. 5:30, hvor transaktionerne for seneste lukkede bankdag hentes.
Transaktionerne matches med konteringsregler og påføres kontering.
Konteringerne udstilles i et finansbilag i csv-format eller leveres direkte til ØS via en bilagsintegration (FTP-forbindelse).

# Teknisk implementering

Eftersom der er stor forskel på IT-infrastrukturen i kommunerne, kan der ikke gives en generel teknisk vejledning til implementering.
Servicen er bygget til at blive hosted i en Kubernetes-cluste, som administreres af en tredjepart, men kan sagtens rekonfigureres til at køre f.eks. lokalt.
Kommunens IT-ansvarlige bør tage stilling til hosting af løsningen.

Servicen udstilles på `port 3000`.

Back-enden udviklermiljøet Node-RED udstilles på `port 1880`.

# Sådan kommer du i gang

Når servicen er live, bør den IT-ansvarlige i samarbejde med systemejer...

... udfylde konfigurationen på første fane i Node-RED og

... følge vejledningen på forsiden af front-enden.

FOBI er fuldstændigt afhængig af systemejerens evne til at genkende mønstre i transaktionsoplysninger for at kunne fungere optimalt.
FOBI vil med andre ord kun blive en succes hvis systemejeren koncentrerer sit arbejde med bankbogføring omkring systematisering og mønstergenkendelse af betalingsflowet generelt.

# Nye features

Der udvikles løbende nye features.
Ønsker til nye features findes i [Issues](https://github.com/Randers-Kommune-Digitalisering/auto-bankposteringer-nordea-kmdopus/issues).

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
