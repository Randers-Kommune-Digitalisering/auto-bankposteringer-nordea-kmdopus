/**
 * Komponent-opdeling (modulær monolit)
 *
 * 1) Banking ingestion & normalisering
 *    - Hent bankdata (ekstern IO)
 *    - Persistér rå payload + kanoniske transaction rows
 *    - Ingen ERP/matching afhængighed
 *
 * 2) Matching mellem banktransaktioner
 *    - Deterministisk regel-evaluering
 *    - Persistér hvilken regelversion der blev anvendt + processing status
 *    - Må kun afhænge af DB-state (auditerbart)
 *
 * 3) ERP integration
 *    - Afsend payloads til ERP + indlæs retursvar
 *    - Side-effekter går via outbox/job for retry og skalering
 *
 * Satellitter:
 * - Notifications: underretninger (outbox)
 * - Payroll: løndata til matching/kontering (job + DB-normalisering)
 */
