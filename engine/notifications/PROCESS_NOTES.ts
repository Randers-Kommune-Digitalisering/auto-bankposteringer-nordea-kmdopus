/**
 * Notifications (mail/SMS/etc.) - proces-noter (ikke implementeret endnu)
 *
 * Mål:
 * - Underret (typisk e-mail) når en banktransaktion bliver bogført i ERP.
 * - Køre stateless og retry-sikkert via outbox.
 *
 * Foreslået flow:
 * 1) Matching/manuel bogføring markerer transaktionen som 'bogført' i DB.
 * 2) I samme DB-transaktion oprettes en outbox-record:
 *    - topic: 'notification.email.requested'
 *    - dedupeKey: fx `email:booking:${transactionId}`
 *    - payload: { to, templateId, variables, transactionId, runId, requestId? }
 * 3) Worker plukker outbox-records og sender e-mail via valgt adapter.
 * 4) Resultat (messageId, provider response) gemmes i outbox.payload.result.
 *
 * Idempotens:
 * - Brug dedupeKey til at undgå dubletter.
 * - Adapteren bør kunne håndtere retries uden at sende flere gange,
 *   evt. ved at gemme provider messageId i DB.
 */
