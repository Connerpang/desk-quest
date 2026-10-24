# 0002. Drizzle ORM and drizzle-kit migrations

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

The data model relies on PostgreSQL features that many ORMs hide or fight:
Row-Level Security policies, `SET LOCAL` tenant context inside transactions,
partial unique indexes (one active check-in per desk and per user),
composite tenant-aware foreign keys and `SELECT … FOR UPDATE`. The spec
(§12.1) also requires separate migration and runtime database roles.

## Decision

Use **Drizzle ORM** for typed queries and **drizzle-kit** to generate SQL
migrations from the schema in `packages/db`. Hand-written SQL migrations
(`drizzle-kit generate --custom`) cover what the schema can't express, such
as grants.

Two database roles:

- `app_migrator` owns the database and every schema object, and is the only
  role that runs migrations. The migrate script refuses any other role.
- `app_runtime` is what the API connects as. It has DML only (via default
  privileges set in migration 0000), never owns objects and has no
  `BYPASSRLS`, so RLS policies always apply to it.

Roles are created outside migrations: by
`deployment/compose/postgres/initdb/01-roles.sh` on a fresh Compose volume,
or by a DBA elsewhere.

## Consequences

- Queries stay close to SQL, so RLS and locking behaviour is visible in code
  review rather than hidden in ORM behaviour.
- Migrations are plain SQL files that can be reviewed, and CI scans them
  for personal-data columns (data-inventory §2.1).
- `pnpm db:check-roles` (and an integration test) fail if `app_runtime` ever
  owns an object, can create objects or gains `BYPASSRLS`.
- Drizzle is younger than Prisma or TypeORM. Its 1.0 line was still in
  release candidates during Phase 0; we stay on the stable 0.x line and plan
  a deliberate upgrade.
