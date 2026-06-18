#!/bin/sh
set -e

wait_for_db() {
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "DATABASE_URL not set; skipping DB wait"
    return 0
  fi

  echo "Waiting for database to accept connections..."

  # Use Node + pg (already a dependency) to reliably detect readiness.
  node <<'NODE'
const { Client } = require('pg');

const url = process.env.DATABASE_URL;
const maxAttemptsRaw = Number.parseInt(process.env.DB_WAIT_MAX_ATTEMPTS || '0', 10);
const maxAttempts = Number.isFinite(maxAttemptsRaw) && maxAttemptsRaw > 0 ? maxAttemptsRaw : 0;
const delayMsRaw = Number.parseInt(process.env.DB_WAIT_RETRY_MS || '1000', 10);
const delayMs = Number.isFinite(delayMsRaw) && delayMsRaw > 0 ? delayMsRaw : 1000;
const maxAttemptsLabel = maxAttempts > 0 ? String(maxAttempts) : '∞';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  let lastErr = null;
  let attempt = 0;
  while (maxAttempts === 0 || attempt < maxAttempts) {
    attempt += 1;
    try {
      const client = new Client({ connectionString: url });
      await client.connect();
      await client.query('select 1');
      await client.end();
      process.stdout.write(`Database ready (attempt ${attempt}/${maxAttemptsLabel})\n`);
      process.exit(0);
    } catch (err) {
      lastErr = err;
      const code = err && (err.code || err.cause?.code);
      const msg = String(err && (err.message || err));

      // Common startup/transient cases.
      const transient =
        code === '57P03' ||
        code === 'ECONNREFUSED' ||
        code === 'ENOTFOUND' ||
        msg.includes('the database system is starting up') ||
        msg.includes('ENOTFOUND') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('terminating connection due to administrator command');

      process.stdout.write(`DB not ready yet (attempt ${attempt}/${maxAttemptsLabel})${code ? ` code=${code}` : ''}\n`);
      if (!transient) {
        // Still retry a few times; network/DNS can be flaky during compose boot.
      }
      await sleep(delayMs);
    }
  }

  process.stderr.write('Database did not become ready in time.\n');
  if (lastErr) process.stderr.write(String(lastErr && (lastErr.stack || lastErr)) + '\n');
  process.exit(1);
})();
NODE
}

configure_oidc_origin() {
  if [ -n "${OIDC_APP_ORIGIN:-}" ]; then
    return 0
  fi

  if [ -n "${CODESPACE_NAME:-}" ] && [ -n "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" ]; then
    OIDC_APP_ORIGIN="https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    export OIDC_APP_ORIGIN
    echo "Derived OIDC_APP_ORIGIN for Codespaces: ${OIDC_APP_ORIGIN}"

    if [ -z "${OIDC_CORS_ALLOWED_ORIGINS:-}" ]; then
      OIDC_CORS_ALLOWED_ORIGINS="${OIDC_APP_ORIGIN}"
      export OIDC_CORS_ALLOWED_ORIGINS
      echo "Derived OIDC_CORS_ALLOWED_ORIGINS from OIDC_APP_ORIGIN"
    fi
  fi
}

configure_oidc_origin

if [ "$NODE_ENV" = "production" ]; then
  if [ "${DB_MIGRATE_ON_START:-}" = "1" ]; then
    echo "Running database migrations (production)..."
    pnpm db:migrate
  else
    echo "Skipping migrations (production)"
  fi

  if [ "${DB_SEED_SYSTEM_ON_START:-}" = "1" ]; then
    echo "Seeding system configuration (production)..."
    pnpm db:seed:system
  else
    echo "Skipping system seed (production)"
  fi
else
  echo "Dev boot flags: DB_RESET_ON_START=${DB_RESET_ON_START:-} DB_MIGRATE_ON_START=${DB_MIGRATE_ON_START:-} SEED_DEV_DATA=${SEED_DEV_DATA:-} SEED_DEV_DATA_FORCE=${SEED_DEV_DATA_FORCE:-}"

  wait_for_db

  if [ "${DB_RESET_ON_START:-}" = "1" ]; then
    echo "Resetting public schema (dev)..."
    pnpm db:reset:public
  fi

  if [ "${DB_MIGRATE_ON_START:-}" = "1" ]; then
    echo "Running database migrations (dev)..."
    pnpm db:migrate
  else
    echo "Skipping migrations (NODE_ENV=$NODE_ENV)"
  fi

  if [ "${SEED_DEV_DATA:-}" = "1" ]; then
    if [ "${DB_RESET_ON_START:-}" = "1" ] || [ "${SEED_DEV_DATA_FORCE:-}" = "1" ]; then
      echo "Seeding dev database..."
      pnpm db:seed:dev
    else
      echo "Skipping dev seed (SEED_DEV_DATA=1 but DB_RESET_ON_START!=1). Set SEED_DEV_DATA_FORCE=1 to force seeding without reset."
    fi
  fi
fi

# Temporary compatibility switch for bank response decryption using RSA v1.5.
# Enabled only when explicitly requested in local/test environments.
if [ "${NODE_SECURITY_REVERT_CVE_2023_46809:-0}" = "1" ] && [ "${1:-}" = "pnpm" ]; then
  shift
  set -- node --security-revert=CVE-2023-46809 "$(command -v pnpm)" "$@"
fi

exec "$@"