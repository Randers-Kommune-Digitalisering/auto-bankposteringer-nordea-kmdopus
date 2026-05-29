# Certificate Enrollment Runbook (Cross-vendor)

This runbook describes a secure, repeatable certificate enrollment workflow across bank vendors.

## Scope and entrypoint

Use the provider-dispatch command as the common entrypoint:

```bash
pnpm banking:pki:create-customer-certs -- --provider <danske|nordea> <provider-options>
```

This keeps operational behavior consistent while allowing vendor-specific protocol differences.

## Shared security model

Apply these rules regardless of vendor:

- Never commit generated key/certificate artifacts.
- Prefer file-based secret input over CLI plaintext when possible.
- Use workspace-local `.secrets/` paths and restrictive permissions.
- Avoid printing key/certificate material to terminal unless explicitly required.

Recommended preparation:

```bash
mkdir -p .secrets/certificate-enrollment
chmod 700 .secrets .secrets/certificate-enrollment
```

## Provider behavior matrix

- Danske:
  - Enrollment command is implemented and routed via provider dispatch.
  - Current script behavior prints generated secret material to stdout (run in trusted terminal).
- Nordea:
  - Enrollment command is implemented and routed via provider dispatch.
  - Default behavior writes sensitive output to files and does not print secrets unless `--print-secrets` is set.

## Danske Bank workflow

Provider help:

```bash
pnpm banking:pki:create-customer-certs -- --provider danske --help
```

Example (customer test mode):

```bash
pnpm banking:pki:create-customer-certs -- \
  --provider danske \
  --mode customertest \
  --pin "<PIN_FROM_DANSKE>" \
  --pki-sender-id "<PKI_SENDER_ID>" \
  --pki-customer-id "<PKI_CUSTOMER_ID>" \
  --subject-cn "Randers Kommune"
```

Operational notes:

- Use environment variables for PIN/IDs when possible (`DANSKE_BANK_PKI_PIN`, `DANSKE_BANK_PKI_SENDER_ID`, `DANSKE_BANK_PKI_CUSTOMER_ID`).
- Production issuance requires explicit confirmation in the script (`--confirm-production`).
- Treat terminal output as sensitive and move values to approved secret storage immediately.

## Nordea workflow

Provider help:

```bash
pnpm banking:pki:create-customer-certs -- --provider nordea --help
```

Recommended live command:

```bash
mkdir -p .secrets/nordea-certificate/current
chmod 700 .secrets/nordea-certificate .secrets/nordea-certificate/current

pnpm banking:pki:create-customer-certs -- \
  --provider nordea \
  --activation-code-file .secrets/nordea-certificate/activation-code.txt \
  --customer-id <CUSTOMER_ID> \
  --software-id FOBI_2.0 \
  --subject-serial-number <SIGNER_ID> \
  --subject-country-code DK \
  --subject-cn "Randers Kommune" \
  --out-dir .secrets/nordea-certificate/current
```

Optional if terminal output is required:

```bash
--print-secrets
```

Artifacts written by Nordea flow (live call):

- `private-key.pem`
- `request.csr.pem`
- `request.csr.der`
- `certificate-service-response.xml`
- `cert-application-response.xml` (when present)
- `certificate.pem`
- `certificate.sha256`
- `env.suggested`

Recover mode (no live call):

```bash
pnpm -s tsx scripts/banking/nordea/certificate-service-create-certificate.ts \
  --recover-response-file <path/to/response.xml> \
  --recover-private-key-path <path/to/private-key.pem> \
  --out-dir .secrets/nordea-certificate/recovered
```

Nordea operational notes:

- A successful response is typically `ResponseCode=00` and `ResponseText=OK`.
- Certificate payload may be returned under `Certificates/Certificate/Certificate`.
- Activation codes are one-time and should be treated as consumed after successful issuance.

## Onboarding a future vendor

When adding a new provider:

- Add a provider script under `scripts/banking/<vendor>/`.
- Wire provider dispatch in `scripts/banking/pki/create-customer-certs.ts`.
- Keep deterministic output contracts (key/cert/env artifacts and explicit logs).
- Default to secure output handling (file-based secrets, no terminal secret output by default).
- Update this runbook with provider-specific required inputs, safety notes, and example commands.
