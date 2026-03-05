/**
 * Payroll integration - proces-noter (ikke implementeret endnu)
 *
 * Mål:
 * - Anvende data fra lønsystemer til at hjælpe matching/kontering.
 * - Understøtte flere kilder (SFTP/CSV, API, fil-upload) uden at koble domænet
 *   til en specifik leverandør.
 *
 * Foreslået domæne-model (DB-drevet):
 * - payroll_source: konfiguration pr. leverandør/kilde
 * - payroll_import: en indlæsning (batch) med status
 * - payroll_entry: normaliserede lønlinjer
 * - payroll_link: relation mellem payroll_entry og banktransaktion (hvis fundet)
 *
 * Foreslået flow:
 * 1) Et job 'payroll.ingest' henter/indlæser og normaliserer løndata til DB.
 * 2) Matching kan udvide regelmotoren med lookup i payroll_entry
 *    (stadig deterministisk: kun DB-state + regelversion).
 * 3) Når en løn-post er brugt til bogføring, gem audit:
 *    payroll_link (hvilken lønlinje, hvilken transaktion, hvilken regelversion).
 */
