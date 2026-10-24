# 0004. Nx and pnpm workspaces

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

The repository holds an Angular app, a NestJS API, an e2e suite and shared
libraries (contracts, database, test utilities). The spec's layout uses
`project.json`, which is Nx's format.

## Decision

Use an **Nx** workspace with **pnpm** (via corepack, version pinned in
`package.json`). Shared code lives in non-buildable libraries under
`packages/` and is consumed as TypeScript source through path aliases.
Projects are tagged `scope:api`, `scope:web` or `scope:shared`, and
`@nx/enforce-module-boundaries` enforces who may import what.

## Consequences

- One task graph for lint, test, typecheck and build, with local caching.
- Dependencies are declared once at the root (single-version policy).
  `apps/api/package.json` lists what the API image needs, and the
  `api:prune` target produces a production lockfile for it.
- Nx generators sometimes place build tools in `dependencies`; keep tooling
  in `devDependencies` so `pnpm audit --prod` reflects what actually ships.
- Run tasks through Nx (`pnpm nx run-many -t …`), not the underlying tools.
