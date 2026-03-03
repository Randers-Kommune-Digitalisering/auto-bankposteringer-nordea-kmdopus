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
- `application/`: use-cases / commands (orkestrering)
- `infrastructure/`: adapters til DB/SFTP/HTTP/mail

I første iteration er modulerne tynde wrappers omkring eksisterende kode i `services/`.
Refactor kan gradvist flytte logik ind i modulerne uden at ændre API-kontrakter.
