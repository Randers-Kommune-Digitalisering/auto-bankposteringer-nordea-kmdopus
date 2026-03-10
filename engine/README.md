# Engine (modulær monolit)

Denne mappe beskriver systemets **bounded contexts** som interne moduler i én deployable.

Hvorfor hedder den `engine/`?
- I Nuxt er `modules/` reserveret til *Nuxt modules* (plugins der installeres ved build).
- For at undgå konflikt bruger vi derfor en neutral mappe til domæne-/applikationsmoduler.

Mål:
- Skarp opdeling mellem (1) bank-ingestion, (2) matching og (3) ERP-integration.
- Stateless runtime: alt arbejde kan genafspilles ud fra DB-state.
- Side-effekter (ERP upload, notifikationer) kører via DB-drevne `job` + `outbox` tabeller.

Strukturprincip:
- `domain/`: typer + deterministisk logik (ingen IO)
- `handlers/`: orkestrering (commands/"use-cases")
- `ports/`: interfaces + DTOs (kontrakter som `handlers/` afhænger af)
- `infrastructure/`: IO-implementeringer (DB/HTTP/SFTP/mail)

Navngivning:
- `handlers/` er *ikke* HTTP-route handlers. Det er applikationslagets use-case handlers
	(fx “ingest X”, “match Y”, “submit posting”).
- `infrastructure/adapters/` bruges når vi har flere konkrete implementeringer af en port
	(fx ERP leverandører som KMD).

I første iteration er modulerne tynde wrappers omkring eksisterende kode i `services/`.
Refactor kan gradvist flytte logik ind i modulerne uden at ændre API-kontrakter.
