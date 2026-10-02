# syntax=docker/dockerfile:1.7

# -------------------------
# Base
# -------------------------
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN corepack enable

# -------------------------
# Dependencies
# -------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY patches ./patches
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
	pnpm install --frozen-lockfile --config.strict-dep-builds=false

# -------------------------
# Dev
# -------------------------
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=4096
EXPOSE 3000
CMD ["pnpm", "dev"]

# -------------------------
# Build
# -------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV APP_ROLE=web \
	DATABASE_URL=postgres://build:build@localhost:5432/build \
	ERP_SUPPLIER=kmd \
	ERP_BOOKING_PERIOD_CLOSE_DAY=7 \
	ERP_ERROR_ACCOUNT=95999999 \
	ERP_ACTIVE_INTEGRATION=false \
	ERP_PROD_ENVIRONMENT=P04 \
	ERP_MUNICIPALITY_CODE=000 \
	ERP_COMP_CODE=0000 \
	ERP_INTEGRATION_ID=BUILD \
	ERP_INTEGRATION_FILENAME_MASK=ZFIR_{municipalityCode}_{integrationId}_{docDate}_{docTime}.xml
RUN pnpm build

# -------------------------
# Role runtime dependencies (worker/scheduler)
# -------------------------
FROM deps AS role-deps
RUN pnpm prune --prod

# -------------------------
# Role runtime (worker/scheduler)
# -------------------------
FROM node:22-bookworm-slim AS role-runtime
WORKDIR /app
ENV NODE_ENV=production

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && corepack enable

COPY --from=role-deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml tsconfig.scripts.json ./
COPY app/lib ./app/lib
COPY engine ./engine
COPY server/tasks ./server/tasks
COPY server/utils ./server/utils
COPY scripts/runtime ./scripts/runtime
COPY utils ./utils
COPY resources ./resources

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "node_modules/tsx/dist/cli.mjs", "--tsconfig", "tsconfig.scripts.json", "scripts/runtime/worker.ts"]

# -------------------------
# Database init runtime
# -------------------------
FROM role-runtime AS db-init
ENV APP_ROLE=db-init
COPY drizzle.config.ts ./
COPY drizzle ./drizzle
COPY scripts/db/seed-system.ts ./scripts/db/seed-system.ts
COPY engine/erp-integration/domain ./engine/erp-integration/domain
COPY engine/erp-integration/registry.ts ./engine/erp-integration/registry.ts
COPY app/lib/db ./app/lib/db
COPY app/lib/env ./app/lib/env

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["sh", "-c", "node_modules/.bin/drizzle-kit migrate --config drizzle.config.ts && node node_modules/tsx/dist/cli.mjs scripts/db/seed-system.ts"]

# -------------------------
# Production
# -------------------------
FROM node:22-bookworm-slim AS prod
WORKDIR /app
ENV NODE_ENV=production

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY --from=build /app/.output ./.output
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY patches ./patches
COPY --from=role-deps /app/node_modules ./node_modules

EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
