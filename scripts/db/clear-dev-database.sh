#!/bin/sh

set -eu

echo "Clearing development database schemas..."

psql \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set ON_ERROR_STOP=1 \
  <<'SQL'
DROP SCHEMA IF EXISTS drizzle CASCADE;
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
SQL

echo "Development database cleared."