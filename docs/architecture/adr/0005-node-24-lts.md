# 0005. Node.js 24 LTS

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

Node 20 reached end of life in April 2026. The project is new, so there is
no legacy runtime to support.

## Decision

Target **Node.js 24 LTS** everywhere: `.nvmrc`, the `engines` field, the CI
setup and the Docker images (`node:24-bookworm-slim` to build,
`node:24-alpine` to run).

## Consequences

- Built-in `fetch`, `--env-file` and recent V8 features are available
  (the API container's healthcheck uses `fetch`).
- Contributors must switch Node version (`nvm use`). The README says so
  because the default `node` on many machines is older.
- Node 24 is the last line that bundles corepack. When we move to a later
  Node version, install pnpm another way.
