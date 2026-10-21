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
const maxAttemptsRaw = Number.parseInt(process.env.DB_WAIT_MAX_ATTEMPTS || '60', 10);
const maxAttempts = Number.isFinite(maxAttemptsRaw) && maxAttemptsRaw > 0 ? maxAttemptsRaw : 60;
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
        process.stderr.write(`Database connection failed with a non-transient error${code ? ` code=${code}` : ''}: ${msg}\n`);
        process.exit(1);
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

configure_keycloak_runtime() {
  if [ "${APP_ROLE:-web}" != "web" ] || [ "${OIDC_DEV_MODE:-false}" = "true" ]; then
    return 0
  fi

  require_web_oidc_env() {
    if [ -z "$2" ]; then
      echo "Missing web OIDC configuration: $1" >&2
      exit 1
    fi
  }

  require_web_oidc_env KEYCLOAK_URL "${KEYCLOAK_URL:-}"
  require_web_oidc_env KEYCLOAK_REALM "${KEYCLOAK_REALM:-}"
  require_web_oidc_env KEYCLOAK_CLIENT_ID "${KEYCLOAK_CLIENT_ID:-}"
  require_web_oidc_env KEYCLOAK_CLIENT_SECRET "${KEYCLOAK_CLIENT_SECRET:-}"
  require_web_oidc_env OIDC_APP_ORIGIN "${OIDC_APP_ORIGIN:-}"

  origin="${OIDC_APP_ORIGIN%/}"
  realm_url="${KEYCLOAK_URL%/}/realms/$KEYCLOAK_REALM"
  export NUXT_OIDC_PROVIDERS_KEYCLOAK_CLIENT_ID="$KEYCLOAK_CLIENT_ID"
  export NUXT_OIDC_PROVIDERS_KEYCLOAK_CLIENT_SECRET="$KEYCLOAK_CLIENT_SECRET"
  export NUXT_OIDC_PROVIDERS_KEYCLOAK_BASE_URL="$realm_url"
  export NUXT_OIDC_PROVIDERS_KEYCLOAK_AUTHORIZATION_URL="$realm_url/protocol/openid-connect/auth"
  export NUXT_OIDC_PROVIDERS_KEYCLOAK_TOKEN_URL="$realm_url/protocol/openid-connect/token"
  export NUXT_OIDC_PROVIDERS_KEYCLOAK_USER_INFO_URL="$realm_url/protocol/openid-connect/userinfo"
  export NUXT_OIDC_PROVIDERS_KEYCLOAK_LOGOUT_URL="$realm_url/protocol/openid-connect/logout"
  export NUXT_OIDC_PROVIDERS_KEYCLOAK_REDIRECT_URI="$origin/auth/keycloak/callback"
  export NUXT_OIDC_PROVIDERS_KEYCLOAK_LOGOUT_REDIRECT_URI="$origin"
  export NUXT_PUBLIC_OIDC_CLIENT_ID="$KEYCLOAK_CLIENT_ID"
  export NUXT_PUBLIC_APP_ORIGIN="$origin"
}

configure_keycloak_runtime

sync_dependencies_if_needed() {
  if [ "$NODE_ENV" = "production" ]; then
    return 0
  fi

  if [ ! -f "package.json" ] || [ ! -f "pnpm-lock.yaml" ]; then
    return 0
  fi

  lock_hash="$(cat package.json pnpm-lock.yaml | sha256sum | awk '{print $1}')"
  state_file="node_modules/.deps-lock-hash"
  current_hash=""

  if [ -f "$state_file" ]; then
    current_hash="$(cat "$state_file" 2>/dev/null || true)"
  fi

  if [ "$lock_hash" = "$current_hash" ]; then
    echo "Dependency sync: lock hash unchanged; skipping pnpm install"
    return 0
  fi

  echo "Dependency sync: lock hash changed; running pnpm install"
  pnpm install --frozen-lockfile --config.confirmModulesPurge=false --config.strict-dep-builds=false --config.verify-deps-before-run=false
  mkdir -p "$(dirname "$state_file")"
  printf '%s' "$lock_hash" > "$state_file"
}

sync_dependencies_if_needed

seed_system_if_enabled() {
  seed_default=1
  if [ "$NODE_ENV" = "production" ]; then
    seed_default=0
  fi

  if [ "${DB_SEED_SYSTEM_ON_START:-$seed_default}" = "1" ]; then
    echo "Seeding system configuration..."
    pnpm db:seed:system
  else
    echo "Skipping system seed (DB_SEED_SYSTEM_ON_START=${DB_SEED_SYSTEM_ON_START:-$seed_default})"
  fi
}

validate_production_oidc_secrets() {
  if [ "$NODE_ENV" != "production" ] || [ "${APP_ROLE:-web}" != "web" ]; then
    return 0
  fi

  node <<'NODE'
const required = [
  'NUXT_OIDC_SESSION_SECRET',
  'NUXT_OIDC_TOKEN_KEY',
  'NUXT_OIDC_AUTH_SESSION_SECRET',
];
const invalid = required.filter((name) => !process.env[name]);

for (const name of ['NUXT_OIDC_SESSION_SECRET', 'NUXT_OIDC_AUTH_SESSION_SECRET']) {
  if (process.env[name] && process.env[name].length < 48) invalid.push(name);
}

const tokenKey = process.env.NUXT_OIDC_TOKEN_KEY;
if (tokenKey) {
  const decoded = Buffer.from(tokenKey, 'base64');
  if (decoded.length !== 32 || decoded.toString('base64') !== tokenKey) {
    invalid.push('NUXT_OIDC_TOKEN_KEY');
  }
}

if (invalid.length) {
  process.stderr.write(`Missing or invalid OIDC secrets: ${[...new Set(invalid)].join(', ')}\n`);
  process.exit(1);
}
NODE
}

if [ "$NODE_ENV" = "production" ] && [ "${DB_RESET_ON_START:-0}" = "1" ]; then
  echo "DB_RESET_ON_START is not allowed in production." >&2
  exit 1
fi

validate_production_oidc_secrets

wait_for_db

if [ "${APP_ROLE:-}" = "db-init" ]; then
  exec "$@"
elif [ "$NODE_ENV" = "production" ]; then
  if [ "${DB_MIGRATE_ON_START:-}" = "1" ]; then
    echo "Running database migrations (production)..."
    pnpm db:migrate
  else
    echo "Skipping migrations (production)"
  fi

  seed_system_if_enabled
else
  echo "Dev boot flags: DB_RESET_ON_START=${DB_RESET_ON_START:-} DB_MIGRATE_ON_START=${DB_MIGRATE_ON_START:-} DB_SEED_SYSTEM_ON_START=${DB_SEED_SYSTEM_ON_START:-1} SEED_DEV_DATA=${SEED_DEV_DATA:-} SEED_DEV_DATA_FORCE=${SEED_DEV_DATA_FORCE:-}"

  if [ "${DB_RESET_ON_START:-}" = "1" ]; then
    echo "Resetting public schema (dev)..."
    pnpm db:reset:public
  fi

  # A reset leaves the schema empty, so migrations must run before any seed step.
  should_migrate="${DB_MIGRATE_ON_START:-0}"
  if [ "${DB_RESET_ON_START:-}" = "1" ] && [ "$should_migrate" != "1" ]; then
    echo "DB_RESET_ON_START=1 requires migrations; forcing DB_MIGRATE_ON_START=1 for this boot"
    should_migrate="1"
  fi

  if [ "$should_migrate" = "1" ]; then
    echo "Running database migrations (dev)..."
    pnpm db:migrate
  else
    echo "Skipping migrations (NODE_ENV=$NODE_ENV)"
  fi

  seed_system_if_enabled

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