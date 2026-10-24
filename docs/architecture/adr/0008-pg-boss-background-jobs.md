# 0008. pg-boss for background jobs

- **Status:** Accepted (implementation in slices 2.4 and 3.1)
- **Date:** 2026-10-23

## Context

The app needs scheduled and queued work: releasing expired check-ins,
nightly anonymisation of occupancy history, and processing the
gamification outbox. The spec (§6.2) forbids requiring Redis for core
features.

## Decision

Use **pg-boss**, a job queue backed by PostgreSQL.

## Consequences

- No extra infrastructure: a self-hosted office runs only Postgres, the API
  and the web server.
- Jobs can be enqueued in the same transaction as the data change, which
  suits the transactional outbox.
- pg-boss creates its own schema. It must run as a role that can create it
  (`app_migrator` at startup, or a dedicated migration step), while workers
  run as `app_runtime`. Settle this when slice 2.4 lands.
