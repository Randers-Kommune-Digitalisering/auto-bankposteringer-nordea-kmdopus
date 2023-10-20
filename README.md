# 🏦 Udlæsning af bankposteringer fra Nordea

Programmet kalder først auth-endpoints for at hente diverse tokens.
Derefter henter det forrige hverdags transaktioner.
Transaktionerne matches op mod konteringsregler og påføres kontering.
Konteringerne bliver lagt sammen i et omposteringsbilag i csv-format.
Filen bliver derefter manuelt indlæst i Opus.

# Status

Projektet er stadig i test-fasen.

# Guide

For at køre programmet er det pt. nødvendigt at starte en contatiner og åbne node-red manuelt.
Her er en step-by-step til igangsætning af programmet:
1. Åbn codespaces på dette repository
2. Send kommandoen "docker-compose up" til terminalen der åbner af sig selv
3. I fanen "Ports" eller i den prompt der åbner, kan du følge linket til den lokale port hvor node-red startes
4. I node-red skal der trykkes på "start"-noden, så sker resten automatisk. 

# Resources

[Dokumentation for Nordea API Corporate Access Authentication](https://developer.nordeaopenbanking.com/documentation?api=Corporate%20Access%20Authorization%20API)

[Dokumentation for Nordea API Instant Reporting](https://developer.nordeaopenbanking.com/documentation?api=Instant%20Reporting%20API)

[Swagger til Instant Reporting](https://developer.nordeaopenbanking.com/files/api-docs/xs2a-business-instant_reporting-v4-swagger.yaml)

[Postman Collection til Premium API endpoints inkl Authentication](https://raw.githubusercontent.com/NordeaOB/swaggers/master/Premium%20Corporate%20Access%20Authorization%20API%20with%20Accounts%20API%20and%20Payments%20API.postman_collection.json)

# 📦 Microservice based data stack

![](https://avatars.githubusercontent.com/u/5375661?s=36&v=4)  Node-RED as a dataflow / orchestrator

![](https://avatars.githubusercontent.com/u/1529926?s=36&v=4)  Redis as the messaging queue

![](https://avatars.githubusercontent.com/u/1525981?s=36&v=4)  Python as the data transform language

For more information on how to use this stack, please see the [HOW-TO](/docs/HOW-TO.md) file.
