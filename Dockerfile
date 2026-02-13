# -------------------------
# Base
# -------------------------
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

# -------------------------
# Dependencies
# -------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# -------------------------
# Dev
# -------------------------
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

# -------------------------
# Build
# -------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# -------------------------
# Production
# -------------------------
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/.output ./.output
COPY package.json ./

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
