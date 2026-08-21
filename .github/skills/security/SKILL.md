<!--
	Sikkerhedsinstruktioner for bankdata
-->

# Sikker håndtering af bankdata

Når der hentes data fra banken, skal dataene altid håndteres fortroligt:

- Bankdata må kun gemmes i databasen eller i projektets `.secrets/`-mappe.
- Bankdata må ikke gemmes i kildekode, logfiler, midlertidige filer uden for
	`.secrets/`, dokumentation eller andre mapper.
- Kontrollér, at `.secrets/` er ignoreret af Git, før bankdata skrives dertil.
- Bankdata, legitimationsoplysninger, tokens og eksporterede filer må aldrig
	committes eller på anden måde tilføjes til Git.
- Undgå at udskrive bankdata i terminalen, fejlmeddelelser eller CI-logge.
- Hvis en fil med bankdata ved en fejl er blevet staged eller committed, skal
	den fjernes fra Git straks, og eventuelle berørte hemmeligheder skal
	tilbagekaldes eller roteres.
- GitHub Copilot må ikke interagere med bankdata.