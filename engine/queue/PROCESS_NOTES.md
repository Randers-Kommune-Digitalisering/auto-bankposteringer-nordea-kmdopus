# Queue/Worker (job + outbox)

Dette modul beskriver den DB-drevne kø, som gør systemet stateless og retry-sikkert.

## Begreber

### Job
- Et `job` er et stykke arbejde der skal udføres senere (eller nu), fx:
  - `banking.ingest`
  - `erp.ingestResponses`
  - `payroll.ingest`

Jobs er gode til orkestrering og periodiske processer.

### Outbox
- `outbox` er en “send senere”-bakke til side-effekter, fx:
  - ERP upload af XML
  - E-mail notifikation

Outbox er god til integrations-IO og garanterer, at side-effekten ikke “forsvinder”, fordi den først registreres i DB.

## Hvorfor begge?
- `job` = planlagt arbejde / use-cases
- `outbox` = konkrete integration-events / IO

I praksis kan et job generere outbox-items, og worker’en håndterer begge.

## Drift
- Worker’en kan køre på flere instanser samtidigt.
- Claiming sker med DB-lås (`FOR UPDATE SKIP LOCKED`), så flere workers ikke tager samme item.
- Retry styres af `run_at`/`next_attempt_at` og `attempts/max_attempts`.
