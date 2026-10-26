# Production Deployment Runbook

This runbook describes the deployment contract implemented in this repository. Kubernetes manifests, Helm values, ingress configuration, and production secrets are owned by the deployment repository/platform team and are not present here.

## Deployment model

The application is split into three runtime roles and one release-time database job:

| Workload | Image target | `APP_ROLE` | Network purpose |
| --- | --- | --- | --- |
| Web/API | `prod` | `web` | Receives HTTPS through the ingress; connects to PostgreSQL and the configured OIDC provider |
| Worker | `role-runtime` | `worker` | No public ingress; connects to PostgreSQL, bank endpoints, and ERP SFTP |
| Scheduler | `role-runtime` | `scheduler` | No public ingress; enqueues work in PostgreSQL |
| Database init | `db-init` | `db-init` | One-shot job; connects to PostgreSQL to migrate and seed |

The worker and scheduler use the same runtime image with different commands. The role-runtime image's default command starts the worker; the scheduler deployment must override it with `scripts/runtime/scheduler.ts`.

Only the web workload should be exposed through a public Ingress. The worker has a separate internal `ClusterIP` Service on TCP 3001 for `/internal/status/config` and `/internal/status/validate`; it must not have public ingress. NetworkPolicies must allow this port only from the web pods and allow web egress only to the worker status port. The endpoint returns configuration presence and certificate metadata, never secret values. Worker-initiated SFTP is egress: allow the worker to reach the supplier's SFTP endpoint, normally TCP 22, and allow established response traffic. Confirm the endpoint, port, DNS behavior, and stable outbound/NAT IP with the supplier. Bank API/SOAP destinations may also require worker egress, normally over HTTPS.

## Images and CI

`.github/workflows/tests.yml` runs tests on branch pushes, pull requests, and manual dispatch. After tests pass, non-PR runs build and push these images to GHCR from the same commit:

```text
<repository>:<commit-sha>-web
<repository>:<commit-sha>-runtime
<repository>:<commit-sha>-db-init
```

Pull requests run tests but do not publish images. A push to any branch can publish images; production should use an approved commit SHA and not a branch name or mutable tag. The workflow publishes images but does not deploy them to a cluster.

Before rollout, confirm that the packages are visible to the cluster's image-pull identity and record the exact commit SHA (prefer image digests if the deployment tooling supports them).

## Release sequence

1. Select the commit to release and verify its test workflow completed successfully.
2. Confirm the three SHA-tagged images exist in GHCR.
3. Confirm the target PostgreSQL database, backup/restore status, and migration compatibility for this release.
4. Create/run a Kubernetes Job using the matching `db-init` image. Provide:
   - `DATABASE_URL` from a Kubernetes Secret
   - `ERP_SUPPLIER`
   - `ERP_BOOKING_PERIOD_CLOSE_DAY`
   - `NODE_ENV=production`
5. Wait for the Job to complete successfully. A failed migration or system seed blocks the application rollout. Do not retry by resetting the schema.
6. Roll out web using the matching `-web` image and `APP_ROLE=web`.
7. Roll out scheduler and worker using the matching `-runtime` image, setting their respective roles and commands.
8. Verify readiness, login/OIDC, database access, a controlled worker task, SFTP connectivity, logs, and alerts before enabling scheduled production work.

The `db-init` image runs database readiness checks, `drizzle-kit migrate`, `db:seed:system`, and `db:import:transaction-code-catalog`. The catalog import requires the versioned Nordea and Danske Bank CSVs included in the image, validates both before writing, and fails the job if either source is missing or invalid. Import is transactional and idempotent; removed source rows become inactive. The job does not run the destructive development reset. It only needs database and system-seed configuration; do not give it bank, OIDC, or SFTP credentials.

Runtime web, scheduler, and worker workloads must not migrate or seed on startup. Set `DB_MIGRATE_ON_START=0` and `DB_SEED_SYSTEM_ON_START=0` explicitly for them. `DB_RESET_ON_START=1` is rejected in production. `DB_MIGRATE_ON_START=1` is an emergency compatibility switch, not the normal rollout mechanism.

## Migration policy: production blocker

The current repository describes a single-baseline workflow: regenerate `drizzle/0000_baseline.sql` instead of adding incremental migration files. This is safe for creating a fresh database, but it is not a safe recurring production upgrade process by itself:

- Keeping the already-applied baseline timestamp means Drizzle does not apply changes in the regenerated SQL.
- Giving the regenerated baseline a newer timestamp makes Drizzle attempt its full `CREATE` statements against the existing schema, which will normally fail on existing objects.

Before the first production schema change after initial installation, agree on and test a forward migration strategy for existing tenant databases. Do not delete/recreate production schemas or use `DB_RESET_ON_START` to upgrade. Schema rollback is not automatic; prefer forward fixes, and keep a verified backup/restore plan for each release.

For a first deployment to a new, empty PostgreSQL database, the baseline can initialize the schema. Use synthetic or sanitized data in staging to test later upgrades; never use production financial data for local performance tests.

## Configuration and secrets

The application uses PostgreSQL. Configure a scoped `DATABASE_URL` for runtime and init workloads. If it is omitted, the application constructs it from `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`; `POSTGRES_HOST` defaults to `db` and `POSTGRES_PORT` defaults to `5432`. For deployments, prefer an explicit `DATABASE_URL` so the database endpoint is unambiguous. Application configuration also requires ERP values such as `ERP_SUPPLIER`, `ERP_BOOKING_PERIOD_CLOSE_DAY`, `ERP_ERROR_ACCOUNT`, `ERP_PROD_ENVIRONMENT`, `ERP_MUNICIPALITY_CODE`, `ERP_COMP_CODE`, `ERP_INTEGRATION_ID`, and `ERP_INTEGRATION_FILENAME_MASK`.

Provide OIDC, bank, and SFTP secrets only to workloads that need them. The worker needs credentials for the enabled bank adapters and ERP transport; web and scheduler should receive only their required configuration. Store secrets in the approved secret manager/Kubernetes Secret integration, never in image build arguments or image layers.

Set `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, and `OIDC_APP_ORIGIN` on the web pod, not during image build. The URL is the public Keycloak base before `/realms/<realm>`; the origin is the external HTTPS URL without a path. At container startup the web entrypoint validates these values and derives the Nuxt provider realm base URL, endpoints, callback URL (`<OIDC_APP_ORIGIN>/auth/keycloak/callback`), and public client ID as runtime environment variables. The realm base URL is required for callback discovery at `<KEYCLOAK_URL>/realms/<KEYCLOAK_REALM>/.well-known/openid-configuration`. Source `KEYCLOAK_CLIENT_SECRET` from a web-only Kubernetes Secret, never Helm plaintext values or image build arguments. Align the Keycloak client redirect allowlist with the callback URL.

If staging is intentionally connected to Nordea's production endpoint, treat its database and logs as containing real financial data. Use a dedicated, least-privilege worker secret, restrict staging access, confirm encryption at rest and in transit, and set a short explicit `DATA_RETENTION_DAYS`. Keep the KMD ERP environment pointed at staging. The staging deployment values enable the daily bank-ingestion schedule against Nordea production and set retention to 7 days; confirm the live-data flow is approved and verify retention cleanup is running before enabling it.

Generate the three Nuxt OIDC secrets locally with `pnpm auth:oidc:generate-secrets`. By default, the command prints `KEY=value` assignments to an interactive terminal and refuses to print from CI or another non-interactive stream. An optional `--output-file .secrets/oidc/<name>.env` writes a new file with mode `0600` and refuses to overwrite an existing file. Transfer the values directly into the approved secret manager; do not commit the output or include it in build logs. `NUXT_OIDC_SESSION_SECRET` and `NUXT_OIDC_AUTH_SESSION_SECRET` must each be at least 48 characters; `NUXT_OIDC_TOKEN_KEY` must decode from Base64 to exactly 32 bytes. Use the same values across web replicas within one environment, and different values between environments.

`nuxt-oidc-auth` fallback-secret generation is disabled. Production web startup fails before accepting traffic if any OIDC secret is absent or malformed. Worker, scheduler, and `db-init` do not need these secrets.

## Ingress, egress, and probes

- Ingress: browser/API HTTPS traffic to web only; configure TLS and the production hostname at the cluster ingress.
- Egress: web to PostgreSQL and OIDC as required, plus the worker status port; scheduler to PostgreSQL; worker to PostgreSQL, bank endpoints, and ERP SFTP; db-init to PostgreSQL. Worker ingress on TCP 3001 is allowed only from web pods.
- Use NetworkPolicies/firewall rules to enforce the minimum destinations. If an external partner allowlists source IPs, route worker egress through a stable NAT/egress gateway.
- HSTS belongs at the TLS-terminating ingress. The application currently emits CSP in `Report-Only`; validate OIDC redirects, scripts, styles, and assets before enforcing a policy.
- `/api/health` is a lightweight HTTP health endpoint, not a schema-migration gate. Deployment ordering must wait for successful `db-init` separately.

## Rollback and operations

- Keep the previous approved image SHA available.
- If `db-init` fails, stop the rollout and inspect the migration/seed error; existing runtime pods may continue running if the deployment system has not replaced them.
- Only roll back application images when the older application is compatible with the schema already applied. Otherwise use a tested forward fix or restore the database from backup.
- Monitor database-init Job completion, web readiness, worker status endpoint availability/restarts, pending/failed jobs, ERP outbox retries, bank ingestion, and SFTP connectivity.
- Set ingress/WAF rate limits before exposing the web service. Do not implement per-pod in-memory limits for a horizontally scaled deployment.

## Deployment-repository checklist

- [ ] The application has a dedicated PostgreSQL database and database user.
- [ ] A one-shot `db-init` Job uses the same commit SHA as the runtime images and gates their rollout.
- [ ] A production migration/upgrade policy has been agreed and tested against an existing schema.
- [ ] Web, worker, and scheduler are separate workloads with least-privilege secrets and resources.
- [ ] Only web has public ingress; TLS, OIDC callback/logout URLs, and ingress rate limits are configured.
- [ ] Worker egress to bank and ERP endpoints is allowed and uses the expected stable source IP.
- [ ] PostgreSQL backups, restore procedure, alerts, and rollback/forward-fix ownership are documented.
