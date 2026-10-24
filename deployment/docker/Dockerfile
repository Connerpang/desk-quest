# syntax=docker/dockerfile:1
# Multi-stage build for both images. Compose picks a stage with `target`:
#   api  NestJS API (also runs migrations via `node migrate.js`)
#   web  nginx serving the Angular build and proxying /api

FROM node:24-bookworm-slim AS builder
ENV CI=true \
    NX_DAEMON=false \
    NX_NO_CLOUD=true \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store
COPY . .
RUN pnpm nx run-many -t build -p api web --configuration=production \
 && pnpm nx run api:prune

# Production dependencies only, resolved from the pruned lockfile.
FROM node:24-alpine AS api-deps
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app
COPY --from=builder /repo/dist/apps/api/package.json \
     /repo/dist/apps/api/pnpm-lock.yaml \
     /repo/dist/apps/api/pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile --store-dir /pnpm/store

FROM node:24-alpine AS api
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
WORKDIR /app
COPY --from=api-deps /app/node_modules ./node_modules
COPY --from=builder /repo/dist/apps/api/package.json \
     /repo/dist/apps/api/main.js \
     /repo/dist/apps/api/migrate.js ./
COPY --from=builder /repo/dist/apps/api/migrations ./migrations
USER node
EXPOSE 3000
CMD ["node", "main.js"]

FROM nginxinc/nginx-unprivileged:1.29-alpine AS web
COPY deployment/docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY deployment/docker/nginx/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=builder /repo/dist/apps/web/browser /usr/share/nginx/html
EXPOSE 8080
