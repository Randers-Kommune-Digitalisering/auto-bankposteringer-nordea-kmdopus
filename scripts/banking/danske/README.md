# Danske Bank PKI Web Service (PKIWS) — test og production onboarding

Dette dokument beskriver hvordan man:

1) tester Danske Bank PKIWS i *customer test* (dummy/test-mode), og
2) opretter kundecertifikater i *production* til brug i runtime.

Kilde: Danske Bank “PKI Web Services” (v2.9) (PDF-linket I bruger internt).

> Sikkerhed: Scripts her printer nøgler/certifikater til stdout og laver en temp-mappe med nøgle + CSR i `/tmp`. Kør kun fra en sikker terminal og gem outputs i en secret store (ikke i git).

## Begreber: `test` vs `customertest`

I PKIWS-spec’en hedder “test-mode” selve testkonceptet, men den konkrete værdi i XML er:

- `Environment = customertest` (RequestHeader, og for Create/Renew/Revoke også i selve request-elementet)
- `Environment = production` (eller udeladt, hvilket default’er til production)

I vores scripts er `--mode test` kun et alias for `--mode customertest` for ergonomi.

## ID-ordbog (hvad betyder de forskellige ID’er?)

Danske bruger flere forskellige “ID’er” i forskellige lag. Det er vigtigt at skelne mellem:

### PKIWS (certifikat-service)

PKIWS request består af:

- `RequestHeader` (SOAP body header-felter)
- et operation-specifikt request element (fx `CreateCertificateRequest`), som igen har sin egen `CustomerId`, `RequestId`, `Timestamp` osv.

**Felter (PKIWS):**

- `SenderId`
  - “A string identifying the sender of the request.”
  - Kan være identisk med `CustomerId`, men behøver ikke være det.
  - Du får værdien fra Danske.
- `CustomerId`
  - Identificerer kunden/brugeren i PKIWS.
  - Spec’en kræver at `RequestHeader.CustomerId` **matcher** `CreateCertificateRequest.CustomerId`.
  - Det er typisk også denne der er koblet til PIN-udstedelse.

I vores script svarer de til:

- `--pki-sender-id` → `RequestHeader.SenderId`
- `--pki-customer-id` → `RequestHeader.CustomerId` og `CreateCertificateRequest.CustomerId`
- `--pin` / `DANSKE_BANK_PKI_PIN` → `CreateCertificateRequest.PIN`

Bemærk: Danske bruger nogle steder ordet “UserId” i fejltekster, men i spec’en hedder feltet `CustomerId`.

### EDIWS + BXD (fil-service / Secure Envelope)

EDIWS er en separat service med sit eget `RequestHeader` og en base64-encoded BXD “ApplicationRequest”. Her findes typisk:

- `senderId` / `customerId` (EDIWS header og/eller ApplicationRequest)
- `signerId` (i vores kode: TargetId i BXD ApplicationRequest)
- `softwareId` (identifikation af klient/software)

De værdier er ikke det samme som PKIWS `CustomerId` medmindre Danske specifikt siger det.

## Om ReturnCode 20 (production) ved CreateCertificate

PKIWS spec’en beskriver at `ReturnCode = 20` er bevidst “samle-kode” som kan dække mange årsager (fx forkert PIN, PIN brugt/udløbet, ingen PIN tilknyttet, CustomerId findes ikke, CustomerId locked). Derfor kan man **ikke** udlede præcist om det er PIN eller ID der er galt ud fra ReturnCode alene.

Det sikreste næste skridt er at få Danske til at bekræfte:

- Hvilken værdi er **PKIWS CustomerId** (den der er koblet til PIN)?
- Hvilken værdi er **PKIWS SenderId** (og om den skal være identisk med CustomerId)?
- Om PIN’en er aktiv/ubrugt og CustomerId ikke er locked.

Tip: Step 1 (`--only-get-bank-certs`) bruger ingen PIN og er derfor altid den rigtige “sanity check” før man bruger en production PIN.

## Forudsætninger

- `pnpm` installeret (projektets standard)
- `openssl` på PATH (bruges til at generere RSA key + PKCS#10 CSR)
- Netværksadgang til PKIWS endpoint (default i script: `https://businessws.danskebank.com/ra/pkiservice.asmx`)

## 1) (Valgfrit men anbefalet) Verificér Danske root ZIP

Danske publicerer en signeret ZIP med root-certifikat(er). Scriptet verificerer ZIP-signaturen via `jarsigner` og udskriver cert-metadata.

```bash
pnpm banking:danske:verify-root
```

Hvis Danske udgiver en ny root ZIP, skal du pege scriptet på den nye ZIP (via `--zip`) og opdatere den root-serial du bruger i PKIWS kald (se `--bank-root-serial`).

## 2) Hurtig smoke test af PKIWS (doc dummy mode)

PKIWS-spec’en beskriver dummy-adfærd i `customertest`:

- PIN `1234` giver et “gyldigt” svar
- PKCS#10 input der starter med `M` accepteres (vores CSR gør det typisk)
- visse værdier kan give “not authorized” (fx CustomerId `207161`); smoke testen undgår de kendte problemværdier

Kør smoke test (ingen arguments):

```bash
pnpm banking:danske:pkiws:smoke-docs
```

Forventet resultat:

- Printer `=== Danske PKIWS doc smoke test OK ===`
- Printer SHA-256 fingerprint for bankens signing-cert (til pinning)
- Printer SHA-256 fingerprints for de dummy-udstedte kundecertifikater

> Smoke testen er lavet til at bekræfte: XML schema + encryption kan parses af banken, og at vi kan nå endpoint’et.

## 3) Opret kundecertifikater i customertest (med dine egne test-værdier)

Du kan køre med fulde argumenter:

```bash
pnpm banking:danske:pkiws:create-customer-certs -- \
  --mode customertest \
  --pin "<PIN>" \
  --pki-sender-id "<SENDER_ID>" \
  --pki-customer-id "<CUSTOMER_ID>" \
  --subject-cn "Randers Kommune"
```

…eller undgå den lange kommando ved at sætte env vars (scriptet understøtter dette):

```bash
# Foretrukne navne (matcher runtime env-navne)
export DANSKE_BANK_PKI_PIN="<PIN>"
export DANSKE_BANK_PKI_SENDER_ID="<SENDER_ID>"
export DANSKE_BANK_PKI_CUSTOMER_ID="<CUSTOMER_ID>"

# (Kompatibilitet: DANSKE_PKI_PIN / DANSKE_PKI_SENDER_ID / DANSKE_PKI_CUSTOMER_ID accepteres også)

pnpm banking:danske:pkiws:create-customer-certs -- --mode customertest --subject-cn "Randers Kommune"
```

Output (customertest):

- Private key (PEM) + base64
- Signing certificate (PEM) + base64
- Encryption certificate (PEM) + base64
- Bank signing cert fingerprint (SHA-256) til runtime pinning

## 4) Opret kundecertifikater i production (trinvist og sikkert)

**Vigtigt:** I production udsteder PKIWS *rigtige* certifikater. En gyldig PIN kan blive forbrugt, og Danske kan returnere fejl som “PIN has already been used”, “PIN has expired” eller locke CustomerId.

For at gøre det trinvist har scriptet en read-only step, og det kræver en eksplicit bekræftelse før udstedelse i production.

### 4A) Step 1 (read-only): GetBankCertificate i production

Denne del bruger **ingen PIN** og opretter **ingen** kundecertifikater. Den er primært til at bekræfte netværk + root-serial + at vi kan hente bankens signing/encryption cert.

```bash
pnpm banking:danske:pkiws:create-customer-certs -- \
  --mode production \
  --pki-sender-id "<PROD_SENDER_ID>" \
  --pki-customer-id "<PROD_CUSTOMER_ID>" \
  --only-get-bank-certs
```

### 4B) Step 2 (udstedelse): CreateCertificate i production

Når I er klar til at gemme outputs i jeres secret store, kør udstedelsen. Dette kræver `--confirm-production`.

```bash
pnpm banking:danske:pkiws:create-customer-certs -- \
  --mode production \
  --confirm-production \
  --pin "<PROD_PIN>" \
  --pki-sender-id "<PROD_SENDER_ID>" \
  --pki-customer-id "<PROD_CUSTOMER_ID>" \
  --subject-cn "Randers Kommune"
```

Alternativt via env vars (for at undgå meget lang kommando):

```bash
export DANSKE_BANK_PKI_PIN="<PROD_PIN>"
export DANSKE_BANK_PKI_SENDER_ID="<PROD_SENDER_ID>"
export DANSKE_BANK_PKI_CUSTOMER_ID="<PROD_CUSTOMER_ID>"

pnpm banking:danske:pkiws:create-customer-certs -- --mode production --confirm-production --subject-cn "Randers Kommune"
```

### Hvad skal gemmes (production)

Scriptet printer “Suggested env vars” til runtime. De vigtigste er:

- `DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM_B64`
- `DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM_B64`
- `DANSKE_BANK_TRUSTED_SIGNING_CERT_SHA256` (pinning af bankens signing cert fra GetBankCertificate-response)

Gem dem i jeres secret store (Azure Key Vault, GitHub secrets, Kubernetes secrets, osv.).

## Noter om nøgler/certifikater (vigtigt)

PKIWS beskriver typisk separate certifikater til signing og encryption. Vores script genererer **én RSA-nøgle** og genbruger den til begge CSRs for at holde runtime simpel (én private key at opbevare).

Hvis Danske kræver separate nøgler/certifikater (eller hvis I vil følge best practice strikt), skal scriptet udvides til at generere to keys og to CSRs.

## Fejlfinding

- `PKIWS fault ... wrong PIN / PIN has already been used / PIN has expired`:
  - Forventet i production hvis PIN håndteres forkert. Stop og afklar med Danske.
- HTTP-fejl fra `.asmx`:
  - Tjek netværk/allowlisting/proxy.
- Tidsfejl / “Timestamp too old/future”:
  - Serveren skal have korrekt tid (UTC). Scriptet bruger `new Date().toISOString()`.

## Relaterede scripts

- `pnpm banking:danske:verify-root` — verificér Danske root ZIP
- `pnpm banking:danske:pkiws:smoke-docs` — hurtig dummy-test i `customertest`
- `pnpm banking:danske:pkiws:create-customer-certs` — opret kundecerts (customertest/production)
