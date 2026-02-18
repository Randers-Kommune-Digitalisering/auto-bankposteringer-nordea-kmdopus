# Fællesoffentlig Bankintegration (FOBI)

> Én samlet motor til kontering af banktransaktioner i danske kommuner.

---

## 🎯 Formål

FOBI er udviklet for at automatisere og standardisere kontering og bogføring af banktransaktioner i danske kommuner.

Projektets kerneformål er at:

- Reducere manuel bogføring
- Gøre bogføringsopgaven uafhængig af pengeinstitut, kontoplan, økonomisystem og antal bankkonti
- Samle spredt forretningslogik ét sted
- Understøtte skalerbar og regelbaseret automatisering
- Øge datakvalitet og sporbarhed

FOBI er ikke blot et værktøj –  
det er et forsøg på at gentænke, hvordan bogføringspraksis og betalingsformidling kan struktureres mere intelligent.

---

## 🔎 Problemet i dag

I mange kommuner:

- Opgaven er delvist automatiseret (f.eks. via RPA)
- Konteringsregler lever i hoveder, Excel-ark eller lokale praksisser
- Hver bankintegration håndteres særskilt
- Debit/kredit-logik skal fortolkes forskelligt fra system til system

Konsekvensen:

- Parallelle løsninger i kommunerne
- Duplikeret kompleksitet
- Risiko for fejlkontering
- Manglende konsistens
- Svag mulighed for genbrug og skalering

Kompleksiteten er ikke forretningsmæssig —  
den er teknisk og strukturel.

---

## 🧠 Løsningen: Samling og Abstraktion

FOBI samler hele konteringsopgaven i ét system.

Systemet:

- Normaliserer bankdata
- Abstraherer debit/kredit-logik væk
- Centraliserer regeldefinition
- Gør beslutningslogik deterministisk og auditérbar

### Konkret implementerer FOBI:

- En regelbaseret matchningsmotor
- Strukturerede og eksplicitte matchkriterier
- Standardiseret og systemuafhængig datamodel
- Klar separation mellem regeldefinition og eksekvering
- En beslutningskæde, der kan testes og dokumenteres

---

## 🏗 Hvad betyder det i praksis?

FOBI betyder, at man:

- Ikke skal tage særskilt højde for debit og kredit
- Ikke skal kode særregler pr. bank
- Ikke skal gentage logik i hvert økonomisystem
- Ikke skal vedligeholde parallelle automatiseringer

Kompleksiteten samles ét sted.  
Forretningen får en ensartet og genbrugelig motor.

---

## 📈 Værdi

### 1. Operationel effektivitet
Automatisering reducerer manuel behandling og frigiver ressourcer til kontrol og kvalitetssikring.

### 2. Øget sikkerhed
Standardiseret og deterministisk logik mindsker risiko for fejl og utilsigtede afvigelser.

### 3. Datakvalitet
Struktureret kontering skaber et bedre fundament for rapportering, analyse og styring.

### 4. Skalerbarhed
Én regelmotor kan genbruges på tværs af:
- Pengeinstitutter
- Kontoplaner
- Økonomisystemer
- Kommuner

### 5. Strategisk perspektiv
Projektet kan fungere som fundament for en bredere standardisering af betalings- og matchningsprocesser i den offentlige sektor.

---

## 🧩 Designprincipper

- Stateless applikationslogik
- Database som sandhedskilde
- Eksplicit validering og schemas
- Auditérbar beslutningskæde
- Tydelig separation mellem domæne og integration

---

## 🚀 Ambition

FOBI er bygget med henblik på:

- Gradvis udvidelse mod maskinlæring
- Fællesoffentlig infrastruktur
- Høj compliance og revisionssikkerhed
- Teknologisk robusthed og transparens

---

## 🔧 Status

Projektet er under aktiv udvikling.

Fokusområder:
- Stabil regelmotor
- Datamodellering
- API-lag
- Drift og containerisering

---

## 🤝 Bidrag

Projektet er åbent for:

- Faglig sparring
- Arkitekturkritik
- Standardiseringsdialog
- Tværkommunalt samarbejde

---

## 🌍 Vision

En fremtid hvor finansielle arbejdsgange i det offentlige er:

- Automatiserede  
- Standardiserede  
- Transparente  
- Sikkert forankrede  

FOBI er et skridt i den retning.
