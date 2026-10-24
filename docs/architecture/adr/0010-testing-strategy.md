# 0010. Testing strategy

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

The riskiest behaviour (concurrent check-ins, idempotency, RLS, role
separation, partial indexes) only shows up against a real PostgreSQL, so
mocks are not enough (spec §16.2).

## Decision

| Level       | Tool                                         | Where                        | Command                    |
| ----------- | -------------------------------------------- | ---------------------------- | -------------------------- |
| Unit        | Vitest                                       | `*.spec.ts` next to the code | `pnpm nx run-many -t test` |
| Integration | Vitest + Testcontainers Postgres 17          | `*.int.spec.ts`              | `pnpm test:integration`    |
| API         | Fastify `inject` (Supertest where needed)    | API specs                    | part of the above          |
| End-to-end  | Playwright (desktop Chromium, iPhone WebKit) | `apps/web-e2e`               | `pnpm nx e2e web-e2e`      |

`@deskquest/test-utils` provides `startTestDatabase()`: a throwaway
Postgres with the same roles as Compose and the real migrations applied.

## Consequences

- Integration tests need Docker and are kept out of the `test` target, so
  the everyday check stays fast. CI runs both.
- Testcontainers reads the Docker endpoint from the active `docker context`,
  so Rancher Desktop and Colima work without extra setup.
- CI runs the end-to-end smoke test against the full Docker Compose stack.
