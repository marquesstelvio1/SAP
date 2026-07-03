# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT="0"

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING="1"

WORKDIR /app

FROM base AS deps

COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/observability/package.json packages/observability/package.json
COPY packages/rpc/package.json packages/rpc/package.json
COPY packages/testing/package.json packages/testing/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN --mount=type=cache,id=saptm-pnpm-store,target=/pnpm/store,sharing=shared \
  pnpm fetch --frozen-lockfile --store-dir /pnpm/store

FROM deps AS builder

COPY . .
COPY .docker/prisma-client /tmp/prisma-client

RUN --mount=type=cache,id=saptm-pnpm-store,target=/pnpm/store,sharing=shared \
  pnpm install --frozen-lockfile --offline --store-dir /pnpm/store
RUN prisma_package="$(find /app/node_modules/.pnpm -path '*/node_modules/@prisma/client' -type d -print -quit)" && \
  prisma_client="$(dirname "$(dirname "$prisma_package")")/.prisma/client" && \
  rm -rf "$prisma_client" && \
  mkdir -p "$prisma_client" && \
  cp -R /tmp/prisma-client/. "$prisma_client/"
RUN pnpm --filter @saptm/api... build

FROM node:22-alpine AS runner

ENV NODE_ENV="production"
ENV API_PORT="4000"

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/auth/package.json ./packages/auth/package.json
COPY --from=builder /app/packages/auth/dist ./packages/auth/dist
COPY --from=builder /app/packages/auth/node_modules ./packages/auth/node_modules
COPY --from=builder /app/packages/config/package.json ./packages/config/package.json
COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/packages/config/node_modules ./packages/config/node_modules
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=builder /app/packages/observability/package.json ./packages/observability/package.json
COPY --from=builder /app/packages/observability/dist ./packages/observability/dist
COPY --from=builder /app/packages/observability/node_modules ./packages/observability/node_modules
COPY --from=builder /app/packages/rpc/package.json ./packages/rpc/package.json
COPY --from=builder /app/packages/rpc/dist ./packages/rpc/dist
COPY --from=builder /app/packages/rpc/node_modules ./packages/rpc/node_modules
COPY --from=builder /app/packages/types/package.json ./packages/types/package.json
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/node_modules ./packages/types/node_modules

WORKDIR /app/apps/api

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "const port=process.env.API_PORT||4000; fetch('http://127.0.0.1:'+port+'/health/live').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))"

RUN printf '#!/bin/sh\n\
echo "[migrate] Applying database migrations..."\n\
cd /app/packages/database && npx prisma migrate deploy --schema=prisma/schema.prisma || echo "[migrate] WARNING: migration failed, continuing anyway"\n\
\n\
if [ "${RUN_DB_SEED}" = "true" ]; then\n\
  echo "[seed] Running database seed..."\n\
  npx tsx prisma/seed-users.ts 2>/dev/null || echo "[seed] WARNING: users seed skipped (not critical)"\n\
  echo "[seed] Done."\n\
fi\n\
\n\
echo "[start] Starting API server..."\n\
cd /app/apps/api && node dist/main.js\n' > /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]
