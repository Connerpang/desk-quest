# 0006. Zod schemas as shared contracts

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

The API and the web app must agree on request and response shapes, layout
JSON and game-rule JSON. All external input must be validated on the server
(spec §20, rule 9), and configuration must fail fast.

## Decision

Define contracts as **Zod** schemas in `packages/contracts` and infer
TypeScript types from them. The API validates input with the same schemas
and generates OpenAPI from them, wired into NestJS with `nestjs-zod` from
the first endpoint that accepts input (slice 1.1). The API's environment
configuration is already a Zod schema.

## Consequences

- One source of truth; the web app and the API can't drift silently.
- Validation errors are structured. Configuration errors name the variable
  without echoing its value, since values such as `DATABASE_URL` contain
  secrets.
- Schemas must stay free of server-only code so the web bundle can import
  them.
