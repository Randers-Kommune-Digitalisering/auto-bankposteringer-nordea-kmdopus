#!/bin/sh
set -e

if [ "$NODE_ENV" = "production" ]; then
  echo "Running database migrations (production)..."
  pnpm db:migrate
  echo "Seeding system configuration (production)..."
  pnpm db:seed:system
else
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
    echo "Seeding dev database..."
    pnpm db:seed:dev
  fi
fi

exec "$@"