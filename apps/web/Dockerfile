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

ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ARG NEXT_PUBLIC_API_URL="http://localhost:4000"

ENV NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL"
ENV NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL"
ENV NEXT_TELEMETRY_DISABLED="1"

COPY . .
COPY .docker/prisma-client /tmp/prisma-client

RUN --mount=type=cache,id=saptm-pnpm-store,target=/pnpm/store,sharing=shared \
  pnpm install --frozen-lockfile --offline --store-dir /pnpm/store
RUN prisma_package="$(find /app/node_modules/.pnpm -path '*/node_modules/@prisma/client' -type d -print -quit)" && \
  prisma_client="$(dirname "$(dirname "$prisma_package")")/.prisma/client" && \
  rm -rf "$prisma_client" && \
  mkdir -p "$prisma_client" && \
  cp -R /tmp/prisma-client/. "$prisma_client/"
RUN NEXT_DISABLE_TURBOPACK=1 pnpm --filter @saptm/web... build

FROM node:22-alpine AS runner

ENV NODE_ENV="production"
ENV HOSTNAME="0.0.0.0"
ENV PORT="3000"

WORKDIR /app

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "const port=process.env.PORT||3000; fetch('http://127.0.0.1:'+port+'/api/health').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/web/server.js"]
