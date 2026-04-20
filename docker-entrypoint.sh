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
const maxAttempts = 60;
const delayMs = 500;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const client = new Client({ connectionString: url });
      await client.connect();
      await client.query('select 1');
      await client.end();
      process.stdout.write(`Database ready (attempt ${attempt}/${maxAttempts})\n`);
      process.exit(0);
    } catch (err) {
      lastErr = err;
      const code = err && (err.code || err.cause?.code);
      const msg = String(err && (err.message || err));

      // Common startup/transient cases.
      const transient =
        code === '57P03' ||
        code === 'ECONNREFUSED' ||
        msg.includes('the database system is starting up') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('terminating connection due to administrator command');

      process.stdout.write(`DB not ready yet (attempt ${attempt}/${maxAttempts})${code ? ` code=${code}` : ''}\n`);
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

exec "$@"