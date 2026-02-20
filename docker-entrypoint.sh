#!/bin/sh
set -e

if [ "$NODE_ENV" = "production" ]; then
  echo "Running database migrations..."
  pnpm db:migrate
else
  echo "Skipping migrations (NODE_ENV=$NODE_ENV)"
fi

exec "$@"