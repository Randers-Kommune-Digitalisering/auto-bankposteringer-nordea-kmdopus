# 🚀 Fællesoffentlig Bankintegration (FOBI)

> Leverandøruafhængig bankintegrations- og konteringstjeneste til danske kommuner.

---

## 🎯 Formål

FOBI automatiserer og standardiserer kontering af banktransaktioner.

Løsningen samler bankintegration og konteringslogik i én fælles motor, som kan anvendes på tværs af:

* 🏦 Pengeinstitutter
* 🧾 Økonomisystemer
* 📊 Kontoplaner
* 🏛️ Kommuner

---

## 🔎 Udfordringen i dag

Bankbogføring håndteres ofte via:

* 🧩 Leverandørspecifikke moduler
* 🤖 RPA og lokale scripts
* 🔀 Forskellig praksis fra kommune til kommune

Det skaber unødig kompleksitet, afhængighed og begrænset genbrug.

---

## 🧠 Løsningen

FOBI fungerer som integrationslag mellem bank og økonomisystem og leverer strukturerede, bogføringsklare data.

Kerneelementer:

* 🔄 Normalisering af bankdata
* ⚙️ Regelbaseret matchningsmotor
* ⚖️ Automatisk debit/kredit-håndtering
* 🔍 Auditérbar og deterministisk beslutningslogik
* 🗂️ Systemuafhængig datamodel
* 🔌 Direkte integration til økonomisystem

Konteringsregler defineres ét sted og kan genbruges.

---

## ❗ Hvorfor ikke kun RPA?

RPA kan automatisere klik og filhåndtering – men bankintegration er mere end det.

RPA:

* Arbejder ovenpå eksisterende systemer i stedet for at være en del af arkitekturen
* Er ofte sårbar overfor ændringer i skærmbilleder og formater
* Er vanskeligere at dokumentere og teste systematisk
* Skaber lokale løsninger frem for fælles standarder

FOBI er designet som en egentlig integrations- og konteringstjeneste – ikke som en automatiseret brugerhandling.

---

## 🏗️ Arkitekturvalg

FOBI er udviklet som selvstændig software frem for low-code flows.

Det sikrer:

* 🔎 Gennemsigtighed i konteringslogik
* 📚 Dokumentérbar og revisionsvenlig løsning
* 🔓 Uafhængighed af enkeltleverandører
* 📈 Forudsigelige driftsomkostninger
* 🌍 Mulighed for fælleskommunal genbrug

Bankintegration er en del af kommunens økonomiske infrastruktur – ikke blot en administrativ proces.

---

## 🖥️ Én samlet brugerflade

I mange løsninger er opsætning og drift spredt på flere steder:

* Flow-konfiguration i fx RPA/automatiseringsværktøj
* SFTP-opsætning og filovervågning
* Indlæsning i økonomisystem
* Fejl, der skal findes i separate logs eller systemer

Det giver fragmenteret ansvar og øget kompleksitet.

FOBI samler:

* ⚙️ Konfigurationsregler
* 🚦 Fejl- og afvisningshåndtering
* 📂 Overblik over ind- og udgående data
* 🔎 Sporbarhed på den enkelte transaktion

Ét system. Ét overblik. Ét ansvarspunkt.

Det reducerer driftsrisiko og gør løsningen mere robust i hverdagen.

---

## 📈 Værdi

* ⏱️ Reduceret manuel bogføring
* 📊 Øget datakvalitet og sporbarhed
* ✅ Færre fejlkonteringer
* 🔓 Leverandøruafhængighed
* 🌍 Fundament for fælleskommunal standardisering

FOBI kan udvides med fx:

* 💸 Udbetalingskomponenter
* 🏧 Integration til betalingssystemer

---

## 🛠️ Status

Løsningen er i drift lokalt med:

* 🔗 Direkte bankintegration
* 🤖 Fuld automatisering af udvalgte funktionsområder
* 🖥️ Regelmotor og administrationsinterface

---

## 🌱 Perspektiv

Mange kommuner betaler årligt for bankbogføringsmoduler eller udvikler egne løsninger.

FOBI viser, at funktionaliteten kan samles i en fælles, genbrugelig tjeneste.

Spørgsmålet er ikke, om vi kan bygge det.
Spørgsmålet er, om vi skal gøre det hver for sig – eller sammen.
