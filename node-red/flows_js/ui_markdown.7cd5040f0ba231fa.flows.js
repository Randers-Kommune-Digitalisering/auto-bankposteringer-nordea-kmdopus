const Node = {
  "id": "7cd5040f0ba231fa",
  "type": "ui-markdown",
  "z": "74de194f4f0868a4",
  "g": "de8e90487bfa723e",
  "group": "90df39afe8d995d2",
  "name": "How to use the site",
  "order": 5,
  "width": 0,
  "height": 0,
  "content": "I navigationen til venstre finder du 7 faner.\n\nI fanen \"stamdata\" angives oplysninger om kommunens FOBI-administrator og de bankkonti, som kommunen ønske at anvende FOBI til.\nAdministratoren skal periodevis godkende at FOBI stadig har lov til at hente data fra jeres bank, hvilket er grunden til at disse oplysninger skal udfyldes.\n\nKommunens konteringsregler er opdelt i 3 kategorier, hhv. aktive og inaktive regler, samt undtagelser.\n\nRegler inddeles i aktive og inaktive regler for at give brugerne mulighed for at midlertidig at inaktive regler som ikke fungerer korrekt.\nVed at inaktivere reglen benytter FOBI ikke reglen til konteringsmatch, men brugeren har fortsat mulighed for at tilpasse reglen og evt. genaktivere den på et senere tidspunkt.\nUndtagelser bruges til at tage højde for andre integrationer mellem jeres bankkonti og ØS. Det er typisk sådan noget som leverandørudbetalinger, der skal udfyldes her.\n\nI fanen \"Filbibliotek\", vil der være logfiler som kan anvendes af den FOBI-ansvarlige til fejlsøgning.\nEr der ikke oprettet en FTP-forbindelse, vil de finansbilag som FOBI danner være tilgængelige her med datomærkning fra bankdagen i filnavnet.\n\nTil sidst er der 2 faner til oprettelse af hhv. nye regler og nye undtagelser.\nPosteringsteksten der påføres matchede bankposteringer kan kopieres fra tre forskellige oplysninger fra banken eller fra en vilkårlig bruger-bestemt tekst.\nUndtagelser indeholder i sagens natur ikke konteringsoplysninger.",
  "className": "",
  "x": 130,
  "y": 240,
  "wires": [
    []
  ]
}

module.exports = Node;